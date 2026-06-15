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

/* ── Ært — mørkegrøn diagonal bælg + lysere ærter ovenpå (Annas valg: B) ── */
export function GlyphAert(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <g transform="rotate(-30 12 12)">
        {/* mørk bælg */}
        <path d="M2.8 12.6 C 5.4 9.3, 18.6 9.3, 21.2 12.6 C 18.6 15.5, 5.4 15.5, 2.8 12.6 Z" fill={C.greenDark} />
        {/* lysere ærter ovenpå */}
        <circle cx="7.4" cy="11.6" r="2.5" fill={C.green} />
        <circle cx="12" cy="11.2" r="2.7" fill={C.green} />
        <circle cx="16.6" cy="11.6" r="2.5" fill={C.green} />
      </g>
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

/* ── Drivhus — glashus efter Annas ref: højt pyramidetag, fuldt glas-net + base ── */
export function GlyphDrivhus(props: GlyphProps) {
  const bar = C.pane
  return (
    <Glyph {...props}>
      {/* tag — højt pyramidetag med udhæng */}
      <path d="M12 2.2 C 12.35 2.2, 12.68 2.36, 12.92 2.62 L 21.9 10.7 C 22.35 11.1, 22.08 11.7, 21.5 11.7 L 2.5 11.7 C 1.92 11.7, 1.65 11.1, 2.1 10.7 L 11.08 2.62 C 11.32 2.36, 11.65 2.2, 12 2.2 Z" fill={C.green} />
      {/* krop */}
      <path d="M5.3 11.7 L 18.7 11.7 L 18.7 20 L 5.3 20 Z" fill={C.green} />
      {/* base-platform */}
      <rect x="3.1" y="19.7" width="17.8" height="2" rx="1" fill={C.greenDeep} />
      {/* glas-net — ét lag med fælles group-opacity, så kryds IKKE lyser op.
          Tynde, ensartede sprosser. */}
      <g stroke={bar} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.72">
        {/* tag: center + vandret bjælke + 2 diagonaler til vægtoppe */}
        <path d="M12 2.9 L 12 20" />
        <path d="M6.7 7 L 17.3 7" />
        <path d="M12 3.4 L 5.3 11.7" />
        <path d="M12 3.4 L 18.7 11.7" />
        {/* krop: tagrem + side-sprosser + vandrette ribber */}
        <path d="M3 11.7 L 21 11.7" />
        <path d="M8.3 11.7 L 8.3 20" />
        <path d="M15.7 11.7 L 15.7 20" />
        <path d="M5.3 16.2 L 8.3 16.2" />
        <path d="M15.7 16.2 L 18.7 16.2" />
      </g>
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
      {/* kurv-krop — hovedformen, fuldere og dybere */}
      <path d="M3.6 12.6 L 20.4 12.6 L 17.9 20.6 C 17.6 21.3, 16.9 21.7, 16.1 21.7 L 7.9 21.7 C 7.1 21.7, 6.4 21.3, 6.1 20.6 Z" fill={C.soil} />
      {/* fletning */}
      <path d="M5.6 15.6 C 9.7 16.5, 14.3 16.5, 18.4 15.6" stroke={C.sand} strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
      <path d="M6.4 18.7 C 9.9 19.3, 14.1 19.3, 17.6 18.7" stroke={C.sand} strokeWidth="1.7" strokeLinecap="round" opacity="0.6" />
      {/* kant/rim — kraftig lip */}
      <rect x="2.8" y="11" width="18.4" height="3.1" rx="1.55" fill={C.sand} />
      {/* afgrøde — 2-3 simple prikker der lige pibler op (støtter, dominerer ikke) */}
      <circle cx="9.4" cy="9.9" r="2" fill={C.tomato} />
      <circle cx="13" cy="9.6" r="2.1" fill={C.carrot} />
      <circle cx="16.3" cy="10.1" r="1.8" fill={C.green} />
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

/* ════════════ BATCH 3 — dyrkningshandlinger, havemiljøer, vejr ════════════
   Samme vægt/farver/afrundinger som batch 1+2. Ingen nye regler. */

/* ── Jord — blød muldbunke + korn ── */
export function GlyphJord(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.6 18.4 C 4.5 12.8, 9 10, 12 10 C 15 10, 19.5 12.8, 21.4 18.4 C 21.7 19.3, 21.1 20.2, 20.2 20.2 L 3.8 20.2 C 2.9 20.2, 2.3 19.3, 2.6 18.4 Z" fill={C.soil} />
      <circle cx="9" cy="16.2" r="1.1" fill={C.greenDeep} opacity="0.5" />
      <circle cx="13.4" cy="14.6" r="1" fill={C.greenDeep} opacity="0.45" />
      <circle cx="15.4" cy="17.4" r="1.1" fill={C.greenDeep} opacity="0.5" />
    </Glyph>
  )
}

/* ── Kompost — lumpet bunke (muld) + organiske tegn: blad, flis, orm ── */
export function GlyphKompost(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* lumpet bunke — flere humpe = piled, decomposed matter */}
      <path d="M2.8 19 C 3.4 16, 5 14.2, 6.6 14.8 C 7.4 13, 9.4 12.8, 10.6 14.2 C 11.6 12.6, 13.8 12.7, 14.8 14.4 C 16.2 13.6, 18.4 15, 21.2 19 C 21.6 19.7, 21.1 20.3, 20.3 20.3 L 3.7 20.3 C 2.9 20.3, 2.4 19.7, 2.8 19 Z" fill={C.greenDeep} />
      {/* muld-flis (halvt nedgravet) */}
      <ellipse cx="8.2" cy="16.8" rx="1.7" ry="1.1" fill={C.sand} transform="rotate(-16 8.2 16.8)" />
      <ellipse cx="15.4" cy="17.1" rx="1.5" ry="1" fill={C.soil} transform="rotate(20 15.4 17.1)" />
      {/* blad */}
      <path d="M12.3 13.7 C 10.5 12.5, 8.7 12.8, 7.9 14.2 C 9.6 15.1, 11.4 14.8, 12.3 13.7 Z" fill={C.green} />
      {/* orm */}
      <path d="M13.9 14.3 C 15.3 13.6, 16.7 14.5, 16.2 15.7 C 15.8 16.6, 16.9 17, 17.8 16.5" stroke={C.tomato} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />
    </Glyph>
  )
}

/* ── Krukke — terracotta urtepotte + lille spire ── */
export function GlyphKrukke(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 11 C 12 8.6, 12 7.2, 12 5.8" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8.6 C 13.8 8.2, 15 6.8, 15.2 5 C 13.2 5.4, 12.2 6.8, 12 8.6 Z" fill={C.green} />
      <path d="M12 9.6 C 10.4 9.2, 9.3 8.1, 9.1 6.6 C 10.8 6.9, 11.9 8, 12 9.6 Z" fill={C.greenDeep} />
      <path d="M5.6 10.4 L 18.4 10.4 L 17.7 12.6 L 6.3 12.6 Z" fill={C.soil} />
      <path d="M6.5 12.6 L 17.5 12.6 L 15.8 20.4 C 15.7 20.9, 15.2 21.2, 14.7 21.2 L 9.3 21.2 C 8.8 21.2, 8.3 20.9, 8.2 20.4 Z" fill={C.carrot} />
    </Glyph>
  )
}

/* ── Højbed — lav, bred trækasse + jord + småspirer ── */
export function GlyphHojbed(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M8 12.4 C 8 10.7, 8 9.7, 8 8.7" stroke={C.green} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 10.3 C 9.3 10, 10 9, 10.1 7.8 C 8.8 8, 8.1 9, 8 10.3 Z" fill={C.green} />
      <path d="M15.5 12.4 C 15.5 10.5, 15.5 9.4, 15.5 8.3" stroke={C.green} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 10.1 C 14.2 9.8, 13.5 8.8, 13.4 7.6 C 14.7 7.8, 15.4 8.8, 15.5 10.1 Z" fill={C.greenDeep} />
      <path d="M3.4 12.6 L 20.6 12.6 L 20.6 14.4 L 3.4 14.4 Z" fill={C.soil} />
      <path d="M3.4 14.4 L 20.6 14.4 L 20.6 19.8 C 20.6 20.2, 20.3 20.5, 19.9 20.5 L 4.1 20.5 C 3.7 20.5, 3.4 20.2, 3.4 19.8 Z" fill={C.sand} />
      <path d="M3.4 17.4 L 20.6 17.4" stroke={C.soil} strokeWidth="1.2" opacity="0.5" />
    </Glyph>
  )
}

/* ── Saks — tydeligt X: fyldte blade op, krydsede håndtag ned ── */
export function GlyphSaks(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* blade (fyldte, tapered) — øverste halvdel af X'et */}
      <path d="M4.4 2.9 L 13.1 11 L 11 12.9 Z" fill={C.greenDeep} />
      <path d="M19.6 2.9 L 10.9 11 L 13 12.9 Z" fill={C.greenDeep} />
      {/* håndtag — nederste halvdel af X'et, ned til greb */}
      <path d="M12 12 L 16.4 17.6" stroke={C.greenDeep} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 12 L 7.6 17.6" stroke={C.greenDeep} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16.9" cy="18.4" r="2.4" fill="none" stroke={C.greenDeep} strokeWidth="2.2" />
      <circle cx="7.1" cy="18.4" r="2.4" fill="none" stroke={C.greenDeep} strokeWidth="2.2" />
      {/* pivot */}
      <circle cx="12" cy="12.2" r="1.4" fill={C.soil} />
    </Glyph>
  )
}

/* ── Rive — bredt fyldt hoved + 4 tykke tænder + kort skaft ── */
export function GlyphRive(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* kort skaft */}
      <path d="M12 4.4 L 12 12.8" stroke={C.soil} strokeWidth="2.6" strokeLinecap="round" />
      {/* bredt fyldt hovedbjælke */}
      <rect x="4.2" y="12.6" width="15.6" height="2.8" rx="1.4" fill={C.greenDeep} />
      {/* 4 tykke tænder */}
      <g stroke={C.greenDeep} strokeWidth="2.4" strokeLinecap="round">
        <path d="M6.6 15.6 L 6.6 19.4" />
        <path d="M10.2 15.6 L 10.2 19.4" />
        <path d="M13.8 15.6 L 13.8 19.4" />
        <path d="M17.4 15.6 L 17.4 19.4" />
      </g>
    </Glyph>
  )
}

/* ── Skovl — spade: D-greb + varmt skaft + bredt skovlblad ── */
export function GlyphSkovl(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* D-greb */}
      <path d="M9.4 4.2 C 9.4 2.6, 14.6 2.6, 14.6 4.2" stroke={C.soil} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* skaft */}
      <path d="M12 3.4 L 12 11.6" stroke={C.soil} strokeWidth="2.4" strokeLinecap="round" />
      {/* hals + bredt skovlblad (bred top, blødt rundet bund — ikke en pil) */}
      <path d="M10.6 11.6 L 13.4 11.6 L 13.4 13 L 10.6 13 Z" fill={C.greenDeep} />
      <path d="M6.4 12.8 L 17.6 12.8 L 17.6 16.8 C 17.6 19.4, 15.1 21.4, 12 21.4 C 8.9 21.4, 6.4 19.4, 6.4 16.8 Z" fill={C.greenDeep} />
    </Glyph>
  )
}

/* ── Regn — blød organisk sky + dråber (ikke Lucide) ── */
export function GlyphRegn(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M6.6 13.6 C 4.3 13.6, 2.9 11.9, 3.3 10 C 3.6 8.5, 5.1 7.5, 6.7 7.8 C 7.1 5.7, 9.1 4.3, 11.4 4.7 C 13.3 5, 14.8 6.5, 15.1 8.3 C 17.3 8, 19.3 9.5, 19.3 11.5 C 19.3 12.8, 18.2 13.6, 16.7 13.6 Z" fill={C.blueLight} />
      <path d="M7.7 16.1 C 7.7 16.1, 9.1 17.9, 9.1 18.9 a1.4 1.4 0 0 1 -2.8 0 C 6.3 17.9, 7.7 16.1, 7.7 16.1 Z" fill={C.blue} />
      <path d="M12 16.9 C 12 16.9, 13.4 18.7, 13.4 19.7 a1.4 1.4 0 0 1 -2.8 0 C 10.6 18.7, 12 16.9, 12 16.9 Z" fill={C.blue} />
      <path d="M16.3 16.1 C 16.3 16.1, 17.7 17.9, 17.7 18.9 a1.4 1.4 0 0 1 -2.8 0 C 14.9 17.9, 16.3 16.1, 16.3 16.1 Z" fill={C.blue} />
    </Glyph>
  )
}

/* ── Frost — tyk, ikonisk iskrystal (3 fyldte arme, ingen tynde streger) ── */
export function GlyphFrost(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* 3 tykke tapered arme krydser → chunky 6-takket krystal */}
      <g fill={C.blueLight}>
        <path d="M12 3 L 13.7 12 L 12 21 L 10.3 12 Z" />
        <path d="M12 3 L 13.7 12 L 12 21 L 10.3 12 Z" transform="rotate(60 12 12)" />
        <path d="M12 3 L 13.7 12 L 12 21 L 10.3 12 Z" transform="rotate(120 12 12)" />
      </g>
      {/* kerne */}
      <circle cx="12" cy="12" r="2.4" fill={C.blue} />
    </Glyph>
  )
}

/* ── Vind — bløde organiske vindstød (ikke tynd streg) ── */
export function GlyphVind(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <g stroke={C.blueLight} strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M3.6 8.4 L 13 8.4 C 15.1 8.4, 15.7 5.4, 13.8 4.8 C 12.7 4.4, 12 5.2, 12.2 6" />
        <path d="M3.6 12.5 L 16.6 12.5 C 18.9 12.5, 19.5 15.7, 17.5 16.3 C 16.3 16.7, 15.5 15.8, 15.8 14.9" />
        <path d="M3.6 16.6 L 10.6 16.6 C 12.1 16.6, 12.6 18.7, 11.1 19.2" />
      </g>
    </Glyph>
  )
}

/** Batch 3-registret — dyrkningshandlinger, havemiljøer, vejr. */
export const POTALOT_GLYPHS_3: {
  key: string
  label: string
  form: string
  Comp: (p: GlyphProps) => ReactNode
}[] = [
  { key: 'jord', label: 'Jord', form: 'muld + korn', Comp: GlyphJord },
  { key: 'kompost', label: 'Kompost', form: 'organisk bunke', Comp: GlyphKompost },
  { key: 'krukke', label: 'Krukke', form: 'potte + spire', Comp: GlyphKrukke },
  { key: 'hojbed', label: 'Højbed', form: 'kasse + jord', Comp: GlyphHojbed },
  { key: 'saks', label: 'Saks', form: 'redskab', Comp: GlyphSaks },
  { key: 'rive', label: 'Rive', form: 'redskab + tænder', Comp: GlyphRive },
  { key: 'skovl', label: 'Skovl', form: 'redskab + blad', Comp: GlyphSkovl },
  { key: 'regn', label: 'Regn', form: 'sky + dråber', Comp: GlyphRegn },
  { key: 'frost', label: 'Frost', form: 'iskrystal', Comp: GlyphFrost },
  { key: 'vind', label: 'Vind', form: 'vindstød', Comp: GlyphVind },
]
