'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

import type { VarietyStatus } from '@/lib/varieties-shared'
export type { VarietyStatus } from '@/lib/varieties-shared'

export interface GroupVariety {
  id: string
  groupId: string
  plantName: string
  variety: string | null
  latinName: string | null
  description: string | null
  primaryImageUrl: string | null
  guideId: string | null
  createdBy: string
  createdAt: string
  /** Aggregat-statistik (kun udfyldt af list-funktioner) */
  stats: {
    growing: number
    grown: number
    wantToGrow: number
    hasSeed: number
    seekingSeed: number
    images: number
    posts: number
  }
  myStatuses: VarietyStatus[]
}

interface UserLabelRow {
  id: string
  username: string | null
  display_name: string | null
}

function emptyStats(): GroupVariety['stats'] {
  return { growing: 0, grown: 0, wantToGrow: 0, hasSeed: 0, seekingSeed: 0, images: 0, posts: 0 }
}

interface VarietyRow {
  id: string
  group_id: string
  plant_name: string
  variety: string | null
  latin_name: string | null
  description: string | null
  primary_image_url: string | null
  guide_id: string | null
  created_by: string
  created_at: string
}

function mapRow(r: VarietyRow): GroupVariety {
  return {
    id: r.id,
    groupId: r.group_id,
    plantName: r.plant_name,
    variety: r.variety,
    latinName: r.latin_name,
    description: r.description,
    primaryImageUrl: r.primary_image_url,
    guideId: r.guide_id,
    createdBy: r.created_by,
    createdAt: r.created_at,
    stats: emptyStats(),
    myStatuses: [],
  }
}

const STATUS_TO_KEY: Record<VarietyStatus, keyof GroupVariety['stats']> = {
  dyrker: 'growing',
  har_dyrket: 'grown',
  vil_dyrke: 'wantToGrow',
  har_froe: 'hasSeed',
  soeger_froe: 'seekingSeed',
}

export async function getGroupVarieties(groupId: string): Promise<GroupVariety[]> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('group_varieties')
    .select('*')
    .eq('group_id', groupId)
    .order('plant_name', { ascending: true })
    .order('variety', { ascending: true, nullsFirst: false })
  if (!rows || rows.length === 0) return []

  const ids = rows.map(r => r.id as string)

  // Aggregér statusser pr. variety
  const { data: statuses } = await supabase
    .from('user_variety_status')
    .select('variety_id, status, user_id')
    .in('variety_id', ids)

  // Tæl forum-posts pr. variety
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('variety_id, image_urls')
    .in('variety_id', ids)

  const out = (rows as VarietyRow[]).map(mapRow)
  const byId = new Map(out.map(v => [v.id, v]))

  for (const s of (statuses ?? []) as { variety_id: string; status: VarietyStatus; user_id: string }[]) {
    const v = byId.get(s.variety_id)
    if (!v) continue
    const key = STATUS_TO_KEY[s.status]
    v.stats[key] += 1
    if (me && s.user_id === me.id) v.myStatuses.push(s.status)
  }
  for (const p of (posts ?? []) as { variety_id: string; image_urls: string[] | null }[]) {
    const v = byId.get(p.variety_id)
    if (!v) continue
    v.stats.posts += 1
    v.stats.images += (p.image_urls ?? []).length
  }

  return out
}

export async function getVariety(varietyId: string): Promise<GroupVariety | null> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  const { data: r } = await supabase
    .from('group_varieties')
    .select('*')
    .eq('id', varietyId)
    .maybeSingle()
  if (!r) return null

  const v = mapRow(r as VarietyRow)

  const { data: statuses } = await supabase
    .from('user_variety_status')
    .select('status, user_id')
    .eq('variety_id', varietyId)
  for (const s of (statuses ?? []) as { status: VarietyStatus; user_id: string }[]) {
    v.stats[STATUS_TO_KEY[s.status]] += 1
    if (me && s.user_id === me.id) v.myStatuses.push(s.status)
  }

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, image_urls')
    .eq('variety_id', varietyId)
  for (const p of (posts ?? []) as { id: string; image_urls: string[] | null }[]) {
    v.stats.posts += 1
    v.stats.images += (p.image_urls ?? []).length
  }

  return v
}

export interface VarietyMember {
  userId: string
  label: string
  statuses: VarietyStatus[]
}

export async function getVarietyMembers(varietyId: string): Promise<VarietyMember[]> {
  await requireUser()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('user_variety_status')
    .select('user_id, status')
    .eq('variety_id', varietyId)
  if (!rows || rows.length === 0) return []

  const userIds = Array.from(new Set(rows.map(r => r.user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: userIds })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  const grouped = new Map<string, VarietyMember>()
  for (const r of rows as { user_id: string; status: VarietyStatus }[]) {
    let m = grouped.get(r.user_id)
    if (!m) {
      const label = byId.get(r.user_id)
      m = {
        userId: r.user_id,
        label: label?.display_name?.trim() || label?.username || 'Ukendt bruger',
        statuses: [],
      }
      grouped.set(r.user_id, m)
    }
    m.statuses.push(r.status)
  }
  return Array.from(grouped.values())
}

export async function createVariety(input: {
  groupId: string
  plantName: string
  variety?: string
  latinName?: string
  description?: string
  primaryImageUrl?: string
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const plantName = input.plantName.trim()
  if (!plantName) return { error: 'Plantenavn er påkrævet' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('group_varieties')
    .insert({
      group_id: input.groupId,
      plant_name: plantName,
      variety: input.variety?.trim() || null,
      latin_name: input.latinName?.trim() || null,
      description: input.description?.trim() || null,
      primary_image_url: input.primaryImageUrl ?? null,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) {
    if (error?.code === '23505') return { error: 'Denne sort er allerede tilføjet til gruppen' }
    return { error: error?.message ?? 'Kunne ikke oprette sort' }
  }
  revalidatePath(`/grupper/${input.groupId}`)
  return { id: data.id as string }
}

export async function deleteVariety(varietyId: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data: v } = await supabase
    .from('group_varieties')
    .select('group_id')
    .eq('id', varietyId)
    .maybeSingle()
  const { error } = await supabase
    .from('group_varieties')
    .delete()
    .eq('id', varietyId)
  if (error) return { error: error.message }
  if (v?.group_id) revalidatePath(`/grupper/${v.group_id}`)
  return { ok: true }
}

export async function setVarietyStatus(input: {
  varietyId: string
  status: VarietyStatus
  enabled: boolean
}): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  if (input.enabled) {
    const { error } = await supabase
      .from('user_variety_status')
      .insert({ user_id: userId, variety_id: input.varietyId, status: input.status })
    if (error && error.code !== '23505') return { error: error.message }
  } else {
    const { error } = await supabase
      .from('user_variety_status')
      .delete()
      .eq('user_id', userId)
      .eq('variety_id', input.varietyId)
      .eq('status', input.status)
    if (error) return { error: error.message }
  }

  // Find group_id for revalidation
  const { data: v } = await supabase
    .from('group_varieties')
    .select('group_id')
    .eq('id', input.varietyId)
    .maybeSingle()
  if (v?.group_id) revalidatePath(`/grupper/${v.group_id}`)
  return { ok: true }
}
