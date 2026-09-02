'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser } from '@/lib/auth'
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

export interface JoinRequest {
  userId: string
  label: string
  message: string | null
  requestedAt: string
}

export interface InvitationLookup {
  groupId: string
  groupName: string
  groupDescription: string | null
  groupType: 'private' | 'interest'
  visibility: 'open' | 'closed' | 'hidden'
  memberCount: number
  isMember: boolean
  hasPendingRequest: boolean
}

export async function getOrCreateInvitationToken(
  groupId: string
): Promise<{ token: string } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('get_or_create_group_invitation', { p_group_id: groupId })
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke lave et invitationslink. Prøv igen.') }
  return { token: data as string }
}

export async function rotateInvitationToken(
  groupId: string
): Promise<{ token: string } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('rotate_group_invitation', { p_group_id: groupId })
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke forny invitationslinket. Prøv igen.') }
  return { token: data as string }
}

export async function lookupInvitation(token: string): Promise<InvitationLookup | null> {
  await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .rpc('lookup_invitation', { p_token: token })
  const row = (data as Array<{
    group_id: string
    group_name: string
    group_description: string | null
    group_type: string
    visibility: string
    member_count: number | string
    is_member: boolean
    has_pending_request: boolean
  }> | null)?.[0]
  if (!row) return null
  return {
    groupId: row.group_id,
    groupName: row.group_name,
    groupDescription: row.group_description,
    groupType: row.group_type as 'private' | 'interest',
    visibility: row.visibility as 'open' | 'closed' | 'hidden',
    memberCount: Number(row.member_count) || 0,
    isMember: !!row.is_member,
    hasPendingRequest: !!row.has_pending_request,
  }
}

export async function submitJoinRequest(input: {
  token: string
  message?: string
}): Promise<{ groupId: string } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('submit_join_request', { p_token: input.token, p_message: input.message ?? null })
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke sende din anmodning. Prøv igen.') }
  if (!data) return { error: 'Kunne ikke indsende anmodning' }
  revalidatePath(`/grupper/${data}`)
  return { groupId: data as string }
}

export async function getPendingJoinRequests(groupId: string): Promise<JoinRequest[]> {
  await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_join_requests')
    .select('user_id, message, requested_at')
    .eq('group_id', groupId)
    .order('requested_at', { ascending: true })
  if (!data || data.length === 0) return []

  const ids = data.map(r => r.user_id as string)
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return data.map(r => ({
    userId: r.user_id as string,
    label: pickLabel(byId.get(r.user_id as string)),
    message: (r.message as string | null) ?? null,
    requestedAt: r.requested_at as string,
  }))
}

export async function approveJoinRequest(
  groupId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .rpc('approve_join_request', { p_group_id: groupId, p_user_id: userId })
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke godkende anmodningen. Prøv igen.') }
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function declineJoinRequest(
  groupId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('group_join_requests')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke afvise anmodningen. Prøv igen.') }
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}
