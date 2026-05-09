'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface UserGroup {
  id: string
  name: string
  description: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  myRole: 'owner' | 'member'
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
}): Promise<{ id: string } | { error: string }> {
  await requireUser()
  const name = input.name.trim()
  if (!name) return { error: 'Gruppenavn er påkrævet' }
  if (name.length > 100) return { error: 'Gruppenavn er for langt' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('create_user_group', {
      p_name: name,
      p_description: input.description?.trim() || null,
    })
  if (error) return { error: error.message }
  if (!data) return { error: 'Kunne ikke oprette gruppe' }

  revalidatePath('/grupper')
  return { id: data as string }
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

  const { data: myRow } = await supabase
    .from('user_group_memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!myRow) return null  // bruger er ikke medlem

  const { count } = await supabase
    .from('user_group_memberships')
    .select('user_id', { count: 'exact', head: true })
    .eq('group_id', groupId)

  return {
    id: g.id as string,
    name: g.name as string,
    description: (g.description as string | null) ?? null,
    createdBy: g.created_by as string,
    createdAt: g.created_at as string,
    updatedAt: g.updated_at as string,
    myRole: myRow.role as 'owner' | 'member',
    memberCount: count ?? 0,
  }
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
