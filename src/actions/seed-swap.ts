'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface UserLabelRow {
  id: string
  username: string | null
  display_name: string | null
}
function pickLabel(r: UserLabelRow | undefined | null): string {
  if (!r) return 'Ukendt bruger'
  return r.display_name?.trim() || r.username || 'Ukendt bruger'
}

export type SwapKind = 'offer' | 'wanted'
export type SwapStatus = 'active' | 'reserved' | 'closed'
export type SwapRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export interface SwapListing {
  id: string
  groupId: string
  userId: string
  authorLabel: string
  kind: SwapKind
  plantName: string
  variety: string | null
  seedCount: number | null
  description: string | null
  canSend: boolean
  localSwap: boolean
  status: SwapStatus
  createdAt: string
  isMine: boolean
  pendingRequestCount: number
}

export interface SwapRequest {
  id: string
  listingId: string
  requesterUserId: string
  requesterLabel: string
  message: string | null
  status: SwapRequestStatus
  createdAt: string
  resolvedAt: string | null
}

export async function getSwapListings(input: {
  groupId: string
  kind?: SwapKind
}): Promise<SwapListing[]> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  let q = supabase
    .from('seed_swap_listings')
    .select('*')
    .eq('group_id', input.groupId)
    .order('status', { ascending: true })  // active first
    .order('created_at', { ascending: false })

  if (input.kind) q = q.eq('kind', input.kind)

  const { data: rows } = await q
  if (!rows || rows.length === 0) return []

  const ids = Array.from(new Set(rows.map(r => r.user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  // Tæl pending requests pr. listing for ejerens visning
  const myListingIds = me
    ? rows.filter(r => r.user_id === me.id).map(r => r.id as string)
    : []
  const pendingByListing = new Map<string, number>()
  if (myListingIds.length > 0) {
    const { data: reqs } = await supabase
      .from('seed_swap_requests')
      .select('listing_id')
      .in('listing_id', myListingIds)
      .eq('status', 'pending')
    for (const r of (reqs ?? []) as { listing_id: string }[]) {
      pendingByListing.set(r.listing_id, (pendingByListing.get(r.listing_id) ?? 0) + 1)
    }
  }

  return rows.map(r => ({
    id: r.id as string,
    groupId: r.group_id as string,
    userId: r.user_id as string,
    authorLabel: pickLabel(byId.get(r.user_id as string)),
    kind: r.kind as SwapKind,
    plantName: r.plant_name as string,
    variety: (r.variety as string | null) ?? null,
    seedCount: (r.seed_count as number | null) ?? null,
    description: (r.description as string | null) ?? null,
    canSend: !!r.can_send,
    localSwap: !!r.local_swap,
    status: r.status as SwapStatus,
    createdAt: r.created_at as string,
    isMine: me?.id === r.user_id,
    pendingRequestCount: pendingByListing.get(r.id as string) ?? 0,
  }))
}

export async function createSwapListing(input: {
  groupId: string
  kind: SwapKind
  plantName: string
  variety?: string
  seedCount?: number
  description?: string
  canSend?: boolean
  localSwap?: boolean
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const plantName = input.plantName.trim()
  if (!plantName) return { error: 'Plantenavn er påkrævet' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('seed_swap_listings')
    .insert({
      group_id: input.groupId,
      user_id: userId,
      kind: input.kind,
      plant_name: plantName,
      variety: input.variety?.trim() || null,
      seed_count: input.seedCount != null ? Math.round(input.seedCount) : null,
      description: input.description?.trim() || null,
      can_send: input.canSend ?? true,
      local_swap: input.localSwap ?? true,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette opslag' }
  revalidatePath(`/grupper/${input.groupId}`)
  return { id: data.id as string }
}

export async function updateSwapListingStatus(
  listingId: string,
  status: SwapStatus
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('seed_swap_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .select('group_id')
    .maybeSingle()
  if (error) return { error: error.message }
  if (data?.group_id) revalidatePath(`/grupper/${data.group_id}`)
  return { ok: true }
}

export async function deleteSwapListing(
  listingId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from('seed_swap_listings')
    .select('group_id')
    .eq('id', listingId)
    .maybeSingle()
  const { error } = await supabase
    .from('seed_swap_listings')
    .delete()
    .eq('id', listingId)
  if (error) return { error: error.message }
  if (listing?.group_id) revalidatePath(`/grupper/${listing.group_id}`)
  return { ok: true }
}

export async function requestSwap(input: {
  listingId: string
  message?: string
}): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from('seed_swap_listings')
    .select('group_id')
    .eq('id', input.listingId)
    .maybeSingle()
  if (!listing) return { error: 'Opslag findes ikke' }

  const { error } = await supabase
    .from('seed_swap_requests')
    .insert({
      listing_id: input.listingId,
      requester_user_id: (await requireUser()).id,
      message: input.message?.trim() || null,
    })
  if (error) {
    if (error.code === '23505') return { error: 'Du har allerede en ventende forespørgsel på dette opslag' }
    return { error: error.message }
  }

  revalidatePath(`/grupper/${listing.group_id}`)
  return { ok: true }
}

export async function resolveSwapRequest(
  requestId: string,
  decision: 'accepted' | 'declined'
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('seed_swap_requests')
    .select('listing_id, seed_swap_listings!inner(group_id, user_id)')
    .eq('id', requestId)
    .maybeSingle()
  if (!req) return { error: 'Forespørgsel findes ikke' }

  const { error } = await supabase
    .from('seed_swap_requests')
    .update({ status: decision, resolved_at: new Date().toISOString() })
    .eq('id', requestId)
  if (error) return { error: error.message }

  // Hvis accepteret: marker listing som reserveret
  if (decision === 'accepted') {
    await supabase
      .from('seed_swap_listings')
      .update({ status: 'reserved', updated_at: new Date().toISOString() })
      .eq('id', req.listing_id as string)
  }

  type ListingRef = { group_id: string }
  const ls = req.seed_swap_listings as ListingRef | ListingRef[] | null
  const groupId = Array.isArray(ls) ? ls[0]?.group_id : ls?.group_id
  if (groupId) revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function cancelSwapRequest(
  requestId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('seed_swap_requests')
    .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
    .eq('id', requestId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function getSwapRequestsForListing(listingId: string): Promise<SwapRequest[]> {
  await requireUser()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('seed_swap_requests')
    .select('id, listing_id, requester_user_id, message, status, created_at, resolved_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true })
  if (!rows || rows.length === 0) return []

  const ids = Array.from(new Set(rows.map(r => r.requester_user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return rows.map(r => ({
    id: r.id as string,
    listingId: r.listing_id as string,
    requesterUserId: r.requester_user_id as string,
    requesterLabel: pickLabel(byId.get(r.requester_user_id as string)),
    message: (r.message as string | null) ?? null,
    status: r.status as SwapRequestStatus,
    createdAt: r.created_at as string,
    resolvedAt: (r.resolved_at as string | null) ?? null,
  }))
}
