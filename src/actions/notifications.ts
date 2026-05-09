'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string
  isRead: boolean
  createdAt: string
}

/**
 * Liste over current users notifikationer (nyeste først, max 30).
 */
export async function getMyNotifications(): Promise<Notification[]> {
  const me = await getCurrentUser()
  if (!me) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(30)
  return ((data ?? []) as Array<{
    id: string
    type: string
    title: string
    body: string | null
    link: string
    is_read: boolean
    created_at: string
  }>).map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    link: r.link,
    isRead: r.is_read,
    createdAt: r.created_at,
  }))
}

/**
 * Antal ulæste — bruges til badge i topbar.
 */
export async function getUnreadCount(): Promise<number> {
  const me = await getCurrentUser()
  if (!me) return 0
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', me.id)
    .eq('is_read', false)
  return count ?? 0
}

/**
 * Antal ulæste pr. gruppe — bruges til badge på gruppe-kort.
 * Returnerer Map<groupId, count> for ulæste notifikationer der har
 * en group_id reference.
 */
export async function getUnreadCountsByGroup(): Promise<Map<string, number>> {
  const me = await getCurrentUser()
  if (!me) return new Map()
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('group_id')
    .eq('user_id', me.id)
    .eq('is_read', false)
    .not('group_id', 'is', null)

  const counts = new Map<string, number>()
  for (const r of (data ?? []) as { group_id: string }[]) {
    counts.set(r.group_id, (counts.get(r.group_id) ?? 0) + 1)
  }
  return counts
}

export async function markNotificationRead(id: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/grupper')
  return { ok: true }
}

export async function markAllNotificationsRead(): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/grupper')
  return { ok: true }
}

/**
 * Markér alle ulæste notifikationer for en specifik gruppe som læst.
 * Bruges når brugeren navigerer ind i gruppen — så kort-badgen ikke
 * vedbliver med at blinke efter at indholdet er set.
 */
export async function markGroupNotificationsRead(groupId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('group_id', groupId)
  if (error) return { error: error.message }
  revalidatePath('/grupper')
  return { ok: true }
}

export async function deleteNotification(id: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) return { error: error.message }
  return { ok: true }
}
