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

export type TimelineEventType =
  | 'post_question'
  | 'post_tip'
  | 'post_experience'
  | 'post_problem'
  | 'post_image'
  | 'post_guide'
  | 'post_seed_swap'
  | 'reply_added'
  | 'idea_shared'
  | 'swap_offered'
  | 'swap_wanted'
  | 'variety_added'
  | 'challenge_started'
  | 'challenge_entry'
  | 'member_joined'

export interface TimelineEvent {
  id: string                        // unique-id (type + source-id)
  type: TimelineEventType
  createdAt: string
  actorUserId: string
  actorLabel: string
  title: string                     // primær linje
  body: string | null               // sekundær linje (excerpt)
  imageUrl: string | null
  /** Hvor brugeren kommer hen ved klik */
  link: string | null
  /** Bonus-display: fx 'Spørgsmål', 'Drivhus', 'Habanero' */
  chips: string[]
}

const POST_TYPE_TO_TIMELINE: Record<string, TimelineEventType> = {
  question: 'post_question',
  tip: 'post_tip',
  experience: 'post_experience',
  problem: 'post_problem',
  image: 'post_image',
  guide: 'post_guide',
  seed_swap: 'post_seed_swap',
}

const POST_TYPE_LABEL: Record<string, string> = {
  question: 'Spørgsmål',
  tip: 'Tip',
  experience: 'Erfaring',
  problem: 'Problem',
  image: 'Billede',
  guide: 'Guide',
  seed_swap: 'Frøbytte',
}

/**
 * Aggregér seneste events fra alle relevante tabeller for en gruppe.
 * Limit pr. type = 20, total returneres sorteret efter tidspunkt.
 */
export async function getGroupTimeline(groupId: string, limit = 50): Promise<TimelineEvent[]> {
  await requireUser()
  const supabase = await createClient()
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [postsRes, repliesRes, ideasRes, swapsRes, varietiesRes, challengesRes, entriesRes, membersRes] = await Promise.all([
    supabase
      .from('forum_posts')
      .select('id, user_id, post_type, category, title, body, image_urls, created_at, variety_id')
      .eq('group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('forum_replies')
      .select('id, user_id, body, image_url, created_at, post_id, forum_posts!inner(group_id, title)')
      .eq('forum_posts.group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('idea_group_shares')
      .select('idea_id, shared_by_user_id, created_at, ideas!inner(title, description, primary_image_url)')
      .eq('group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('seed_swap_listings')
      .select('id, user_id, kind, plant_name, variety, description, status, created_at')
      .eq('group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('group_varieties')
      .select('id, plant_name, variety, primary_image_url, created_by, created_at')
      .eq('group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('challenges')
      .select('id, title, description, cover_image_url, created_by, created_at')
      .eq('group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('challenge_entries')
      .select('id, user_id, caption, image_url, created_at, challenge_id, challenges!inner(group_id, title)')
      .eq('challenges.group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('user_group_memberships')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)
      .gte('joined_at', since)
      .order('joined_at', { ascending: false })
      .limit(20),
  ])

  // Saml events
  const events: TimelineEvent[] = []
  const userIds = new Set<string>()

  type PostRow = {
    id: string; user_id: string; post_type: string; category: string;
    title: string; body: string | null; image_urls: string[] | null;
    created_at: string; variety_id: string | null
  }
  for (const r of (postsRes.data ?? []) as PostRow[]) {
    userIds.add(r.user_id)
    events.push({
      id: `post-${r.id}`,
      type: POST_TYPE_TO_TIMELINE[r.post_type] ?? 'post_experience',
      createdAt: r.created_at,
      actorUserId: r.user_id,
      actorLabel: '',
      title: r.title,
      body: r.body,
      imageUrl: (r.image_urls ?? [])[0] ?? null,
      link: `/grupper/${groupId}/opslag/${r.id}`,
      chips: [POST_TYPE_LABEL[r.post_type] ?? r.post_type].filter(Boolean),
    })
  }

  type ReplyRow = {
    id: string; user_id: string; body: string; image_url: string | null;
    created_at: string; post_id: string;
    forum_posts: { title: string } | { title: string }[]
  }
  for (const r of ((repliesRes.data ?? []) as unknown as ReplyRow[])) {
    userIds.add(r.user_id)
    const fp = Array.isArray(r.forum_posts) ? r.forum_posts[0] : r.forum_posts
    events.push({
      id: `reply-${r.id}`,
      type: 'reply_added',
      createdAt: r.created_at,
      actorUserId: r.user_id,
      actorLabel: '',
      title: `svarede på "${fp?.title ?? 'et opslag'}"`,
      body: r.body.length > 140 ? r.body.slice(0, 140) + '…' : r.body,
      imageUrl: r.image_url,
      link: `/grupper/${groupId}/opslag/${r.post_id}`,
      chips: ['Svar'],
    })
  }

  type IdeaRow = {
    idea_id: string; shared_by_user_id: string; created_at: string;
    ideas: { title: string; description: string | null; primary_image_url: string | null }
       | { title: string; description: string | null; primary_image_url: string | null }[]
  }
  for (const r of ((ideasRes.data ?? []) as unknown as IdeaRow[])) {
    userIds.add(r.shared_by_user_id)
    const i = Array.isArray(r.ideas) ? r.ideas[0] : r.ideas
    events.push({
      id: `idea-${r.idea_id}-${r.created_at}`,
      type: 'idea_shared',
      createdAt: r.created_at,
      actorUserId: r.shared_by_user_id,
      actorLabel: '',
      title: `delte idéen "${i?.title ?? 'en idé'}"`,
      body: i?.description ?? null,
      imageUrl: i?.primary_image_url ?? null,
      link: '/idetavle',
      chips: ['Idé'],
    })
  }

  type SwapRow = {
    id: string; user_id: string; kind: 'offer' | 'wanted'; plant_name: string;
    variety: string | null; description: string | null; status: string; created_at: string;
  }
  for (const r of ((swapsRes.data ?? []) as SwapRow[])) {
    userIds.add(r.user_id)
    const isOffer = r.kind === 'offer'
    events.push({
      id: `swap-${r.id}`,
      type: isOffer ? 'swap_offered' : 'swap_wanted',
      createdAt: r.created_at,
      actorUserId: r.user_id,
      actorLabel: '',
      title: isOffer
        ? `tilbyder frø af ${r.variety || r.plant_name}`
        : `søger frø af ${r.variety || r.plant_name}`,
      body: r.description,
      imageUrl: null,
      link: `/grupper/${groupId}`,
      chips: [isOffer ? 'Frø tilbydes' : 'Frø søges'],
    })
  }

  type VarietyRow = {
    id: string; plant_name: string; variety: string | null;
    primary_image_url: string | null; created_by: string; created_at: string
  }
  for (const r of ((varietiesRes.data ?? []) as VarietyRow[])) {
    userIds.add(r.created_by)
    events.push({
      id: `variety-${r.id}`,
      type: 'variety_added',
      createdAt: r.created_at,
      actorUserId: r.created_by,
      actorLabel: '',
      title: `tilføjede sorten ${r.variety || r.plant_name}`,
      body: r.variety ? r.plant_name : null,
      imageUrl: r.primary_image_url,
      link: `/grupper/${groupId}/sorter/${r.id}`,
      chips: ['Ny sort'],
    })
  }

  type ChallengeRow = {
    id: string; title: string; description: string | null;
    cover_image_url: string | null; created_by: string; created_at: string
  }
  for (const r of ((challengesRes.data ?? []) as ChallengeRow[])) {
    userIds.add(r.created_by)
    events.push({
      id: `challenge-${r.id}`,
      type: 'challenge_started',
      createdAt: r.created_at,
      actorUserId: r.created_by,
      actorLabel: '',
      title: `startede challengen "${r.title}"`,
      body: r.description,
      imageUrl: r.cover_image_url,
      link: `/grupper/${groupId}`,
      chips: ['Udfordring'],
    })
  }

  type EntryRow = {
    id: string; user_id: string; caption: string | null; image_url: string | null;
    created_at: string; challenge_id: string;
    challenges: { title: string } | { title: string }[]
  }
  for (const r of ((entriesRes.data ?? []) as unknown as EntryRow[])) {
    userIds.add(r.user_id)
    const c = Array.isArray(r.challenges) ? r.challenges[0] : r.challenges
    events.push({
      id: `entry-${r.id}`,
      type: 'challenge_entry',
      createdAt: r.created_at,
      actorUserId: r.user_id,
      actorLabel: '',
      title: `indsendte bidrag til "${c?.title ?? 'en udfordring'}"`,
      body: r.caption,
      imageUrl: r.image_url,
      link: `/grupper/${groupId}`,
      chips: ['Bidrag til udfordring'],
    })
  }

  type MemberRow = { user_id: string; role: string; joined_at: string }
  for (const r of ((membersRes.data ?? []) as MemberRow[])) {
    userIds.add(r.user_id)
    events.push({
      id: `member-${r.user_id}-${r.joined_at}`,
      type: 'member_joined',
      createdAt: r.joined_at,
      actorUserId: r.user_id,
      actorLabel: '',
      title: r.role === 'owner' ? 'oprettede gruppen' : 'blev medlem',
      body: null,
      imageUrl: null,
      link: null,
      chips: r.role === 'owner' ? ['Ejer'] : [],
    })
  }

  // Slå alle labels op samlet
  if (userIds.size > 0) {
    const { data: labels } = await supabase
      .rpc('get_user_labels_by_ids', { p_ids: Array.from(userIds) })
    const byId = new Map<string, UserLabelRow>()
    for (const l of (labels as UserLabelRow[] | null) ?? []) byId.set(l.id, l)
    for (const e of events) {
      e.actorLabel = pickLabel(byId.get(e.actorUserId))
    }
  }

  events.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return events.slice(0, limit)
}

// ============================================================
// Ugens puls
// ============================================================

export interface WeeklyDigest {
  posts: number
  replies: number
  ideas: number
  swapsCreated: number
  newVarieties: number
  newMembers: number
  imagesShared: number
  challengeEntries: number
}

export async function getWeeklyDigest(groupId: string): Promise<WeeklyDigest> {
  await requireUser()
  const supabase = await createClient()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [posts, replies, ideas, swaps, varieties, members, postsForImg, repliesWithImg, entries] = await Promise.all([
    supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('group_id', groupId).gte('created_at', since),
    supabase.from('forum_replies').select('id, forum_posts!inner(group_id)', { count: 'exact', head: true }).eq('forum_posts.group_id', groupId).gte('created_at', since),
    supabase.from('idea_group_shares').select('idea_id', { count: 'exact', head: true }).eq('group_id', groupId).gte('created_at', since),
    supabase.from('seed_swap_listings').select('id', { count: 'exact', head: true }).eq('group_id', groupId).gte('created_at', since),
    supabase.from('group_varieties').select('id', { count: 'exact', head: true }).eq('group_id', groupId).gte('created_at', since),
    supabase.from('user_group_memberships').select('user_id', { count: 'exact', head: true }).eq('group_id', groupId).gte('joined_at', since),
    supabase.from('forum_posts').select('image_urls').eq('group_id', groupId).gte('created_at', since),
    supabase.from('forum_replies').select('image_url, forum_posts!inner(group_id)').eq('forum_posts.group_id', groupId).gte('created_at', since).not('image_url', 'is', null),
    supabase.from('challenge_entries').select('id, challenges!inner(group_id)', { count: 'exact', head: true }).eq('challenges.group_id', groupId).gte('created_at', since),
  ])

  let imgCount = 0
  for (const p of (postsForImg.data ?? []) as { image_urls: string[] | null }[]) {
    imgCount += (p.image_urls ?? []).length
  }
  imgCount += (repliesWithImg.data ?? []).length

  return {
    posts: posts.count ?? 0,
    replies: replies.count ?? 0,
    ideas: ideas.count ?? 0,
    swapsCreated: swaps.count ?? 0,
    newVarieties: varieties.count ?? 0,
    newMembers: members.count ?? 0,
    imagesShared: imgCount,
    challengeEntries: entries.count ?? 0,
  }
}

// ============================================================
// Aktuelt lige nu (forum-tråde med høj aktivitet sidste 7 dage)
// ============================================================

export interface CurrentlyActivePost {
  id: string
  title: string
  postType: string
  replyCount: number
  lastActivityAt: string
}

export async function getCurrentlyActivePosts(groupId: string): Promise<CurrentlyActivePost[]> {
  await requireUser()
  const supabase = await createClient()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('forum_posts')
    .select('id, title, post_type, reply_count, last_activity_at')
    .eq('group_id', groupId)
    .gte('last_activity_at', since)
    .order('reply_count', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .limit(5)

  return ((data ?? []) as Array<{ id: string; title: string; post_type: string; reply_count: number; last_activity_at: string }>)
    .map(p => ({
      id: p.id,
      title: p.title,
      postType: p.post_type,
      replyCount: p.reply_count,
      lastActivityAt: p.last_activity_at,
    }))
}

// ============================================================
// Ubesvarede spørgsmål
// ============================================================

export interface UnansweredPost {
  id: string
  title: string
  authorLabel: string
  createdAt: string
}

export async function getUnansweredQuestions(groupId: string): Promise<UnansweredPost[]> {
  await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('forum_posts')
    .select('id, title, user_id, created_at')
    .eq('group_id', groupId)
    .eq('post_type', 'question')
    .eq('reply_count', 0)
    .eq('is_locked', false)
    .order('created_at', { ascending: false })
    .limit(5)
  if (!data || data.length === 0) return []

  const userIds = Array.from(new Set(data.map(p => p.user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: userIds })
  const byId = new Map<string, UserLabelRow>()
  for (const l of (labels as UserLabelRow[] | null) ?? []) byId.set(l.id, l)

  return data.map(p => ({
    id: p.id as string,
    title: p.title as string,
    authorLabel: pickLabel(byId.get(p.user_id as string)),
    createdAt: p.created_at as string,
  }))
}
