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
// Bladform (v2: bredere, asymmetrisk, tydeligere Potalot-silhuet) + rolig nerve.
const LEAF_BODY = 'M5.6 20 C 2.8 12.3, 7.2 3.6, 20 3.3 C 20.2 7.2, 18.7 12.2, 14.8 15.9 C 11.6 19, 8.4 20, 5.6 20 Z'
const LEAF_VEIN = 'M7.4 18.2 C 11 13.4, 14.8 8.8, 18.6 5'

/* ── 1. FRØ — kerne/frøprik (v2: tungere) ─────────────────── */
export function GlyphFroe(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <g transform="rotate(20 12 12)">
        <ellipse cx="12" cy="12" rx="5.9" ry="8.3" fill={C.sand} />
        {/* frøprik (hilum) — den lille kerne-markør der genbruges */}
        <circle cx="11.8" cy="8.3" r="1.8" fill={C.soil} />
      </g>
    </Glyph>
  )
}

/* ── 2. SPIRE — stængel + bladlogik (v2: robust) ──────────── */
export function GlyphSpire(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* jord-mound — fyldigere, stænglen vokser ud af den */}
      <path d="M3.6 20 C 6.1 17.7, 17.9 17.7, 20.4 20 C 17.9 21.7, 6.1 21.7, 3.6 20 Z" fill={C.soil} />
      {/* stængel — tykkere, runde ender */}
      <path d="M12 20.4 C 12 16.6, 12 13.4, 12 8.8" stroke={C.green} strokeWidth="2.9" strokeLinecap="round" />
      {/* venstre blad — større */}
      <path d="M12 14.6 C 8.1 15, 5.1 12.7, 4.5 8.6 C 8.7 8.4, 11.7 10.5, 12 14.6 Z" fill={C.green} />
      {/* højre blad — dybere tone for læsbarhed */}
      <path d="M12 12 C 15.4 11.4, 18 8.6, 18.5 4.9 C 14.6 5.2, 12.2 7.5, 12 12 Z" fill={C.greenDeep} />
    </Glyph>
  )
}

/* ── 3. BLAD — bladform + rolig nerve (v2: mere karakter) ─── */
export function GlyphBlad(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={LEAF_BODY} fill={C.green} />
      <path d={LEAF_VEIN} stroke={C.greenDark} strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
    </Glyph>
  )
}

/* ── 4. TOMAT — frugt + botanisk top (v2: mindre emoji) ───── */
export function GlyphTomat(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* frugt — let uregelmæssig, ikke perfekt cirkel */}
      <path d="M12 8.3 C 17.7 8.1, 20.5 11.8, 20.2 15.3 C 19.9 19.1, 16.2 21.4, 11.8 21.4 C 7.3 21.4, 3.8 18.7, 4 14.9 C 4.2 11.3, 6.8 8.6, 12 8.3 Z" fill={C.tomato} />
      {/* calyx — rolig 3-flig, ikke stjerne */}
      <path d="M12 5.2 C 12.7 7.5, 13.9 8.6, 15.7 8.4 C 15.1 10, 13.7 10.8, 12 10.9 C 10.3 10.8, 8.9 10, 8.3 8.4 C 10.1 8.6, 11.3 7.5, 12 5.2 Z" fill={C.green} />
      {/* stilk */}
      <path d="M12 5.7 C 12 4.2, 12.6 3.2, 13.7 2.8" stroke={C.greenDeep} strokeWidth="1.8" strokeLinecap="round" />
    </Glyph>
  )
}

/* ── 5. VAND — dråbeform (v2: fyldigere) ──────────────────── */
export function GlyphVand(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 2.7 C 12 2.7, 19.1 11, 19.1 15.5 C 19.1 19.3, 15.9 21.9, 12 21.9 C 8.1 21.9, 4.9 19.3, 4.9 15.5 C 4.9 11, 12 2.7, 12 2.7 Z" fill={C.blue} />
      {/* highlight */}
      <path d="M9 18.6 C 7.6 17.4, 7.4 15.5, 8.3 13.8" stroke={C.blueLight} strokeWidth="2" strokeLinecap="round" />
    </Glyph>
  )
}

/* ── 6. SOL — vejr/energi (v2: organiske stråler) ─────────── */
export function GlyphSol(props: GlyphProps) {
  // Jitret vinkel + varieret længde = håndtegnet rytme, ikke perfekt cirkel.
  const RAYS = [
    { deg: -88, len: 9.9 }, { deg: -43, len: 8.9 }, { deg: 3, len: 10.0 }, { deg: 47, len: 8.8 },
    { deg: 91, len: 9.7 }, { deg: 135, len: 9.2 }, { deg: 179, len: 10.0 }, { deg: 224, len: 8.8 },
  ]
  return (
    <Glyph {...props}>
      {RAYS.map((r, i) => {
        const a = (r.deg * Math.PI) / 180
        const r1 = 7.1
        return (
          <line
            key={i}
            x1={12 + r1 * Math.cos(a)}
            y1={12 + r1 * Math.sin(a)}
            x2={12 + r.len * Math.cos(a)}
            y2={12 + r.len * Math.sin(a)}
            stroke={C.yellow}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        )
      })}
      <circle cx="12" cy="12" r="5.4" fill={C.yellow} />
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
