import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, MessageSquare, ArrowRight } from 'lucide-react'
import type { CurrentlyActivePost } from '@/actions/group-timeline'

interface Props {
  groupId: string
  posts: CurrentlyActivePost[]
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

export function CurrentlyActiveCard({ groupId, posts }: Props) {
  if (posts.length === 0) return null

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-600" />
          Aktuelt lige nu
        </p>
        <ul className="space-y-1.5">
          {posts.map(p => (
            <li key={p.id}>
              <Link
                href={`/grupper/${groupId}/opslag/${p.id}`}
                className="flex items-start justify-between gap-2 hover:bg-accent/30 rounded-md px-2 py-1.5 -mx-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="muted" className="text-[9px]">
                      {POST_TYPE_LABEL[p.postType] ?? p.postType}
                    </Badge>
                    {p.replyCount > 0 && (
                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {p.replyCount}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
