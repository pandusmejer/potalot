import type { ReactNode } from 'react'

/**
 * Frøbank-kategori-glyffer — Annas uploadede PNG-illustrationer (LÅST 29/6).
 *
 * Transparente, varme botaniske ikoner i `public/images/glyphs/`. Erstatter de
 * tidligere hånd-SVG-glyffer (som blev afvist som retning). `className` styrer
 * størrelsen (h-/w-); `objectFit: contain` centrerer motivet i feltet.
 *
 * Eksport-fladen er uændret (FroebankFro/Loeg/… + FROEBANK_CATEGORY_GLYPHS), så
 * seed-bank-folder-panel + /glyf-pilot virker uden ændringer.
 */
type GlyphProps = { className?: string; strokeWidth?: number }

const SRC = {
  fro: '/images/glyphs/fro.png',
  loeg: '/images/glyphs/loeg.png',
  knolde: '/images/glyphs/knolde.png',
  buske: '/images/glyphs/buske.png',
  traeer: '/images/glyphs/traeer.png',
  stauder: '/images/glyphs/stauder.png',
} as const

function GlyphImg({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden draggable={false} className={className} style={{ objectFit: 'contain' }} />
  )
}

export function FroebankFro({ className }: GlyphProps) {
  return <GlyphImg src={SRC.fro} className={className} />
}
export function FroebankLoeg({ className }: GlyphProps) {
  return <GlyphImg src={SRC.loeg} className={className} />
}
export function FroebankKnolde({ className }: GlyphProps) {
  return <GlyphImg src={SRC.knolde} className={className} />
}
export function FroebankBuske({ className }: GlyphProps) {
  return <GlyphImg src={SRC.buske} className={className} />
}
export function FroebankTraeer({ className }: GlyphProps) {
  return <GlyphImg src={SRC.traeer} className={className} />
}
export function FroebankStauder({ className }: GlyphProps) {
  return <GlyphImg src={SRC.stauder} className={className} />
}

export const FROEBANK_CATEGORY_GLYPHS: {
  key: string
  label: string
  form: string
  Comp: (props: GlyphProps) => ReactNode
}[] = [
  { key: 'fro', label: 'Frø', form: 'spirende frø', Comp: FroebankFro },
  { key: 'loeg', label: 'Løg', form: 'løg', Comp: FroebankLoeg },
  { key: 'knolde', label: 'Knolde', form: 'knolde', Comp: FroebankKnolde },
  { key: 'buske', label: 'Buske', form: 'busk', Comp: FroebankBuske },
  { key: 'traeer', label: 'Træer', form: 'træ', Comp: FroebankTraeer },
  { key: 'stauder', label: 'Stauder', form: 'blomst', Comp: FroebankStauder },
]
