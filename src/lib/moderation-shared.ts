// Delte typer + konstanter for moderation. Adskilt fra
// src/actions/moderation.ts ('use server') fordi server-action-filer
// kun må eksportere async funktioner.

export type ReportTarget = 'forum_post' | 'forum_reply' | 'swap_listing' | 'chat_message'
export type ReportReason = 'spam' | 'irrelevant' | 'rude' | 'misleading' | 'other'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export const REASON_LABEL: Record<ReportReason, string> = {
  spam: 'Spam / reklame',
  irrelevant: 'Irrelevant for gruppen',
  rude: 'Stødende / uvenligt',
  misleading: 'Vildledende',
  other: 'Andet',
}
