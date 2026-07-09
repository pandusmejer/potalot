import type { SpisekammerData } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  data: SpisekammerData
}

// Afgrøde → sæson-accent + evt. makro-close-up (kun ægte filer → ingen
// dead-images). Farverne er dæmpede, redaktionelle — ikke neon.
const AFGRODE: Record<string, { farve: string; foto: string | null }> = {
  tomat:      { farve: '#B0563A', foto: '/images/makro/tomat/blad-lys.jpg' },      // terracotta
  jordbaer:   { farve: '#C1727C', foto: null },                                     // rosa
  agurk:      { farve: '#84906C', foto: '/images/makro/agurk/frugt.jpg' },          // salviegrøn
  chili:      { farve: '#AA4832', foto: '/images/makro/chili/blomst.jpg' },
  basilikum:  { farve: '#6E7F53', foto: '/images/makro/basilikum/bundt.jpg' },
  peberfrugt: { farve: '#B5613F', foto: null },
  squash:     { farve: '#7E8A54', foto: null },
}
// Roterende accent-palet til opskrift-tiles (variation frem for per-afgrøde).
const PALET = ['#B0563A', '#C1727C', '#84906C', '#7E6480', '#9A6A3E']
const CREME = '#F6F0DF'

function artKey(s: string): string {
  return s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').trim().split(/[\s-]/)[0]
}
// Slå afgrøde op — robust mod flertal ("Agurker"→agurk, "Tomater"→tomat).
function afgrodeFor(navn: string): { farve: string; foto: string | null } | undefined {
  const k = artKey(navn)
  return AFGRODE[k] ?? AFGRODE[k.replace(/er$/, '')] ?? AFGRODE[k.replace(/e$/, '')] ?? AFGRODE[k.replace(/r$/, '')]
}

// En lille rolig note — stemning, ikke opskrift.
const NOTE = 'Noget køligt til varme dage'

type Tile =
  | { slag: 'opskrift'; navn: string; farve: string; hoej: boolean }
  | { slag: 'foto'; foto: string; label: string }
  | { slag: 'note'; tekst: string }
  | { slag: 'ingrediens'; tekst: string }

/**
 * RUM 10 · Spisekammer — have → høst → køkken som EDITORIAL MOSAIK.
 *
 * Bryder Havebogens rolige tekstflow med et "visual reward": en 2-søjlers
 * staggered mosaik der veksler mellem opskrift-typografi på farvefelter,
 * afgrøde-makrofotos og små stemnings-/ingrediens-tiles. Kurateret magasin-
 * mosaik — ikke Pinterest-kaos. Data (høst + opskrifter) kommer fra
 * spisekammer-motoren; her er kun præsentationen.
 */
export function Spisekammer({ data }: Props) {
  const { hoest, opskrifter } = data

  // ── Byg mosaik-tiles (varieret rækkefølge) ──
  const tiles: Tile[] = []
  opskrifter.forEach((navn, i) => {
    tiles.push({ slag: 'opskrift', navn, farve: PALET[i % PALET.length], hoej: i % 3 === 0 })
    if (i === 1) tiles.push({ slag: 'note', tekst: NOTE })
  })
  // Afgrøde-fotos (op til 2, kun ægte makro-filer).
  const fotoTiles: Tile[] = []
  for (const h of hoest) {
    const a = afgrodeFor(h.navn)
    if (a?.foto && fotoTiles.length < 2) fotoTiles.push({ slag: 'foto', foto: a.foto, label: h.navn })
  }
  // Væv fotos ind (efter 1. og 3. opskrift-tile).
  if (fotoTiles[0]) tiles.splice(1, 0, fotoTiles[0])
  if (fotoTiles[1]) tiles.splice(Math.min(4, tiles.length), 0, fotoTiles[1])
  // Ingrediens-tile: de aktuelle afgrøder.
  if (hoest.length > 0) {
    tiles.push({ slag: 'ingrediens', tekst: hoest.map(h => h.navn.toLowerCase()).join(' · ') })
  }

  // Fordel i to søjler (staggered masonry).
  const venstre: Tile[] = []
  const hoejre: Tile[] = []
  tiles.forEach((t, i) => (i % 2 === 0 ? venstre : hoejre).push(t))

  return (
    <section>
      {/* A · Kompakt intro — tætte counters, mindre luft */}
      <p
        className="uppercase"
        style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.26em', color: 'rgba(36,48,31,0.5)', margin: 0, marginBottom: 16 }}
      >
        I dit spisekammer · denne uge
      </p>
      <div style={{ marginBottom: 26 }}>
        {hoest.map(h => (
          <p key={h.navn} style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 10, lineHeight: 1.12 }}>
            <span style={{ fontFamily: sans, fontSize: 'clamp(24px, 5.6vw, 30px)', fontWeight: 700, color: '#24301F', fontVariantNumeric: 'tabular-nums', minWidth: '2ch' }}>
              {h.antal}
            </span>
            <span style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(18px, 4.2vw, 23px)', color: 'rgba(36,48,31,0.7)' }}>
              {h.navn}
            </span>
          </p>
        ))}
      </div>

      {/* B · Mosaik — 2 søjler, varierede højder */}
      {tiles.length > 0 && (
        <>
          <p
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(36,48,31,0.42)', margin: '0 0 14px' }}
          >
            Det kan haven blive til
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {[venstre, hoejre].map((soejle, si) => (
              <div key={si} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {soejle.map((t, i) => (
                  <MosaikTile key={i} tile={t} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function MosaikTile({ tile }: { tile: Tile }) {
  if (tile.slag === 'opskrift') {
    return (
      <div style={{ background: tile.farve, borderRadius: 14, padding: tile.hoej ? '32px 16px 34px' : '20px 16px 22px', overflow: 'hidden' }}>
        <p style={{ fontFamily: serif, fontWeight: 500, fontSize: tile.hoej ? 'clamp(28px, 8vw, 38px)' : 'clamp(22px, 6vw, 28px)', lineHeight: 1.04, letterSpacing: '-0.01em', color: CREME, margin: 0 }}>
          {tile.navn}
        </p>
      </div>
    )
  }
  if (tile.slag === 'foto') {
    return (
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '3 / 4', background: '#E6DCC6' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tile.foto} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,26,16,0.5) 0%, rgba(20,26,16,0) 45%)' }} />
        <span style={{ position: 'absolute', left: 12, bottom: 10, fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: CREME }}>
          {tile.label}
        </span>
      </div>
    )
  }
  if (tile.slag === 'note') {
    return (
      <div style={{ background: '#EBE3CE', borderRadius: 14, padding: '20px 16px' }}>
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(17px, 4.4vw, 21px)', lineHeight: 1.24, color: '#5B5335', margin: 0 }}>
          {tile.tekst}
        </p>
      </div>
    )
  }
  // ingrediens
  return (
    <div style={{ background: 'rgba(59,74,47,0.08)', borderRadius: 14, padding: '16px 14px' }}>
      <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', color: '#3B4A2F', margin: 0 }}>
        {tile.tekst}
      </p>
    </div>
  )
}
