'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Pin, Lock, CheckCircle2 } from 'lucide-react'
import type { ForumPost } from '@/actions/group-forum'
import { FORUM_CATEGORIES, FORUM_POST_TYPES } from '@/lib/constants'

interface Props {
  posts: ForumPost[]
}

function venligTid(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'lige nu'
  if (diff < 3600) return `${Math.floor(diff / 60)}m siden`
  if (diff < 86400) return `${Math.floor(diff / 3600)}t siden`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d siden`
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export function ForumList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4 text-center">
        Ingen opslag endnu. Vær den første til at skrive.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map(p => {
        const cat = FORUM_CATEGORIES.find(c => c.id === p.category)
        const typ = FORUM_POST_TYPES.find(t => t.id === p.postType)
        const cover = p.imageUrls[0]
        return (
          <Card key={p.id} className="overflow-hidden hover:bg-accent/20 transition-colors">
            <Link href={`/grupper/${p.groupId}/opslag/${p.id}`} className="flex gap-3 p-3">
              {cover && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cover} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  {p.isPinned && <Pin className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />}
                  {p.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                  <p className="font-medium text-foreground line-clamp-2 flex-1">{p.title}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {typ && <Badge variant="muted" className="text-[10px]">{typ.label}</Badge>}
                  {cat && <Badge variant="outline" className="text-[10px]">{cat.label}</Badge>}
                  {p.bestReplyId && (
                    <Badge variant="success" className="text-[10px] gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Bedste svar
                    </Badge>
                  )}
                </div>
                {p.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.body}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {p.authorLabel} · {venligTid(p.createdAt)}
                  {p.replyCount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <MessageSquare className="h-2.5 w-2.5" />
                      {p.replyCount}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          </Card>
        )
      })}
    </div>
  )
}
