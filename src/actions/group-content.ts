'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

interface UserLabelRow {
  id: string
  username: string | null
  display_name: string | null
}
function pickLabel(r: UserLabelRow | undefined | null): string {
  if (!r) return 'Ukendt bruger'
  return r.display_name?.trim() || r.username || 'Ukendt bruger'
}

export interface GroupStatistics {
  members: number
  varieties: number
  forumPosts: number
  forumReplies: number
  swapListingsActive: number
  swapsCompleted: number
  imagesShared: number
  /** Antal nye posts + replies + sorter de seneste 7 dage */
  activityLast7Days: number
  /** Mest aktive medlem (sum af posts+replies de sidste 30 dage) */
  topContributor: { userId: string; label: string; count: number } | null
}

/**
 * Aggregér statistik for en gruppe — bruges på Overblik-fanen.
 */
export async function getGroupStatistics(groupId: string): Promise<GroupStatistics> {
  await requireUser()
  const supabase = await createClient()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [members, varieties, posts, replies, listingsActive, listingsClosed, recentPosts, recentReplies, recentVarieties, contributorPosts, contributorReplies] = await Promise.all([
    supabase.from('user_group_memberships').select('user_id', { count: 'exact', head: true }).eq('group_id', groupId),
    supabase.from('group_varieties').select('id', { count: 'exact', head: true }).eq('group_id', groupId),
    supabase.from('forum_posts').select('id, image_urls', { count: 'exact' }).eq('group_id', groupId),
    supabase.from('forum_replies').select('id, image_url, forum_posts!inner(group_id)', { count: 'exact', head: true }).eq('forum_posts.group_id', groupId),
    supabase.from('seed_swap_listings').select('id', { count: 'exact', head: true }).eq('group_id', groupId).eq('status', 'active'),
    supabase.from('seed_swap_listings').select('id', { count: 'exact', head: true }).eq('group_id', groupId).eq('status', 'closed'),
    supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('group_id', groupId).gte('created_at', since7d),
    supabase.from('forum_replies').select('id, forum_posts!inner(group_id)', { count: 'exact', head: true }).eq('forum_posts.group_id', groupId).gte('created_at', since7d),
    supabase.from('group_varieties').select('id', { count: 'exact', head: true }).eq('group_id', groupId).gte('created_at', since7d),
    supabase.from('forum_posts').select('user_id').eq('group_id', groupId).gte('created_at', since30d),
    supabase.from('forum_replies').select('user_id, forum_posts!inner(group_id)').eq('forum_posts.group_id', groupId).gte('created_at', since30d),
  ])

  // Tæl billeder fra forum-opslag
  let postImagesCount = 0
  for (const p of (posts.data ?? []) as { image_urls: string[] | null }[]) {
    postImagesCount += (p.image_urls ?? []).length
  }
  // Forum-replies med billeder
  const { data: repliesWithImg } = await supabase
    .from('forum_replies')
    .select('image_url, forum_posts!inner(group_id)')
    .eq('forum_posts.group_id', groupId)
    .not('image_url', 'is', null)
  const replyImagesCount = (repliesWithImg ?? []).length

  // Top-contributor de sidste 30 dage
  const counts = new Map<string, number>()
  for (const r of (contributorPosts.data ?? []) as { user_id: string }[]) {
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1)
  }
  for (const r of (contributorReplies.data ?? []) as { user_id: string }[]) {
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1)
  }
  let topContributor: GroupStatistics['topContributor'] = null
  if (counts.size > 0) {
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const [topId, topCount] = sorted[0]
    const { data: labels } = await supabase.rpc('get_user_labels_by_ids', { p_ids: [topId] })
    const label = (labels as UserLabelRow[] | null)?.[0]
    topContributor = {
      userId: topId,
      label: pickLabel(label),
      count: topCount,
    }
  }

  return {
    members: members.count ?? 0,
    varieties: varieties.count ?? 0,
    forumPosts: posts.count ?? 0,
    forumReplies: replies.count ?? 0,
    swapListingsActive: listingsActive.count ?? 0,
    swapsCompleted: listingsClosed.count ?? 0,
    imagesShared: postImagesCount + replyImagesCount,
    activityLast7Days: (recentPosts.count ?? 0) + (recentReplies.count ?? 0) + (recentVarieties.count ?? 0),
    topContributor,
  }
}

export interface GroupGuide {
  id: string
  plantName: string
  variety: string | null
  latinName: string | null
  summary: string
  primaryImageUrl: string | null
  isMaster: boolean
  isAiGenerated: boolean
  ownerLabel: string | null
}

export interface GroupImage {
  url: string
  postId: string
  postTitle: string
  authorLabel: string
  createdAt: string
  /** Hvor billedet kom fra: post-billede eller svar-billede */
  source: 'post' | 'reply'
}

/**
 * Hent guides relateret til gruppens fokusplanter.
 * Master-guides først, derefter bruger-guides.
 */
export async function getGuidesForGroup(groupId: string): Promise<GroupGuide[]> {
  await requireUser()
  const supabase = await createClient()

  const { data: group } = await supabase
    .from('user_groups')
    .select('focus_plants')
    .eq('id', groupId)
    .maybeSingle()
  const focusPlants = ((group?.focus_plants as string[] | null) ?? [])
    .map(s => s.trim())
    .filter(Boolean)
  if (focusPlants.length === 0) return []

  // Postgres .ilike accepter ikke array-værdier, så vi bygger en OR-streng
  const orFilter = focusPlants
    .map(p => `plant_name.ilike.${p.replace(/,/g, '\\,')}`)
    .join(',')

  const { data: rows } = await supabase
    .from('guides')
    .select('id, plant_name, variety, latin_name, summary, primary_image_url, is_ai_generated, user_id')
    // Master først (user_id NULL), så bruger-guides
    .or(orFilter)
    .order('user_id', { ascending: true, nullsFirst: true })
    .order('plant_name', { ascending: true })
    .limit(50)
  if (!rows || rows.length === 0) return []

  const userIds = Array.from(new Set(
    rows.map(r => r.user_id as string | null).filter((x): x is string => !!x),
  ))
  const labelById = new Map<string, UserLabelRow>()
  if (userIds.length > 0) {
    const { data: labels } = await supabase
      .rpc('get_user_labels_by_ids', { p_ids: userIds })
    for (const r of (labels as UserLabelRow[] | null) ?? []) labelById.set(r.id, r)
  }

  return rows.map(r => ({
    id: r.id as string,
    plantName: r.plant_name as string,
    variety: (r.variety as string | null) ?? null,
    latinName: (r.latin_name as string | null) ?? null,
    summary: (r.summary as string | null) ?? '',
    primaryImageUrl: (r.primary_image_url as string | null) ?? null,
    isMaster: r.user_id === null,
    isAiGenerated: !!r.is_ai_generated,
    ownerLabel: r.user_id ? pickLabel(labelById.get(r.user_id as string)) : null,
  }))
}

/**
 * Hent alle billeder fra forum-opslag og forum-svar i en gruppe.
 * Sorteret nyeste først, max 60 entries.
 */
export async function getGroupImages(groupId: string): Promise<GroupImage[]> {
  await requireUser()
  const supabase = await createClient()

  const [postsRes, repliesRes] = await Promise.all([
    supabase
      .from('forum_posts')
      .select('id, title, user_id, image_urls, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('forum_replies')
      .select('id, post_id, user_id, image_url, created_at, forum_posts!inner(group_id, title)')
      .eq('forum_posts.group_id', groupId)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  type PostRow = {
    id: string
    title: string
    user_id: string
    image_urls: string[] | null
    created_at: string
  }
  type ReplyRow = {
    post_id: string
    user_id: string
    image_url: string | null
    created_at: string
    forum_posts: { title: string } | { title: string }[]
  }

  const items: GroupImage[] = []

  for (const p of (postsRes.data ?? []) as PostRow[]) {
    for (const url of (p.image_urls ?? [])) {
      if (!url) continue
      items.push({
        url,
        postId: p.id,
        postTitle: p.title,
        authorLabel: '',
        createdAt: p.created_at,
        source: 'post',
      })
    }
  }
  for (const r of ((repliesRes.data ?? []) as unknown as ReplyRow[])) {
    if (!r.image_url) continue
    const fp = Array.isArray(r.forum_posts) ? r.forum_posts[0] : r.forum_posts
    items.push({
      url: r.image_url,
      postId: r.post_id,
      postTitle: fp?.title ?? '',
      authorLabel: '',
      createdAt: r.created_at,
      source: 'reply',
    })
  }

  if (items.length === 0) return []

  // Hent forfatter-labels (post + reply i samme batch)
  const userIds = Array.from(new Set([
    ...((postsRes.data ?? []) as PostRow[]).map(p => p.user_id),
    ...(((repliesRes.data ?? []) as unknown as ReplyRow[])).map(r => r.user_id),
  ]))
  const labelById = new Map<string, UserLabelRow>()
  if (userIds.length > 0) {
    const { data: labels } = await supabase
      .rpc('get_user_labels_by_ids', { p_ids: userIds })
    for (const r of (labels as UserLabelRow[] | null) ?? []) labelById.set(r.id, r)
  }

  // Tildel labels (lookup baseret på vores temporære items)
  const postUserById = new Map<string, string>()
  for (const p of (postsRes.data ?? []) as PostRow[]) postUserById.set(p.id, p.user_id)
  // Reply: vi mappede post_id, men user_id er per reply — håndtér her
  const replyUserByUrl = new Map<string, string>()
  for (const r of ((repliesRes.data ?? []) as unknown as ReplyRow[])) {
    if (r.image_url) replyUserByUrl.set(r.image_url, r.user_id)
  }

  for (const item of items) {
    const userId = item.source === 'post'
      ? postUserById.get(item.postId)
      : replyUserByUrl.get(item.url)
    item.authorLabel = pickLabel(userId ? labelById.get(userId) : null)
  }

  // Sortér nyeste først og limit
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return items.slice(0, 60)
}
