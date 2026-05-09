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

export type ReportTarget = 'forum_post' | 'forum_reply' | 'swap_listing' | 'chat_message'
export type ReportReason = 'spam' | 'irrelevant' | 'rude' | 'misleading' | 'other'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface ContentReport {
  id: string
  groupId: string
  reporterUserId: string
  reporterLabel: string
  targetType: ReportTarget
  targetId: string
  reason: ReportReason
  message: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
}

export const REASON_LABEL: Record<ReportReason, string> = {
  spam: 'Spam / reklame',
  irrelevant: 'Irrelevant for gruppen',
  rude: 'Stødende / uvenligt',
  misleading: 'Vildledende',
  other: 'Andet',
}

export async function reportContent(input: {
  groupId: string
  targetType: ReportTarget
  targetId: string
  reason: ReportReason
  message?: string
}): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('content_reports')
    .insert({
      group_id: input.groupId,
      reporter_user_id: (await requireUser()).id,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      message: input.message?.trim() || null,
    })
  if (error) {
    if (error.code === '23505') return { error: 'Du har allerede rapporteret dette indhold' }
    return { error: error.message }
  }
  revalidatePath(`/grupper/${input.groupId}`)
  return { ok: true }
}

export async function getPendingReports(groupId: string): Promise<ContentReport[]> {
  await requireUser()
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('content_reports')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (!rows || rows.length === 0) return []

  const ids = Array.from(new Set(rows.map(r => r.reporter_user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return rows.map(r => ({
    id: r.id as string,
    groupId: r.group_id as string,
    reporterUserId: r.reporter_user_id as string,
    reporterLabel: pickLabel(byId.get(r.reporter_user_id as string)),
    targetType: r.target_type as ReportTarget,
    targetId: r.target_id as string,
    reason: r.reason as ReportReason,
    message: (r.message as string | null) ?? null,
    status: r.status as ReportStatus,
    createdAt: r.created_at as string,
    resolvedAt: (r.resolved_at as string | null) ?? null,
  }))
}

export async function resolveReport(input: {
  reportId: string
  groupId: string
  decision: 'resolved' | 'dismissed'
  /** Hvis decision='resolved' og deleteTarget=true: slet det rapporterede indhold */
  deleteTarget?: boolean
  targetType?: ReportTarget
  targetId?: string
}): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  if (input.decision === 'resolved' && input.deleteTarget && input.targetType && input.targetId) {
    const tableMap: Record<ReportTarget, string> = {
      forum_post: 'forum_posts',
      forum_reply: 'forum_replies',
      swap_listing: 'seed_swap_listings',
      chat_message: 'group_chat_messages',
    }
    const table = tableMap[input.targetType]
    const { error: delErr } = await supabase.from(table).delete().eq('id', input.targetId)
    if (delErr) return { error: `Kunne ikke slette indhold: ${delErr.message}` }
  }

  const { error } = await supabase
    .from('content_reports')
    .update({ status: input.decision, resolved_at: new Date().toISOString(), resolved_by: userId })
    .eq('id', input.reportId)
  if (error) return { error: error.message }
  revalidatePath(`/grupper/${input.groupId}`)
  return { ok: true }
}

// ============================================================
// Blokering
// ============================================================

export async function blockUser(blockedUserId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  if (userId === blockedUserId) return { error: 'Du kan ikke blokere dig selv' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_user_id: userId, blocked_user_id: blockedUserId })
  if (error) {
    if (error.code === '23505') return { ok: true }
    return { error: error.message }
  }
  return { ok: true }
}

export async function unblockUser(blockedUserId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_user_id', userId)
    .eq('blocked_user_id', blockedUserId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function getMyBlockedUserIds(): Promise<Set<string>> {
  const me = await getCurrentUser()
  if (!me) return new Set()
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_blocks')
    .select('blocked_user_id')
    .eq('blocker_user_id', me.id)
  return new Set(((data ?? []) as { blocked_user_id: string }[]).map(r => r.blocked_user_id))
}

// ============================================================
// Gruppe-indstillinger
// ============================================================

export async function updateGroupSettings(input: {
  groupId: string
  name?: string
  description?: string
  rules?: string
  visibility?: 'open' | 'closed' | 'hidden'
  tags?: string[]
  focusPlants?: string[]
}): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()

  if (input.tags && input.tags.length > 5) return { error: 'Maks. 5 tags pr. gruppe' }
  if (input.focusPlants && input.focusPlants.length > 5) return { error: 'Maks. 5 fokusplanter pr. gruppe' }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) {
    const trimmed = input.name.trim()
    if (!trimmed) return { error: 'Gruppenavn må ikke være tomt' }
    update.name = trimmed
  }
  if (input.description !== undefined) update.description = input.description.trim() || null
  if (input.rules !== undefined) update.rules = input.rules.trim() || null
  if (input.visibility !== undefined) update.visibility = input.visibility
  if (input.tags !== undefined) update.tags = input.tags
  if (input.focusPlants !== undefined) {
    update.focus_plants = input.focusPlants.map(s => s.trim()).filter(Boolean)
  }

  const { error } = await supabase
    .from('user_groups')
    .update(update)
    .eq('id', input.groupId)
  if (error) return { error: error.message }
  revalidatePath(`/grupper/${input.groupId}`)
  revalidatePath('/grupper/udforsk')
  return { ok: true }
}
