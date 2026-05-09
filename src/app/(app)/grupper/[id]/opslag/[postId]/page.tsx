import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pin, Lock, CheckCircle2 } from 'lucide-react'
import { getGroup } from '@/actions/groups'
import { getForumPost, getForumReplies } from '@/actions/group-forum'
import { getCurrentUser } from '@/lib/auth'
import { ForumPostActions } from '@/components/grupper/forum-post-actions'
import { ForumRepliesPanel } from '@/components/grupper/forum-replies-panel'
import { FORUM_CATEGORIES, FORUM_POST_TYPES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string; postId: string }>
}

function venligTid(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ForumPostPage({ params }: Props) {
  const { id, postId } = await params
  const me = await getCurrentUser()
  if (!me) notFound()

  const [group, post, replies] = await Promise.all([
    getGroup(id),
    getForumPost(postId),
    getForumReplies(postId),
  ])

  if (!group || !post || post.groupId !== id) notFound()

  const cat = FORUM_CATEGORIES.find(c => c.id === post.category)
  const typ = FORUM_POST_TYPES.find(t => t.id === post.postType)
  const isMember = group.myRole !== null
  const isOwner = group.myRole === 'owner'
  const canModerate = isOwner
  const canDelete = post.isMine || isOwner
  const canMarkBest = post.isMine || isOwner

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/grupper/${id}`} aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground truncate">
          <Link href={`/grupper/${id}`} className="hover:underline">{group.name}</Link>
          {' · Forum'}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-start gap-2 flex-wrap">
            {post.isPinned && (
              <Badge variant="warning" className="text-[10px] gap-0.5">
                <Pin className="h-2.5 w-2.5" /> Fastgjort
              </Badge>
            )}
            {post.isLocked && (
              <Badge variant="muted" className="text-[10px] gap-0.5">
                <Lock className="h-2.5 w-2.5" /> Lukket
              </Badge>
            )}
            {typ && <Badge variant="muted" className="text-[10px]">{typ.label}</Badge>}
            {cat && <Badge variant="outline" className="text-[10px]">{cat.label}</Badge>}
            {post.bestReplyId && (
              <Badge variant="success" className="text-[10px] gap-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> Bedste svar markeret
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-serif text-foreground">{post.title}</h1>
          <p className="text-xs text-muted-foreground">
            {post.authorLabel} · {venligTid(post.createdAt)}
          </p>
          {post.body && (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.body}</p>
          )}
          {post.imageUrls.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {post.imageUrls.map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="rounded-lg w-full max-h-72 object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          )}

          {isMember && (
            <div className="border-t border-border pt-3">
              <ForumPostActions
                post={post}
                groupId={id}
                canModerate={canModerate}
                canDelete={canDelete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ForumRepliesPanel
        postId={postId}
        groupId={id}
        replies={replies}
        bestReplyId={post.bestReplyId}
        myUserId={me.id}
        isMember={isMember}
        isLocked={post.isLocked}
        canMarkBest={canMarkBest}
      />
    </div>
  )
}
