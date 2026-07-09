import Link from 'next/link'
import type { SpisekammerData } from '@/data/havebog-demo'
import {
  selectSpisekammerAssets,
  saesonForMaaned,
  type SpisekammerAssetRole,
} from '@/lib/spisekammer-assets'
import {
  vaelgForvandlinger,
  KATEGORI_FARVE,
  KATEGORI_LABEL,
  type ForvandlingKategori,
} from '@/lib/havebog-forvandlinger'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const CREME = '#F7F1DF'

interface Props {
  data: SpisekammerData
}

type Tile =
  | { slag: 'forvandling'; id: string; title: string; kategori: ForvandlingKategori; farve: string; lead: boolean }
  | { slag: 'foto'; foto: string; label: string; role: SpisekammerAssetRole }
  | { slag: 'note'; linjer: string[] }
  | { slag: 'status'; poster: { antal: string; navn: string }[]; kunNavne: boolean }
  | { slag: 'cta'; tekst: string }

/**
 * RUM 10 · "Det kan haven blive til" — havens OUTPUT-univers som mosaik.
 *
 * Ikke en opskriftssektion: forvandlinger på tværs af 8 kategorier (spis,
 * gem, tør, bryg, duft, plej, pynt, så igen) valgt ud fra brugerens afgrøder.
 * Tiles linker ind i /havebog/forvandlinger. Veksler mellem forvandlings-
 * typografi på kategori-farvefelter, afgrøde-fotos, note og høst-status.
 */
export function Spisekammer({ data }: Props) {
  const maaned = new Date().getMonth() + 1
  const crops = data.hoest.map(h => h.navn)
  const valg = selectSpisekammerAssets({
    harvestedCrops: data.hoest,
    recipeIdeas: [],
    season: saesonForMaaned(maaned),
    maxPhotos: 2,
    antalErHoester: data.antalErHoester,
  })
  const forvandlinger = vaelgForvandlinger({ crops, maxTiles: 6 })

  // ── Byg mosaik-tiles (varieret rækkefølge, tydeligt hierarki) ──
  const tiles: Tile[] = []
  forvandlinger.forEach((f, i) => {
    tiles.push({ slag: 'forvandling', id: f.id, title: f.title, kategori: f.category, farve: KATEGORI_FARVE[f.category], lead: i === 0 })
    if (i === 1) tiles.push({ slag: 'note', linjer: valg.note })
  })
  const fotoTiles: Tile[] = valg.fotos.map(f => ({ slag: 'foto', foto: f.path, label: f.cropLabel, role: f.role }))
  if (fotoTiles[0]) tiles.splice(1, 0, fotoTiles[0])
  if (fotoTiles[1]) tiles.splice(Math.min(4, tiles.length), 0, fotoTiles[1])
  if (valg.hoest.length > 0) {
    tiles.push({ slag: 'status', poster: valg.hoest.map(h => ({ antal: h.antal, navn: h.navn.toLowerCase() })), kunNavne: valg.antalErHoester })
  }
  tiles.push({ slag: 'cta', tekst: 'Flere idéer' })

  const venstre: Tile[] = []
  const hoejre: Tile[] = []
  tiles.forEach((t, i) => (i % 2 === 0 ? venstre : hoejre).push(t))

  return (
    <section>
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
  if (tile.slag === 'forvandling') {
    const lead = tile.lead
    return (
      <Link
        href={`/havebog/forvandlinger/${tile.id}`}
        className="no-underline block"
        style={{ background: tile.farve, borderRadius: 20, padding: lead ? '34px 18px 40px' : '20px 18px 24px', overflow: 'hidden' }}
      >
        <span className="uppercase" style={{ display: 'block', fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.72)', marginBottom: lead ? 12 : 8 }}>
          {KATEGORI_LABEL[tile.kategori]}
        </span>
        <span style={{ display: 'block', fontFamily: serif, fontWeight: 500, fontSize: lead ? 'clamp(30px, 8.4vw, 38px)' : 'clamp(21px, 5.6vw, 26px)', lineHeight: 1.04, letterSpacing: '-0.01em', color: CREME }}>
          {tile.title}
        </span>
      </Link>
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
      <div style={{ background: '#E7DDB2', borderRadius: 20, padding: '22px 18px' }}>
        <div aria-hidden style={{ width: 22, height: 2, background: 'rgba(94,102,88,0.4)', marginBottom: 13 }} />
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', color: '#8E9383', margin: '0 0 15px' }}>
          I kurven lige nu
        </p>
        {tile.poster.map(p => (
          <p key={p.navn} style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 12, lineHeight: 1.42 }}>
            {!tile.kunNavne && (
              <span style={{ fontFamily: sans, fontSize: 20, fontWeight: 600, color: '#24301F', fontVariantNumeric: 'tabular-nums', minWidth: '1.9ch' }}>{p.antal}</span>
            )}
            <span style={{ fontFamily: serif, fontWeight: 400, fontSize: tile.kunNavne ? 20 : 19, color: '#5E6658' }}>{p.navn}</span>
          </p>
        ))}
      </div>
    )
  }
  // cta → oversigten over forvandlinger
  return (
    <Link href="/havebog/forvandlinger" className="no-underline block" style={{ borderRadius: 20, padding: '16px 16px', border: '1px solid rgba(36,48,31,0.16)' }}>
      <span className="flex items-center" style={{ gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#3B4A2F' }}>
        {tile.tekst}
        <span aria-hidden>→</span>
      </span>
    </Link>
  )
}
