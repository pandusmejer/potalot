import type { SpisekammerData } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  data: SpisekammerData
}

// Afgrøde → sæson-accent + evt. makro-close-up (kun ægte filer → ingen
// dead-images). Fotos viser AFGRØDEN tydeligt (klase/frugt), ikke bare blad.
const AFGRODE: Record<string, { farve: string; foto: string | null }> = {
  tomat:      { farve: '#B85A3D', foto: '/images/makro/tomat-san-marzano/klase.jpg' }, // terracotta
  jordbaer:   { farve: '#C36F7C', foto: null },                                          // bærrosa
  agurk:      { farve: '#8B9774', foto: '/images/makro/agurk/frugt.jpg' },               // salvie/oliven
  chili:      { farve: '#AA4832', foto: '/images/makro/chili/blomst.jpg' },
  basilikum:  { farve: '#6E7F53', foto: '/images/makro/basilikum/bundt.jpg' },
  peberfrugt: { farve: '#B5613F', foto: null },
  squash:     { farve: '#7E8A54', foto: null },
}
// Roterende accent-palet til opskrift-tiles (variation frem for per-afgrøde).
const PALET = ['#B85A3D', '#C36F7C', '#8B9774', '#7E6480', '#9A6A3E']
const CREME = '#F7F1DF'

function artKey(s: string): string {
  return s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').trim().split(/[\s-]/)[0]
}
// Slå afgrøde op — robust mod flertal ("Agurker"→agurk, "Tomater"→tomat).
function afgrodeFor(navn: string): { farve: string; foto: string | null } | undefined {
  const k = artKey(navn)
  return AFGRODE[k] ?? AFGRODE[k.replace(/er$/, '')] ?? AFGRODE[k.replace(/e$/, '')] ?? AFGRODE[k.replace(/r$/, '')]
}

type Tile =
  | { slag: 'opskrift'; navn: string; farve: string; lead: boolean }
  | { slag: 'foto'; foto: string; label: string }
  | { slag: 'note'; linjer: string[] }
  | { slag: 'status'; poster: { antal: string; navn: string }[] }
  | { slag: 'cta'; tekst: string }

/**
 * RUM 10 · Spisekammer — have → høst → køkken som EDITORIAL MOSAIK.
 *
 * Et visuelt reward-moment i scrollen: 2-søjlers staggered mosaik der
 * veksler mellem opskrift-typografi på dæmpede sæson-farvefelter (lead +
 * sekundære), afgrøde-makrofotos (plante-/høststemning, ikke færdigret),
 * en stemnings-note og et stille høst-status. Kurateret magasin-mosaik —
 * ikke Pinterest, ikke opskriftsdatabase.
 */
export function Spisekammer({ data }: Props) {
  const { hoest, opskrifter } = data

  // ── Byg mosaik-tiles (varieret rækkefølge, tydeligt hierarki) ──
  const tiles: Tile[] = []
  opskrifter.forEach((navn, i) => {
    tiles.push({ slag: 'opskrift', navn, farve: PALET[i % PALET.length], lead: i === 0 })
    if (i === 1) tiles.push({ slag: 'note', linjer: ['Noget køligt', 'til varme dage'] })
  })
  // Afgrøde-fotos (op til 2, kun ægte makro-filer).
  const fotoTiles: Tile[] = []
  for (const h of hoest) {
    const a = afgrodeFor(h.navn)
    if (a?.foto && fotoTiles.length < 2) fotoTiles.push({ slag: 'foto', foto: a.foto, label: h.navn })
  }
  if (fotoTiles[0]) tiles.splice(1, 0, fotoTiles[0])
  if (fotoTiles[1]) tiles.splice(Math.min(4, tiles.length), 0, fotoTiles[1])
  // Stille høst-status (tal-logikken bevares som et lille bevis) + diskret
  // "mere"-åbning.
  if (hoest.length > 0) {
    tiles.push({ slag: 'status', poster: hoest.map(h => ({ antal: h.antal, navn: h.navn.toLowerCase() })) })
  }
  tiles.push({ slag: 'cta', tekst: 'Flere idéer' })

  // Fordel i to søjler (staggered masonry).
  const venstre: Tile[] = []
  const hoejre: Tile[] = []
  tiles.forEach((t, i) => (i % 2 === 0 ? venstre : hoejre).push(t))

  return (
    <section>
      {/* Overskrift peger fremad: hvad høsten KAN blive til. */}
      <p
        className="uppercase"
        style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.26em', color: 'rgba(36,48,31,0.5)', margin: 0, marginBottom: 18 }}
      >
        Det kan haven blive til
      </p>

      {tiles.length > 0 && (
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          {[venstre, hoejre].map((soejle, si) => (
            <div key={si} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {soejle.map((t, i) => (
                <MosaikTile key={i} tile={t} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function MosaikTile({ tile }: { tile: Tile }) {
  if (tile.slag === 'opskrift') {
    const lead = tile.lead
    return (
      <div style={{ background: tile.farve, borderRadius: 20, padding: lead ? '40px 18px 44px' : '22px 18px 24px', overflow: 'hidden' }}>
        <p style={{ fontFamily: serif, fontWeight: 500, fontSize: lead ? 'clamp(32px, 9vw, 40px)' : 'clamp(22px, 6vw, 27px)', lineHeight: 1.02, letterSpacing: '-0.01em', color: CREME, margin: 0 }}>
          {tile.navn}
        </p>
      </div>
    )
  }
  if (tile.slag === 'foto') {
    return (
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '3 / 4', background: '#E6DCC6' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tile.foto} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,26,16,0.55) 0%, rgba(20,26,16,0) 42%)' }} />
        <span
          className="uppercase"
          style={{ position: 'absolute', left: 20, bottom: 16, fontFamily: sans, fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: '#F7F1DF', textShadow: '0 1px 8px rgba(0,0,0,0.22)' }}
        >
          {tile.label}
        </span>
      </div>
    )
  }
  if (tile.slag === 'note') {
    return (
      <div style={{ background: '#EAE1CB', borderRadius: 20, padding: '24px 18px' }}>
        {/* Lille ornamental streg — plakat-detalje, ikke bare en sætning. */}
        <div aria-hidden style={{ width: 26, height: 2, background: 'rgba(95,102,88,0.45)', marginBottom: 14 }} />
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(24px, 6.5vw, 30px)', lineHeight: 1.1, color: '#5F6658', margin: 0 }}>
          {tile.linjer.map((l, i) => (
            <span key={i} style={{ display: 'block' }}>{l}</span>
          ))}
        </p>
      </div>
    )
  }
  if (tile.slag === 'status') {
    return (
      <div style={{ background: 'rgba(59,74,47,0.07)', borderRadius: 20, padding: '18px 16px' }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.42)', margin: '0 0 10px' }}>
          I kurven lige nu
        </p>
        {tile.poster.map(p => (
          <p key={p.navn} style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 8, lineHeight: 1.25 }}>
            <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: '#24301F', fontVariantNumeric: 'tabular-nums', minWidth: '1.8ch' }}>{p.antal}</span>
            <span style={{ fontFamily: serif, fontWeight: 400, fontSize: 17, color: 'rgba(36,48,31,0.68)' }}>{p.navn}</span>
          </p>
        ))}
      </div>
    )
  }
  // cta — diskret "mere"-åbning (antyder at feltet lever; endnu ingen destination)
  return (
    <div style={{ borderRadius: 20, padding: '16px 16px', border: '1px solid rgba(36,48,31,0.16)' }}>
      <span className="flex items-center" style={{ gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#3B4A2F' }}>
        {tile.tekst}
        <span aria-hidden>→</span>
      </span>
    </div>
  )
}
