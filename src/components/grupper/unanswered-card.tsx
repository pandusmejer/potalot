import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { HelpCircle, ArrowRight } from 'lucide-react'
import type { UnansweredPost } from '@/actions/group-timeline'

interface Props {
  groupId: string
  posts: UnansweredPost[]
}

function venligTid(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}t`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export function UnansweredCard({ groupId, posts }: Props) {
  if (posts.length === 0) return null

  return (
    <Card className="bg-amber-50/40 border-amber-200">
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs uppercase tracking-wider text-amber-800 inline-flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            Ubesvarede spørgsmål ({posts.length})
          </p>
          <p className="text-[10px] text-amber-700 italic">Hjælp en anden dyrker</p>
        </div>
        <ul className="space-y-1.5">
          {posts.map(p => (
            <li key={p.id}>
              <Link
                href={`/grupper/${groupId}/opslag/${p.id}`}
                className="flex items-start justify-between gap-2 hover:bg-card/60 rounded-md px-2 py-1.5 -mx-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">{p.authorLabel} · {venligTid(p.createdAt)}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-amber-700 mt-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
