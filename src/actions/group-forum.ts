'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ForumPostType, ForumCategoryId } from '@/lib/constants'

interface UserLabelRow {
  id: string
  username: string | null
  display_name: string | null
}
function pickLabel(r: UserLabelRow | undefined | null): string {
  if (!r) return 'Ukendt bruger'
  return r.display_name?.trim() || r.username || 'Ukendt bruger'
}

export interface ForumPost {
  id: string
  groupId: string
  userId: string
  authorLabel: string
  postType: ForumPostType
  category: ForumCategoryId
  title: string
  body: string | null
  imageUrls: string[]
  isPinned: boolean
  isLocked: boolean
  bestReplyId: string | null
  replyCount: number
  lastActivityAt: string
  createdAt: string
  isMine: boolean
}

export interface ForumReply {
  id: string
  postId: string
  userId: string
  authorLabel: string
  body: string
  imageUrl: string | null
  createdAt: string
  isMine: boolean
  isBestReply: boolean
}

export async function getForumPosts(input: {
  groupId: string
  category?: ForumCategoryId
  varietyId?: string
}): Promise<ForumPost[]> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  let q = supabase
    .from('forum_posts')
    .select('*')
    .eq('group_id', input.groupId)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .limit(50)

  if (input.category) q = q.eq('category', input.category)
  if (input.varietyId) q = q.eq('variety_id', input.varietyId)

  const { data: rows } = await q
  if (!rows || rows.length === 0) return []

  const ids = Array.from(new Set(rows.map(r => r.user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return rows.map(r => ({
    id: r.id as string,
    groupId: r.group_id as string,
    userId: r.user_id as string,
    authorLabel: pickLabel(byId.get(r.user_id as string)),
    postType: r.post_type as ForumPostType,
    category: r.category as ForumCategoryId,
    title: r.title as string,
    body: (r.body as string | null) ?? null,
    imageUrls: (r.image_urls as string[] | null) ?? [],
    isPinned: !!r.is_pinned,
    isLocked: !!r.is_locked,
    bestReplyId: (r.best_reply_id as string | null) ?? null,
    replyCount: (r.reply_count as number | null) ?? 0,
    lastActivityAt: r.last_activity_at as string,
    createdAt: r.created_at as string,
    isMine: me?.id === r.user_id,
  }))
}

export async function getForumPost(postId: string): Promise<ForumPost | null> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  const { data: r } = await supabase
    .from('forum_posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle()
  if (!r) return null

  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: [r.user_id] })
  const author = (labels as UserLabelRow[] | null)?.[0]

  return {
    id: r.id as string,
    groupId: r.group_id as string,
    userId: r.user_id as string,
    authorLabel: pickLabel(author),
    postType: r.post_type as ForumPostType,
    category: r.category as ForumCategoryId,
    title: r.title as string,
    body: (r.body as string | null) ?? null,
    imageUrls: (r.image_urls as string[] | null) ?? [],
    isPinned: !!r.is_pinned,
    isLocked: !!r.is_locked,
    bestReplyId: (r.best_reply_id as string | null) ?? null,
    replyCount: (r.reply_count as number | null) ?? 0,
    lastActivityAt: r.last_activity_at as string,
    createdAt: r.created_at as string,
    isMine: me?.id === r.user_id,
  }
}

export async function getForumReplies(postId: string): Promise<ForumReply[]> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  // Hent post for at kende best_reply_id
  const { data: post } = await supabase
    .from('forum_posts')
    .select('best_reply_id')
    .eq('id', postId)
    .maybeSingle()
  const bestReplyId = (post?.best_reply_id as string | null) ?? null

  const { data: rows } = await supabase
    .from('forum_replies')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (!rows || rows.length === 0) return []

  const ids = Array.from(new Set(rows.map(r => r.user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return rows.map(r => ({
    id: r.id as string,
    postId: r.post_id as string,
    userId: r.user_id as string,
    authorLabel: pickLabel(byId.get(r.user_id as string)),
    body: r.body as string,
    imageUrl: (r.image_url as string | null) ?? null,
    createdAt: r.created_at as string,
    isMine: me?.id === r.user_id,
    isBestReply: r.id === bestReplyId,
  }))
}

export async function createForumPost(input: {
  groupId: string
  postType: ForumPostType
  category: ForumCategoryId
  title: string
  body?: string
  imageUrls?: string[]
  varietyId?: string
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const title = input.title.trim()
  if (!title) return { error: 'Titel er påkrævet' }
  if (title.length > 200) return { error: 'Titlen er for lang' }

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      group_id: input.groupId,
      user_id: userId,
      post_type: input.postType,
      category: input.category,
      title,
      body: input.body?.trim() || null,
      image_urls: input.imageUrls && input.imageUrls.length > 0 ? input.imageUrls : [],
      variety_id: input.varietyId ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: dataFejlBesked(error, 'Kunne ikke oprette opslag') }
  revalidatePath(`/grupper/${input.groupId}`)
  // Fire-and-forget badge-tildeling
  const { maybeAwardFirstPost } = await import('@/actions/badges')
  maybeAwardFirstPost(userId).catch(() => {})
  return { id: data.id as string }
}

export async function deleteForumPost(
  postId: string,
  groupId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', postId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke slette indlægget. Prøv igen.') }
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function togglePostPinned(
  postId: string,
  groupId: string,
  pinned: boolean
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('forum_posts')
    .update({ is_pinned: pinned })
    .eq('id', postId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke ændre, om indlægget er fastgjort. Prøv igen.') }
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function togglePostLocked(
  postId: string,
  groupId: string,
  locked: boolean
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('forum_posts')
    .update({ is_locked: locked })
    .eq('id', postId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke ændre, om indlægget er låst. Prøv igen.') }
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function postReply(input: {
  postId: string
  body: string
  imageUrl?: string
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const body = input.body.trim()
  if (!body) return { error: 'Skriv et svar' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('forum_replies')
    .insert({
      post_id: input.postId,
      user_id: userId,
      body,
      image_url: input.imageUrl?.trim() || null,
    })
    .select('id')
    .single()
  if (error || !data) return { error: dataFejlBesked(error, 'Kunne ikke gemme svar') }

  // Hent post-ets group_id til revalidation
  const { data: post } = await supabase
    .from('forum_posts')
    .select('group_id')
    .eq('id', input.postId)
    .maybeSingle()
  if (post) revalidatePath(`/grupper/${post.group_id}`)
  return { id: data.id as string }
}

export async function deleteReply(
  replyId: string,
  postId: string
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('forum_replies')
    .delete()
    .eq('id', replyId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke slette svaret. Prøv igen.') }

  const { data: post } = await supabase
    .from('forum_posts')
    .select('group_id')
    .eq('id', postId)
    .maybeSingle()
  if (post) revalidatePath(`/grupper/${post.group_id}`)
  return { ok: true }
}

export async function markBestReply(
  postId: string,
  replyId: string | null
): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('forum_posts')
    .update({ best_reply_id: replyId })
    .eq('id', postId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke markere bedste svar. Prøv igen.') }

  const { data: post } = await supabase
    .from('forum_posts')
    .select('group_id')
    .eq('id', postId)
    .maybeSingle()
  if (post) revalidatePath(`/grupper/${post.group_id}`)

  // Fire-and-forget: hvis der blev sat et bedste-svar, tildel helpful-badge
  if (replyId) {
    const { data: reply } = await supabase
      .from('forum_replies')
      .select('user_id')
      .eq('id', replyId)
      .maybeSingle()
    if (reply?.user_id) {
      const { maybeAwardHelpful } = await import('@/actions/badges')
      maybeAwardHelpful(reply.user_id as string).catch(() => {})
    }
  }
  return { ok: true }
}
