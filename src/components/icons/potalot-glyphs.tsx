import type { SVGProps, ReactNode } from 'react'

/**
 * Potalot Soft Glyphs — pilot (6 kerneformer).
 *
 * Se Docs/design-system/ikon-system.md. Fyldte, bløde, botaniske glyffer
 * med dæmpet havepalette, 1–3 interne detaljer og konsekvent optisk vægt.
 * 24×24 grid, hovedform ~18–20 px. De seks låser systemets grundformer:
 *
 *   Frø   → kerne/frøprik          Tomat → frugtform + botanisk top
 *   Spire → stængel + bladlogik    Vand  → dråbeform
 *   Blad  → bladform + indre nerve  Sol   → vejr/energi, organiske stråler
 *
 * Endnu IKKE et færdigt system — pilot til at se om formsproget holder.
 */

/** Dæmpet botanisk palette (fra ikon-system.md). */
const C = {
  greenDark: '#2F4F3A',
  green: '#7FA56B',
  greenDeep: '#5E7D4F',
  soil: '#C9A46B',
  sand: '#D8BA82',
  tomato: '#D85E58',
  yellow: '#E7B85A',
  blue: '#4E79A7',
  blueLight: '#86A9CC',
} as const

export type GlyphProps = {
  size?: number
  title?: string
} & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>

function Glyph({ size = 24, title, children, ...rest }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/* ── Delte grundformer — samme blad/frø/dråbe på tværs af systemet ── */
// Bladform (genbruges i Spire som mindre blade) + nerve.
const LEAF_BODY = 'M5 19.2 C 3.4 11.6, 8.6 4.2, 19.4 3.7 C 18.7 14.8, 12 18.6, 5 19.2 Z'
const LEAF_VEIN = 'M6.9 17.4 C 10.4 12.7, 14.4 8, 18.2 5.1'

/* ── 1. FRØ — kerne/frøprik ───────────────────────────────── */
export function GlyphFroe(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <g transform="rotate(22 12 12)">
        <ellipse cx="12" cy="12" rx="5.3" ry="7.6" fill={C.sand} />
        {/* frøprik (hilum) — den lille kerne-markør der genbruges */}
        <circle cx="12" cy="8.2" r="1.5" fill={C.soil} />
      </g>
    </Glyph>
  )
}

/* ── 2. SPIRE — stængel + bladlogik ───────────────────────── */
export function GlyphSpire(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* jordstribe */}
      <path d="M4.8 20.2 C 7.3 19.1, 16.7 19.1, 19.2 20.2 C 16.7 21.3, 7.3 21.3, 4.8 20.2 Z" fill={C.soil} />
      {/* stængel (2 px optisk stroke, runde ender) */}
      <path d="M12 20 C 12 16.5, 12 13.5, 12 9.4" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
      {/* venstre blad (samme bladfamilie, lille) */}
      <path d="M12 13.8 C 9 14.2, 6.6 12.3, 6 9.2 C 9.3 9, 11.7 10.7, 12 13.8 Z" fill={C.green} />
      {/* højre blad — dybere tone for læsbarhed */}
      <path d="M12 11.6 C 14.7 11.1, 16.9 8.8, 17.3 5.9 C 14.2 6.1, 12.2 8, 12 11.6 Z" fill={C.greenDeep} />
    </Glyph>
  )
}

/* ── 3. BLAD — bladform + indre nerve ─────────────────────── */
export function GlyphBlad(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={LEAF_BODY} fill={C.green} />
      <path d={LEAF_VEIN} stroke={C.greenDark} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </Glyph>
  )
}

/* ── 4. TOMAT — frugtform + botanisk top ──────────────────── */
export function GlyphTomat(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* frugt — bredere end høj, blød */}
      <path d="M12 8.4 C 17.3 8.4, 20.2 11.6, 20.2 15 C 20.2 18.9, 16.5 21.2, 12 21.2 C 7.5 21.2, 3.8 18.9, 3.8 15 C 3.8 11.6, 6.7 8.4, 12 8.4 Z" fill={C.tomato} />
      {/* calyx — blød 5-flig top */}
      <path d="M12 5 C 12.7 7, 13.8 8, 15.6 7.7 C 15 9.2, 14 10, 12 10.2 C 10 10, 9 9.2, 8.4 7.7 C 10.2 8, 11.3 7, 12 5 Z" fill={C.green} />
      {/* stilk */}
      <path d="M12 5.6 C 12 4.2, 12.5 3.2, 13.6 2.8" stroke={C.greenDeep} strokeWidth="1.6" strokeLinecap="round" />
    </Glyph>
  )
}

/* ── 5. VAND — dråbeform ──────────────────────────────────── */
export function GlyphVand(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3.2 C 12 3.2, 18.4 11, 18.4 15.3 C 18.4 18.9, 15.5 21.5, 12 21.5 C 8.5 21.5, 5.6 18.9, 5.6 15.3 C 5.6 11, 12 3.2, 12 3.2 Z" fill={C.blue} />
      {/* highlight */}
      <path d="M9.3 18 C 8.1 17, 7.9 15.4, 8.6 13.9" stroke={C.blueLight} strokeWidth="1.8" strokeLinecap="round" />
    </Glyph>
  )
}

/* ── 6. SOL — vejr/energi, organiske stråler ──────────────── */
export function GlyphSol(props: GlyphProps) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
    const a = (deg * Math.PI) / 180
    const r1 = 6.9
    const r2 = i % 2 === 0 ? 9.5 : 8.9 // let asymmetri = organisk
    return {
      x1: 12 + r1 * Math.cos(a),
      y1: 12 + r1 * Math.sin(a),
      x2: 12 + r2 * Math.cos(a),
      y2: 12 + r2 * Math.sin(a),
    }
  })
  return (
    <Glyph {...props}>
      {rays.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={C.yellow} strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="12" cy="12" r="5" fill={C.yellow} />
    </Glyph>
  )
}

/** Pilot-registret — rækkefølge + hvilken grundform hver glyph låser. */
export const POTALOT_GLYPHS: {
  key: string
  label: string
  form: string
  Comp: (p: GlyphProps) => ReactNode
}[] = [
  { key: 'froe', label: 'Frø', form: 'kerne / frøprik', Comp: GlyphFroe },
  { key: 'spire', label: 'Spire', form: 'stængel + bladlogik', Comp: GlyphSpire },
  { key: 'blad', label: 'Blad', form: 'bladform + indre nerve', Comp: GlyphBlad },
  { key: 'tomat', label: 'Tomat', form: 'frugtform + botanisk top', Comp: GlyphTomat },
  { key: 'vand', label: 'Vand', form: 'dråbeform', Comp: GlyphVand },
  { key: 'sol', label: 'Sol', form: 'vejr/energi + organiske stråler', Comp: GlyphSol },
]
