/**
 * Trust-badge — det publikum-vendte kvalitets-signal på en guide.
 *
 * Tre typer, og kun én pr. guide:
 *   - Potalot-guide  → kvalitetssikret, standarden
 *   - Egen guide     → brugerens egne erfaringer (evt. baseret på Potalot)
 *   - AI-udkast      → automatisk genereret, ikke facttjekket
 *
 * Trust-systemet er en del af produktet — IKKE en admin-funktion.
 * Aldrig røde DRAFT-stempler. Aldrig juridisk advarsels-sprog.
 * Badgen er smuk, integreret, læseren-vendt.
 *
 * Ord der må IKKE bruges: Master, Mine, Promote, Flag, Clone.
 */

import { ShieldCheck, Sparkles, PenLine } from 'lucide-react'

export type GuideKind = 'potalot' | 'egen' | 'ai-udkast'

const sans = 'var(--font-manrope)'

interface Props {
  kind: GuideKind
  size?: 'sm' | 'md'
}

export function TrustBadge({ kind, size = 'md' }: Props) {
  const config = TRUST_CONFIG[kind]
  const Icon = config.icon
  const px = size === 'sm' ? '6px 10px' : '7px 12px'
  const fontSize = size === 'sm' ? 10.5 : 11.5
  const iconSize = size === 'sm' ? 12 : 13

  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        fontFamily: sans,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: px,
        borderRadius: 999,
        background: config.bg,
        color: config.fg,
        border: `1px solid ${config.border}`,
        lineHeight: 1,
      }}
    >
      <Icon style={{ width: iconSize, height: iconSize }} strokeWidth={2.2} />
      {config.label}
    </span>
  )
}

interface TrustConfig {
  label: string
  bg: string
  fg: string
  border: string
  icon: typeof ShieldCheck
}

const TRUST_CONFIG: Record<GuideKind, TrustConfig> = {
  potalot: {
    label: 'Potalot-guide',
    // Rolig botanisk grøn — bærer Potalots TOV
    bg: 'rgba(123,148,96,0.16)',
    fg: '#3D5A26',
    border: 'rgba(123,148,96,0.32)',
    icon: ShieldCheck,
  },
  egen: {
    // Varm papir-tone — brugerens egne erfaringer
    label: 'Egen guide',
    bg: 'rgba(216,196,160,0.30)',
    fg: '#6B5635',
    border: 'rgba(216,196,160,0.55)',
    icon: PenLine,
  },
  'ai-udkast': {
    // Neutral, blød lavendel — udkast-papir, ikke advarsels-rød
    label: 'AI-udkast',
    bg: 'rgba(180,165,200,0.22)',
    fg: '#5A4F73',
    border: 'rgba(180,165,200,0.50)',
    icon: Sparkles,
  },
}

/**
 * Map fra rå Guide til trust-badge-type.
 *
 * Real-data path (V1): public = Potalot, private = Egen.
 * Demo-laget kan flagge specifikke IDs som AI-udkast via aiIds.
 */
import type { GuideVisibility } from '@/lib/types'

export function guideKindFor(
  guide: { id: string; visibility: GuideVisibility },
  aiIds: ReadonlySet<string> | null,
): GuideKind {
  // public + system (Potalot-kuraterede master-guides) → potalot
  if (guide.visibility === 'public' || guide.visibility === 'system') return 'potalot'
  if (aiIds && aiIds.has(guide.id)) return 'ai-udkast'
  return 'egen'
}
