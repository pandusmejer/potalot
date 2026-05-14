import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import { Lock } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/**
 * Emblem — et lille botanisk diplom-design der wrapper en ikon.
 *
 * Designprincip: "spejdermærke" / "emaljeskilt" — gylden ramme, pergament-
 * baggrund, subtil indre ridge, drop-shadow. Konsistent visuel grammatik
 * for alle badges. Farve-variationen via category-prop.
 */

export type EmblemCategory = 'dyrkning' | 'samler' | 'laering' | 'social'
export type EmblemSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE: Record<EmblemSize, { wrap: string; icon: string }> = {
  xs: { wrap: 'h-7 w-7', icon: 'h-3 w-3' },
  sm: { wrap: 'h-10 w-10', icon: 'h-4 w-4' },
  md: { wrap: 'h-14 w-14', icon: 'h-6 w-6' },
  lg: { wrap: 'h-20 w-20', icon: 'h-9 w-9' },
}

const CATEGORY_RING: Record<EmblemCategory, string> = {
  dyrkning: 'from-green-50 to-green-100/70',
  samler: 'from-amber-50 to-amber-100/70',
  laering: 'from-blue-50 to-blue-100/70',
  social: 'from-purple-50 to-purple-100/70',
}

const CATEGORY_BORDER: Record<EmblemCategory, string> = {
  dyrkning: 'border-green-700/60',
  samler: 'border-amber-700/60',
  laering: 'border-blue-700/60',
  social: 'border-purple-700/60',
}

const CATEGORY_ICON: Record<EmblemCategory, string> = {
  dyrkning: 'text-green-800',
  samler: 'text-amber-800',
  laering: 'text-blue-800',
  social: 'text-purple-800',
}

interface Props {
  /** Lucide-ikon-navn der renderes i midten (fx 'Sprout', 'Award'). */
  icon: keyof typeof LucideIcons | 'Lock'
  category: EmblemCategory
  size?: EmblemSize
  /** Når true: vises gråtonet med Lock-ikon i stedet. */
  locked?: boolean
  className?: string
}

export function Emblem({ icon, category, size = 'md', locked = false, className }: Props) {
  const dims = SIZE[size]
  // Resolve icon (alle lucide-ikoner er valide her — vi caster løst)
  const IconCmp: ComponentType<SVGProps<SVGSVGElement>> = locked
    ? Lock
    : (((LucideIcons as unknown) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[icon] ?? LucideIcons.Circle)

  if (locked) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center shrink-0 relative',
          'bg-muted/60 border-2 border-dashed border-border',
          dims.wrap,
          className,
        )}
        style={{
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <Lock className={cn(dims.icon, 'text-muted-foreground/70')} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 relative',
        'bg-gradient-to-br',
        CATEGORY_RING[category],
        'border-2',
        CATEGORY_BORDER[category],
        dims.wrap,
        className,
      )}
      style={{
        // Indre ridge (subtilt indlejret indtryk) + ydre soft shadow
        boxShadow: `
          inset 0 1px 1px rgba(255,255,255,0.7),
          inset 0 -1px 2px rgba(139,123,91,0.25),
          0 1px 3px rgba(43,37,32,0.12)
        `,
      }}
    >
      {/* Indre cirkel/ring — den lille tynd-ring der giver "emalje"-følelsen */}
      <div
        className="absolute inset-1 rounded-full border opacity-50"
        style={{ borderColor: 'rgba(168, 124, 59, 0.4)' }}
        aria-hidden
      />
      <IconCmp className={cn(dims.icon, CATEGORY_ICON[category], 'relative z-10')} />
    </div>
  )
}
