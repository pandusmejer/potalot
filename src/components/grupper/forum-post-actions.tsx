'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Pin, PinOff, Lock, LockOpen, Trash2, Loader2 } from 'lucide-react'
import {
  togglePostPinned, togglePostLocked, deleteForumPost, type ForumPost,
} from '@/actions/group-forum'
import { ReportButton } from '@/components/grupper/report-button'

interface Props {
  post: ForumPost
  groupId: string
  canModerate: boolean
  canDelete: boolean
}

export function ForumPostActions({ post, groupId, canModerate, canDelete }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handlePin() {
    startTransition(async () => {
      await togglePostPinned(post.id, groupId, !post.isPinned)
      router.refresh()
    })
  }

  function handleLock() {
    startTransition(async () => {
      await togglePostLocked(post.id, groupId, !post.isLocked)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm('Slet dette opslag og alle svar? Kan ikke fortrydes.')) return
    startTransition(async () => {
      const res = await deleteForumPost(post.id, groupId)
      if ('error' in res) { alert(res.error); return }
      router.push(`/grupper/${groupId}`)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canModerate && (
        <>
          <Button type="button" variant="outline" size="sm" onClick={handlePin} disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (post.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />)}
            {post.isPinned ? 'Fjern fastgørelse' : 'Fastgør'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleLock} disabled={pending}>
            {post.isLocked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {post.isLocked ? 'Lås op' : 'Lås tråd'}
          </Button>
        </>
      )}
      {canDelete && (
        <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={pending} className="text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Slet
        </Button>
      )}
      {!post.isMine && (
        <ReportButton
          groupId={groupId}
          targetType="forum_post"
          targetId={post.id}
          label="Rapportér"
        />
      )}
    </div>
  )
}
