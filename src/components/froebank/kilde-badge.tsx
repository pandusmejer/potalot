/**
 * KildeBadge — proveniens-markør for autofyldte dyrkningsfelter.
 *
 * Viser hvor et felts værdi kommer fra under OPRETTELSE (form-session only —
 * intet persisteres; når brugeren gemmer, er alle værdier brugerens egne):
 *   'sort' → "Fra sorten"        (Potalots sortsguide)
 *   'art'  → "Fra arten"         (arts-guiden, ærlig fallback)
 *   'egen' → "Tilpasset af dig"  (brugeren har rettet værdien)
 *
 * Regler (Anna 2/8): badges vises KUN ved autofyldte/brugerændrede felter —
 * aldrig på tomme felter (de får placeholder "Ikke udfyldt endnu" i stedet).
 * Tone følger SourceChip/TrustBadge-familien: rolig, tertiær, aldrig rød.
 */

import { cn } from '@/lib/utils'

export type KildeType = 'sort' | 'art' | 'egen'

const KILDE_META: Record<KildeType, { label: string; klasse: string }> = {
  sort: { label: 'Fra sorten', klasse: 'bg-primary/10 text-primary' },
  art: { label: 'Fra arten', klasse: 'bg-primary/[0.06] text-primary/70' },
  egen: { label: 'Tilpasset af dig', klasse: 'bg-amber-500/10 text-amber-700' },
}

export function KildeBadge({ kilde }: { kilde: KildeType }) {
  const m = KILDE_META[kilde]
  return (
    <span
      className={cn(
        'inline-block rounded-full px-1.5 py-0.5 align-middle',
        'text-[10px] font-semibold leading-none whitespace-nowrap',
        m.klasse,
      )}
    >
      {m.label}
    </span>
  )
}
