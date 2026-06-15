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
  purple: '#8E789D',
  carrot: '#D8804A', // dæmpet rod-orange (batch 2 — afventer Annas blåstempling)
  pane: '#FAFBF3', // kortfarve som "glas"-ruder i drivhus
  peaLight: '#A7C489', // frisk lysgrøn — ærter mod mørk bælg
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

/* ════════════ BATCH 2 — søskende til v2, samme vægt/formsprog ════════════ */

/* ── Blomst — organisk symmetri (5 kronblade + kerne + stængel) ── */
export function GlyphBlomst(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* stængel + blad */}
      <path d="M12 11.5 C 12 15, 12 17.6, 12 20.4" stroke={C.green} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 17.4 C 14.5 17.1, 16.4 15.4, 16.8 12.9 C 14 13.1, 12.2 14.7, 12 17.4 Z" fill={C.greenDeep} />
      {/* kronblade */}
      {[0, 72, 144, 216, 288].map((d) => (
        <ellipse key={d} cx="12" cy="5.9" rx="2.7" ry="3.7" fill={C.purple} transform={`rotate(${d} 12 9.6)`} />
      ))}
      {/* kerne */}
      <circle cx="12" cy="9.6" r="2.9" fill={C.yellow} />
    </Glyph>
  )
}

/* ── Ært — åben bælg (mørk cradle) + lyse ærter der popper op ── */
export function GlyphAert(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* slyngtråd */}
      <path d="M19.3 9.5 C 21 9.1, 21.2 7.2, 19.8 6.8 C 18.8 6.5, 18.4 7.7, 19.2 8.4" stroke={C.greenDeep} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* bælg — mørk cradle, åben foroven (maks kontrast til ærterne) */}
      <path d="M3.6 12.4 C 7 13.5, 17 13.5, 20.4 12.4 C 19.7 16.8, 16.2 19.2, 12 19.2 C 7.8 19.2, 4.3 16.8, 3.6 12.4 Z" fill={C.greenDark} />
      {/* 3 ærter — lyse, adskilte beads der popper op af bælgen */}
      <circle cx="7.3" cy="11.4" r="2.5" fill={C.peaLight} />
      <circle cx="12" cy="11" r="2.6" fill={C.peaLight} />
      <circle cx="16.7" cy="11.4" r="2.5" fill={C.peaLight} />
    </Glyph>
  )
}

/* ── Gulerod — rod + grønne toppe ── */
export function GlyphGulerod(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* grønne toppe */}
      <path d="M12 8.8 C 12 6.2, 12 4.8, 12 3.3" stroke={C.green} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11.3 8.8 C 9.9 6.8, 8.7 5.8, 7.4 5.2" stroke={C.green} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.7 8.8 C 14.1 6.8, 15.3 5.8, 16.6 5.2" stroke={C.green} strokeWidth="2.2" strokeLinecap="round" />
      {/* rod */}
      <path d="M9.1 9 C 10.1 8.1, 13.9 8.1, 14.9 9 C 15.3 9.5, 13.5 19, 12.5 21 C 12.2 21.6, 11.8 21.6, 11.5 21 C 10.5 19, 8.7 9.5, 9.1 9 Z" fill={C.carrot} />
      {/* ribber */}
      <path d="M10 12 C 11.4 12.5, 12.6 12.5, 14 12" stroke={C.tomato} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <path d="M10.5 15.4 C 11.5 15.8, 12.5 15.8, 13.5 15.4" stroke={C.tomato} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </Glyph>
  )
}

/* ── Løg — bulb + neck-skud + skaller ── */
export function GlyphLoeg(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* grønne skud */}
      <path d="M12 9 C 12 6.6, 12 5.2, 12 3.7" stroke={C.green} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11.6 9 C 10.6 7, 9.8 6, 9 5.4" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
      <path d="M12.4 9 C 13.4 7, 14.2 6, 15 5.4" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
      {/* bulb */}
      <path d="M12 8.6 C 13.4 8.6, 13.7 10.5, 14.5 11.6 C 16.9 13, 18.6 15, 18.6 17.2 C 18.6 20, 15.6 21.9, 12 21.9 C 8.4 21.9, 5.4 20, 5.4 17.2 C 5.4 15, 7.1 13, 9.5 11.6 C 10.3 10.5, 10.6 8.6, 12 8.6 Z" fill={C.sand} />
      {/* skaller */}
      <path d="M9.6 12.8 C 8.5 14.8, 8.3 17.8, 9.3 20.6" stroke={C.soil} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <path d="M14.4 12.8 C 15.5 14.8, 15.7 17.8, 14.7 20.6" stroke={C.soil} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </Glyph>
  )
}

/* ── Drivhus — strukturel figur med glas-ruder ── */
export function GlyphDrivhus(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* hus-silhuet (afrundede hjørner, blødt tag) */}
      <path d="M12 3.4 L 19.4 8.6 C 19.8 8.9, 20 9.3, 20 9.8 L 20 19 C 20 19.9, 19.3 20.6, 18.4 20.6 L 5.6 20.6 C 4.7 20.6, 4 19.9, 4 19 L 4 9.8 C 4 9.3, 4.2 8.9, 4.6 8.6 Z" fill={C.green} />
      {/* glas-ruder */}
      <path d="M12 4 L 12 20.6" stroke={C.pane} strokeWidth="1.5" opacity="0.75" />
      <path d="M4 13.2 L 20 13.2" stroke={C.pane} strokeWidth="1.5" opacity="0.55" />
      <path d="M5 9 L 19 9" stroke={C.pane} strokeWidth="1.5" opacity="0.5" />
    </Glyph>
  )
}

/* ── Snegl — skal (spiral) + fod + føleho­rn ── */
export function GlyphSnegl(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* fod */}
      <path d="M2.6 17.4 C 2.6 15.8, 4 15, 6 15 C 8 15, 14.2 14.8, 15.8 15.6 C 16.8 16.1, 16.6 17.6, 15.2 18.2 C 13.6 19, 6 19.1, 4.6 18.8 C 3.4 18.6, 2.6 18.3, 2.6 17.4 Z" fill={C.greenDeep} />
      {/* hoved */}
      <circle cx="4.2" cy="15.4" r="2.4" fill={C.greenDeep} />
      {/* følehorn */}
      <path d="M3.4 13.6 C 2.6 12.3, 2.3 11.1, 2.6 10" stroke={C.greenDeep} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="2.6" cy="9.4" r="1.1" fill={C.greenDeep} />
      <path d="M5.4 13.4 C 5.2 12.2, 5.2 11.3, 5.6 10.5" stroke={C.greenDeep} strokeWidth="1.6" strokeLinecap="round" />
      {/* skal */}
      <circle cx="13.6" cy="10.8" r="6.4" fill={C.sand} />
      <path d="M13.6 10.8 C 13.6 8.7, 16.2 8.7, 16.2 11 C 16.2 14, 11.9 14, 11.9 10.4 C 11.9 6.7, 16.9 6.7, 17 11" stroke={C.soil} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </Glyph>
  )
}

/* ── Bille — mariehøne (rød kuppel + hoved + skel + prikker) ── */
export function GlyphBille(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* krop */}
      <path d="M12 7.6 C 16.6 7.6, 19.5 11.1, 19.5 15 C 19.5 18.8, 16.2 21.2, 12 21.2 C 7.8 21.2, 4.5 18.8, 4.5 15 C 4.5 11.1, 7.4 7.6, 12 7.6 Z" fill={C.tomato} />
      {/* hoved */}
      <path d="M8.8 8.5 C 9.7 6.8, 14.3 6.8, 15.2 8.5 C 13.4 9.6, 10.6 9.6, 8.8 8.5 Z" fill={C.greenDark} />
      {/* midterskel */}
      <path d="M12 8.6 L 12 20.9" stroke={C.greenDark} strokeWidth="1.6" />
      {/* prikker */}
      <circle cx="8.7" cy="13" r="1.4" fill={C.greenDark} />
      <circle cx="15.3" cy="13" r="1.4" fill={C.greenDark} />
      <circle cx="9.3" cy="17.4" r="1.3" fill={C.greenDark} />
      <circle cx="14.7" cy="17.4" r="1.3" fill={C.greenDark} />
    </Glyph>
  )
}

/* ── Høstkurv — flettet, tilspidset kurv + kant + afgrøde over kanten ── */
export function GlyphHoestkurv(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* kurv-krop — tilspidset */}
      <path d="M4.4 13 L 19.6 13 L 17.3 20 C 17.1 20.6, 16.5 21, 15.8 21 L 8.2 21 C 7.5 21, 6.9 20.6, 6.7 20 Z" fill={C.soil} />
      {/* fletning */}
      <path d="M6.1 16 C 9.6 16.7, 14.4 16.7, 17.9 16" stroke={C.sand} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M6.9 18.5 C 9.9 19, 14.1 19, 17.1 18.5" stroke={C.sand} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* kant/rim */}
      <rect x="3.6" y="11.4" width="16.8" height="2.9" rx="1.45" fill={C.sand} />
      {/* afgrøde der pibler op over kanten */}
      <path d="M12 9.5 C 12.7 7.4, 12.3 5.9, 11 5.1 C 10.5 6.8, 10.8 8.3, 12 9.5 Z" fill={C.green} />
      <circle cx="9.6" cy="10.5" r="2.6" fill={C.tomato} />
      <circle cx="14.3" cy="10.8" r="2.3" fill={C.carrot} />
    </Glyph>
  )
}

/** Batch 2-registret — søskende til v2 (samme vægt/formsprog). */
export const POTALOT_GLYPHS_2: {
  key: string
  label: string
  form: string
  Comp: (p: GlyphProps) => ReactNode
}[] = [
  { key: 'blomst', label: 'Blomst', form: 'organisk symmetri', Comp: GlyphBlomst },
  { key: 'aert', label: 'Ært', form: 'afgrøde + frøprik', Comp: GlyphAert },
  { key: 'gulerod', label: 'Gulerod', form: 'rod + toppe', Comp: GlyphGulerod },
  { key: 'loeg', label: 'Løg', form: 'bulb + skud', Comp: GlyphLoeg },
  { key: 'drivhus', label: 'Drivhus', form: 'struktur + glas', Comp: GlyphDrivhus },
  { key: 'snegl', label: 'Snegl', form: 'skadedyr + spiral', Comp: GlyphSnegl },
  { key: 'bille', label: 'Bille', form: 'nyttedyr + prikker', Comp: GlyphBille },
  { key: 'hoestkurv', label: 'Høstkurv', form: 'objekt/redskab', Comp: GlyphHoestkurv },
]

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
