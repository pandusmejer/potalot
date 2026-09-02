'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { createTask } from '@/actions/havekalender'

export interface ChatMessage {
  id: string
  groupId: string
  userId: string
  authorLabel: string
  body: string | null
  imageUrl: string | null
  createdAt: string
  isMine: boolean
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
 * Hent seneste 100 beskeder i en gruppe — ældste først (chat-rækkefølge).
 */
export async function getChatMessages(groupId: string): Promise<ChatMessage[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('group_chat_messages')
    .select('id, group_id, user_id, body, image_url, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (!rows || rows.length === 0) return []

  const ids = Array.from(new Set(rows.map(r => r.user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  // Reverse → ældste først
  return rows
    .map(r => ({
      id: r.id as string,
      groupId: r.group_id as string,
      userId: r.user_id as string,
      authorLabel: pickLabel(byId.get(r.user_id as string)),
      body: (r.body as string | null) ?? null,
      imageUrl: (r.image_url as string | null) ?? null,
      createdAt: r.created_at as string,
      isMine: r.user_id === userId,
    }))
    .reverse()
}

export async function postChatMessage(input: {
  groupId: string
  body?: string
  imageUrl?: string
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const body = input.body?.trim() || null
  const imageUrl = input.imageUrl?.trim() || null
  if (!body && !imageUrl) return { error: 'Skriv en besked eller vedhæft et billede' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('group_chat_messages')
    .insert({
      group_id: input.groupId,
      user_id: userId,
      body,
      image_url: imageUrl,
    })
    .select('id')
    .single()

  if (error || !data) return { error: dataFejlBesked(error, 'Kunne ikke sende besked') }

  revalidatePath(`/grupper/${input.groupId}`)
  return { id: data.id as string }
}

export async function deleteChatMessage(
  messageId: string,
  groupId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('group_chat_messages')
    .delete()
    .eq('id', messageId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke slette beskeden. Prøv igen.') }
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

/**
 * Lav en kalender-opgave for current user baseret på en chat-besked.
 * Beskedens body bruges som titel; brugeren angiver dato.
 */
export async function createTaskFromChatMessage(input: {
  body: string
  date: string
  groupId: string
  groupName: string
}): Promise<{ id: string } | { error: string }> {
  const title = input.body.trim().slice(0, 200)
  if (!title) return { error: 'Beskeden er tom' }

  const res = await createTask({
    title,
    date: input.date,
    description: `Fra chat i ${input.groupName}`,
    taskType: 'custom',
    priority: 'medium',
    source: 'manual',
  })
  if ('error' in res) return { error: res.error }
  return { id: res.id }
}
