import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  HelpCircle, Sparkles, BookOpen, AlertTriangle, Image as ImageIcon, BookMarked,
  Gift, MessageSquare, Lightbulb, Sprout, Trophy, UserPlus, Search, ArrowRight,
} from 'lucide-react'
import type { TimelineEvent, TimelineEventType } from '@/actions/group-timeline'
import { cn } from '@/lib/utils'

interface Props {
  events: TimelineEvent[]
}

const TYPE_META: Record<TimelineEventType, { icon: React.ElementType; color: string }> = {
  post_question:    { icon: HelpCircle,    color: 'bg-blue-100 text-blue-800 border-blue-200' },
  post_tip:         { icon: Sparkles,      color: 'bg-amber-100 text-amber-800 border-amber-200' },
  post_experience:  { icon: BookOpen,      color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  post_problem:     { icon: AlertTriangle, color: 'bg-red-100 text-red-800 border-red-200' },
  post_image:       { icon: ImageIcon,     color: 'bg-purple-100 text-purple-800 border-purple-200' },
  post_guide:       { icon: BookMarked,    color: 'bg-amber-100 text-amber-800 border-amber-200' },
  post_seed_swap:   { icon: Gift,          color: 'bg-green-100 text-green-800 border-green-200' },
  reply_added:      { icon: MessageSquare, color: 'bg-secondary/60 text-foreground border-border' },
  idea_shared:      { icon: Lightbulb,     color: 'bg-amber-100 text-amber-800 border-amber-200' },
  swap_offered:     { icon: Gift,          color: 'bg-green-100 text-green-800 border-green-200' },
  swap_wanted:      { icon: Search,        color: 'bg-blue-100 text-blue-800 border-blue-200' },
  variety_added:    { icon: Sprout,        color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  challenge_started:{ icon: Trophy,        color: 'bg-amber-100 text-amber-800 border-amber-200' },
  challenge_entry:  { icon: Trophy,        color: 'bg-amber-50 text-amber-700 border-amber-100' },
  member_joined:    { icon: UserPlus,      color: 'bg-secondary/60 text-foreground border-border' },
}

function venligTid(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'lige nu'
  if (diff < 3600) return `${Math.floor(diff / 60)}m siden`
  if (diff < 86400) return `${Math.floor(diff / 3600)}t siden`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d siden`
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

function groupByDay(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)

  for (const e of events) {
    const day = e.createdAt.slice(0, 10)
    let label: string
    if (day === today) label = 'I dag'
    else if (day === yesterday) label = 'I går'
    else if (day >= sevenDaysAgo) label = 'Denne uge'
    else {
      const d = new Date(e.createdAt)
      label = d.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })
    }
    const list = groups.get(label) ?? []
    list.push(e)
    groups.set(label, list)
  }
  return groups
}

export function GroupTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4 text-center">
        Ingen aktivitet endnu. Start en samtale, del en idé eller tilføj en sort.
      </p>
    )
  }

  const grouped = groupByDay(events)

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([label, dayEvents]) => (
        <div key={label} className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground sticky top-0 bg-card py-1">
            {label}
          </p>
          <div className="space-y-2">
            {dayEvents.map(e => <TimelineCard key={e.id} event={e} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineCard({ event }: { event: TimelineEvent }) {
  const meta = TYPE_META[event.type]
  const Icon = meta.icon

  const card = (
    <div className="flex gap-3 group">
      <div className={cn(
        'h-8 w-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
        meta.color,
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0 rounded-lg border border-border bg-card hover:bg-accent/20 transition-colors p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">{event.actorLabel}</span>{' '}
              <span className="text-muted-foreground">{event.title}</span>
            </p>
            {event.body && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{event.body}</p>
            )}
            {event.chips.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {event.chips.map(c => (
                  <Badge key={c} variant="muted" className="text-[9px]">{c}</Badge>
                ))}
              </div>
            )}
          </div>
          {event.imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={event.imageUrl}
              alt=""
              className="h-14 w-14 rounded-md object-cover shrink-0"
              loading="lazy"
            />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{venligTid(event.createdAt)}</p>
      </div>
    </div>
  )

  if (event.link) {
    return <Link href={event.link} className="block">{card}</Link>
  }
  return card
}
