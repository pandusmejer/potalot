import {
  Sparkles, Award, Gift, Users, Sprout, BookOpen, Leaf, Wheat, Flag,
  Package, GitFork,
} from 'lucide-react'
import { BADGES, type BadgeId } from '@/lib/badges-shared'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  Sparkles, Award, Gift, Users, Sprout, BookOpen, Leaf, Wheat, Flag,
  Package, GitFork,
}

const COLOR_CLASS = {
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
}

interface Props {
  badgeIds: BadgeId[]
  size?: 'sm' | 'md'
  /** Vis label, ellers kun ikon med tooltip */
  withLabel?: boolean
}

export function BadgeChips({ badgeIds, size = 'sm', withLabel = false }: Props) {
  if (badgeIds.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {badgeIds.map(id => {
        const meta = BADGES[id]
        if (!meta) return null
        const Icon = ICON_MAP[meta.icon]
        return (
          <span
            key={id}
            title={`${meta.label} — ${meta.description}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border',
              COLOR_CLASS[meta.color],
              size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
            )}
          >
            <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
            {withLabel && meta.label}
          </span>
        )
      })}
    </div>
  )
}
