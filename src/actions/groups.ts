'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type GroupType = 'private' | 'interest'
export type GroupVisibility = 'open' | 'closed' | 'hidden'
export type ForumMode = 'simple_chat' | 'structured_forum'

export interface UserGroup {
  id: string
  name: string
  description: string | null
  rules: string | null
  groupType: GroupType
  visibility: GroupVisibility
  forumMode: ForumMode
  /** @deprecated bruges ikke længere — bevares kun for migration-compat */
  category: string | null
  tags: string[]
  focusPlants: string[]
  icon: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  myRole: 'owner' | 'member' | null  // null = not a member (kun discoverable)
  memberCount: number
}

export interface GroupMember {
  userId: string
  role: 'owner' | 'member'
  label: string
  joinedAt: string
}

interface UserLabelRow {
  id: string
  username: string | null
  display_name: string | null
}

function pickLabel(r: UserLabelRow | undefined | null): string {
  if (!r) return 'Ukendt bruger'
  return r.display_name?.trim() || r.username || 'Ukendt bruger'
}

/**
 * Opret en ny gruppe og tilføj current user som owner. Bruger en
 * SECURITY DEFINER-RPC så gruppe + ejer-membership oprettes atomisk
 * og bypass'er RLS-problemer på første-gang-insert.
 */
export async function createGroup(input: {
  name: string
  description?: string
  groupType: GroupType
  visibility?: GroupVisibility
  tags?: string[]
  focusPlants?: string[]
}): Promise<{ id: string } | { error: string }> {
  await requireUser()
  const name = input.name.trim()
  if (!name) return { error: 'Gruppenavn er påkrævet' }
  if (name.length > 100) return { error: 'Gruppenavn er for langt' }
  if (input.tags && input.tags.length > 5) return { error: 'Maks. 5 tags pr. gruppe' }
  if (input.focusPlants && input.focusPlants.length > 5) return { error: 'Maks. 5 fokusplanter pr. gruppe' }

  const cleanFocusPlants = (input.focusPlants ?? [])
    .map(s => s.trim())
    .filter(Boolean)

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('create_user_group', {
      p_name: name,
      p_description: input.description?.trim() || null,
      p_group_type: input.groupType,
      p_visibility: input.visibility ?? null,
      p_category: null,
      p_forum_mode: null,
      p_tags: input.tags ?? [],
      p_focus_plants: cleanFocusPlants,
    })
  if (error) return { error: error.message }
  if (!data) return { error: 'Kunne ikke oprette gruppe' }

  revalidatePath('/grupper')
  revalidatePath('/grupper/udforsk')
  // Fire-and-forget badge
  const { id: userId } = await requireUser()
  const { maybeAwardCommunityStarter } = await import('@/actions/badges')
  maybeAwardCommunityStarter(userId).catch(() => {})
  return { id: data as string }
}

/**
 * Autocomplete: foreslå plantenavne fra master-/bruger-guides matchende
 * en søgestreng. Bruges i create-group-dialog og settings-dialog.
 */
export async function suggestFocusPlants(query: string): Promise<string[]> {
  await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .rpc('suggest_focus_plants', { p_query: query.trim(), p_limit: 10 })
  return ((data as { plant_name: string }[] | null) ?? []).map(r => r.plant_name)
}

/**
 * Tilslut en åben interessegruppe direkte (ingen invitation nødvendig).
 */
export async function joinOpenGroup(groupId: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.rpc('join_open_group', { p_group_id: groupId })
  if (error) return { error: error.message }
  revalidatePath('/grupper')
  revalidatePath('/grupper/udforsk')
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function updateGroup(
  groupId: string,
  input: { name: string; description?: string }
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const name = input.name.trim()
  if (!name) return { error: 'Gruppenavn er påkrævet' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_groups')
    .update({
      name,
      description: input.description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)

  if (error) return { error: error.message }
  revalidatePath('/grupper')
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function deleteGroup(groupId: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_groups')
    .delete()
    .eq('id', groupId)
  if (error) return { error: error.message }
  revalidatePath('/grupper')
  return { ok: true }
}

/**
 * Tilføj et medlem til en gruppe via brugernavn. Owner-kun (RLS).
 */
export async function addGroupMember(
  groupId: string,
  username: string
): Promise<{ ok: true; member: GroupMember } | { error: string }> {
  await requireUser()
  const cleanUsername = username.trim().toLowerCase()
  if (!cleanUsername) return { error: 'Skriv et brugernavn' }
  if (cleanUsername.length < 3) return { error: 'Brugernavn er for kort' }

  const supabase = await createClient()
  const { data: lookup, error: rpcErr } = await supabase
    .rpc('find_user_by_username', { p_username: cleanUsername })
  if (rpcErr) return { error: 'Kunne ikke slå brugernavn op' }
  const target = (lookup as UserLabelRow[])[0]
  if (!target) return { error: `Ingen bruger med brugernavn "${cleanUsername}"` }

  const { error } = await supabase
    .from('user_group_memberships')
    .insert({ group_id: groupId, user_id: target.id, role: 'member' })
  if (error) {
    if (error.code === '23505') return { error: 'Brugeren er allerede medlem' }
    return { error: error.message }
  }

  revalidatePath(`/grupper/${groupId}`)
  return {
    ok: true,
    member: {
      userId: target.id,
      role: 'member',
      label: pickLabel(target),
      joinedAt: new Date().toISOString(),
    },
  }
}

export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_group_memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

/**
 * Forlad en gruppe. Owners kan kun forlade hvis der er en anden owner — ellers
 * skal de slette gruppen. (RLS lader dem fjerne sig selv, men UI'en bør guide.)
 */
export async function leaveGroup(groupId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_group_memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/grupper')
  return { ok: true }
}

export async function getMyGroups(): Promise<UserGroup[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Hent grupper jeg er medlem af + min rolle
  const { data: myMemberships } = await supabase
    .from('user_group_memberships')
    .select('group_id, role')
    .eq('user_id', userId)
  if (!myMemberships || myMemberships.length === 0) return []

  const groupIds = myMemberships.map(m => m.group_id as string)
  const myRoleByGroup = new Map(myMemberships.map(m => [m.group_id as string, m.role as 'owner' | 'member']))

  const { data: groups } = await supabase
    .from('user_groups')
    .select('*')
    .in('id', groupIds)
    .order('name', { ascending: true })

  // Tæl medlemmer pr. gruppe
  const { data: allMembers } = await supabase
    .from('user_group_memberships')
    .select('group_id')
    .in('group_id', groupIds)
  const counts = new Map<string, number>()
  for (const m of allMembers ?? []) {
    const id = m.group_id as string
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return (groups ?? []).map(g => ({
    id: g.id as string,
    name: g.name as string,
    description: (g.description as string | null) ?? null,
    rules: (g.rules as string | null) ?? null,
    groupType: (g.group_type as GroupType | null) ?? 'private',
    visibility: (g.visibility as GroupVisibility | null) ?? 'hidden',
    forumMode: (g.forum_mode as ForumMode | null) ?? 'simple_chat',
    category: (g.category as string | null) ?? null,
    tags: (g.tags as string[] | null) ?? [],
    focusPlants: (g.focus_plants as string[] | null) ?? [],
    icon: (g.icon as string | null) ?? null,
    createdBy: g.created_by as string,
    createdAt: g.created_at as string,
    updatedAt: g.updated_at as string,
    myRole: myRoleByGroup.get(g.id as string) ?? 'member',
    memberCount: counts.get(g.id as string) ?? 0,
  }))
}

export async function getGroup(groupId: string): Promise<UserGroup | null> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: g } = await supabase
    .from('user_groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle()
  if (!g) return null

  // Hent membership (kan være null for ikke-medlemmer der ser åbne/closed
  // interessegrupper via discoverable-policy).
  const { data: myRow } = await supabase
    .from('user_group_memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  const { count } = await supabase
    .from('user_group_memberships')
    .select('user_id', { count: 'exact', head: true })
    .eq('group_id', groupId)

  return {
    id: g.id as string,
    name: g.name as string,
    description: (g.description as string | null) ?? null,
    rules: (g.rules as string | null) ?? null,
    groupType: (g.group_type as GroupType | null) ?? 'private',
    visibility: (g.visibility as GroupVisibility | null) ?? 'hidden',
    forumMode: (g.forum_mode as ForumMode | null) ?? 'simple_chat',
    category: (g.category as string | null) ?? null,
    tags: (g.tags as string[] | null) ?? [],
    focusPlants: (g.focus_plants as string[] | null) ?? [],
    icon: (g.icon as string | null) ?? null,
    createdBy: g.created_by as string,
    createdAt: g.created_at as string,
    updatedAt: g.updated_at as string,
    myRole: myRow ? (myRow.role as 'owner' | 'member') : null,
    memberCount: count ?? 0,
  }
}

/**
 * Discoverable interessegrupper (open + closed). Til /grupper/udforsk.
 * Filtrér på tags, fokusplante og fritekst-søgning.
 */
export async function getDiscoverableGroups(filters?: {
  tags?: string[]
  focusPlant?: string
  search?: string
}): Promise<UserGroup[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  let q = supabase
    .from('user_groups')
    .select('*')
    .eq('group_type', 'interest')
    .in('visibility', ['open', 'closed'])
    .order('name', { ascending: true })

  if (filters?.tags && filters.tags.length > 0) {
    // Overlap: gruppen har mindst én af de valgte tags
    q = q.overlaps('tags', filters.tags)
  }
  if (filters?.focusPlant?.trim()) {
    // Match hvis fokusplante-arrayet har et element der ILIKE'r søgningen
    const fp = filters.focusPlant.trim()
    q = q.contains('focus_plants', [fp])
  }
  if (filters?.search?.trim()) {
    const s = filters.search.trim()
    q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`)
  }

  const { data: groups } = await q
  if (!groups || groups.length === 0) return []

  const groupIds = groups.map(g => g.id as string)

  // Tæl medlemmer
  const { data: allMembers } = await supabase
    .from('user_group_memberships')
    .select('group_id, user_id')
    .in('group_id', groupIds)
  const counts = new Map<string, number>()
  const myRoleByGroup = new Map<string, 'owner' | 'member'>()
  for (const m of (allMembers ?? []) as { group_id: string; user_id: string }[]) {
    counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1)
  }
  // Min rolle (sub-query: vi kan kun se egne memberships med RLS, så vi henter dem separat)
  const { data: myMemberships } = await supabase
    .from('user_group_memberships')
    .select('group_id, role')
    .eq('user_id', userId)
    .in('group_id', groupIds)
  for (const m of (myMemberships ?? []) as { group_id: string; role: string }[]) {
    myRoleByGroup.set(m.group_id, m.role as 'owner' | 'member')
  }

  return groups.map(g => ({
    id: g.id as string,
    name: g.name as string,
    description: (g.description as string | null) ?? null,
    rules: (g.rules as string | null) ?? null,
    groupType: g.group_type as GroupType,
    visibility: g.visibility as GroupVisibility,
    forumMode: g.forum_mode as ForumMode,
    category: (g.category as string | null) ?? null,
    tags: (g.tags as string[] | null) ?? [],
    focusPlants: (g.focus_plants as string[] | null) ?? [],
    icon: (g.icon as string | null) ?? null,
    createdBy: g.created_by as string,
    createdAt: g.created_at as string,
    updatedAt: g.updated_at as string,
    myRole: myRoleByGroup.get(g.id as string) ?? null,
    memberCount: counts.get(g.id as string) ?? 0,
  }))
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  await requireUser()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('user_group_memberships')
    .select('user_id, role, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (!rows || rows.length === 0) return []

  const ids = rows.map(r => r.user_id as string)
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return rows.map(r => ({
    userId: r.user_id as string,
    role: r.role as 'owner' | 'member',
    label: pickLabel(byId.get(r.user_id as string)),
    joinedAt: r.joined_at as string,
  }))
}
