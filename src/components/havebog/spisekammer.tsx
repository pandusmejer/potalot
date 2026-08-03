import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { SpisekammerData } from '@/data/havebog-demo'
import {
  selectSpisekammerAssets,
  saesonForMaaned,
  type SpisekammerAssetRole,
} from '@/lib/forvandling-registry'
import {
  vaelgForvandlinger,
  findForvandling,
  KATEGORI_FARVE,
  KATEGORI_LABEL,
  BASIS_MOSAIK,
  basisKategoriFarve,
  basisKategoriLabel,
  type ForvandlingKategori,
  type BasisMosaikElement,
} from '@/lib/havebog-forvandlinger'
import { selectForvandlingAssets } from '@/lib/forvandling-assets'
import { FORVANDLINGER_ROUTE } from '@/lib/constants'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const CREME = '#F7F1DF'

/** Markér at et tile-klik kom fra Havebog-mosaikken, så detailsidens tilbage-
 *  link kan føre tilbage TIL mosaikken (#det-kan-haven-blive-til) i stedet for
 *  Forvandlinger-oversigten. Se forvandling-tilbage-link.tsx. */
const HAVEBOG_ANKER_ID = 'det-kan-haven-blive-til'
function medFra(href: string): string {
  return href + (href.includes('?') ? '&' : '?') + 'from=havebog'
}

interface Props {
  data: SpisekammerData
  /**
   * 'strong'   = brugeren har høst → konkrete forvandlinger fra afgrøderne.
   * 'blivetil' = ingen høst endnu → BASIS-mosaik (8 generiske forvandlinger),
   *              ALDRIG falsk høst eller demo-data. Modulet er altid synligt.
   */
  mode?: 'strong' | 'blivetil'
}

type Tile =
  | { slag: 'forvandling'; id: string; title: string; kategori: ForvandlingKategori; farve: string; foto?: string; lead: boolean }
  | { slag: 'foto'; foto: string; label: string; role: SpisekammerAssetRole }
  | { slag: 'note'; linjer: string[] }
  | { slag: 'status'; poster: { antal: string; navn: string }[]; kunNavne: boolean }
  | { slag: 'cta'; tekst: string }

/**
 * RUM · "Det kan haven blive til" — Havebogs ENESTE Forvandlinger-preview.
 *
 * PRODUKTREGEL (Annas beslutning 12/7): Spisekammer er IKKE længere en separat
 * Havebog-sektion. Havebog viser præcis ÉT modul ("Det kan haven blive til"),
 * som er en kurateret PREVIEW af Forvandlinger-systemet — ikke en selvstændig
 * motor. Hierarki:
 *   Forvandlinger = det brede system (spis · gem · tør · bryg · duft · plej ·
 *                   pynt · så igen)
 *   Spisekammer   = en vinkel/filter INDE i Forvandlinger (spis + gem + tør +
 *                   bryg) — bor på /havebog/forvandlinger, ikke som eget rum.
 *
 * 4-6 kuraterede tiles valgt ud fra brugerens afgrøder/høst/frøbank/sæson; må
 * blande spiselige og ikke-spiselige forvandlinger. Hver tile → /havebog/
 * forvandlinger/[id]. CTA → "Se alle forvandlinger". Ingen pyntetal (høst vises
 * kun som navne når `antalErHoester`). "Sæsonens spisekammer" som historik hører
 * til sæsonarkiv/Profil senere (kræver mængder + gemte forvandlinger).
 */
export function Spisekammer({ data, mode = 'strong' }: Props) {
  if (mode === 'blivetil') return <SpisekammerBliveTil />

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
  const saeson = saesonForMaaned(maaned)

  // ── Byg mosaik-tiles (varieret rækkefølge, tydeligt hierarki) ──
  const tiles: Tile[] = []
  forvandlinger.forEach((f, i) => {
    // Asset-fallback: sort → afgrøde → kategori/mood → farve-tile. Findes der
    // intet foto (i dag: altid), rammer farve-tilen og udseendet er uændret.
    const asset = selectForvandlingAssets(f, { season: saeson })
    tiles.push({
      slag: 'forvandling',
      id: f.id,
      title: f.title,
      kategori: f.category,
      farve: KATEGORI_FARVE[f.category],
      foto: asset.slag === 'foto' ? asset.path : undefined,
      lead: i === 0,
    })
    if (i === 1) tiles.push({ slag: 'note', linjer: valg.note })
  })
  const fotoTiles: Tile[] = valg.fotos.map(f => ({ slag: 'foto', foto: f.path, label: f.cropLabel, role: f.role }))
  if (fotoTiles[0]) tiles.splice(1, 0, fotoTiles[0])
  if (fotoTiles[1]) tiles.splice(Math.min(4, tiles.length), 0, fotoTiles[1])
  if (valg.hoest.length > 0) {
    tiles.push({ slag: 'status', poster: valg.hoest.map(h => ({ antal: h.antal, navn: h.navn.toLowerCase() })), kunNavne: valg.antalErHoester })
  }
  tiles.push({ slag: 'cta', tekst: 'Se alle forvandlinger' })

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
    const eyebrow = (
      <span className="uppercase" style={{ display: 'block', fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.72)', marginBottom: lead ? 12 : 8 }}>
        {KATEGORI_LABEL[tile.kategori]}
      </span>
    )
    const titel = (
      <span style={{ display: 'block', fontFamily: serif, fontWeight: 500, fontSize: lead ? 'clamp(30px, 8.4cqw, 38px)' : 'clamp(21px, 5.6cqw, 26px)', lineHeight: 1.04, letterSpacing: '-0.01em', color: CREME }}>
        {tile.title}
      </span>
    )
    // Foto-behandling når asset-fallback fandt et billede; ellers farve-poster.
    if (tile.foto) {
      return (
        <Link
          href={medFra(`${FORVANDLINGER_ROUTE}/${tile.id}`)}
          className="no-underline block"
          style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: lead ? '3 / 4' : '1 / 1', background: tile.farve, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src={tile.foto} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${tile.farve}E6 0%, ${tile.farve}66 38%, rgba(0,0,0,0) 72%)` }} />
          <div style={{ position: 'relative', padding: lead ? '0 18px 22px' : '0 16px 18px' }}>
            {eyebrow}
            {titel}
          </div>
        </Link>
      )
    }
    return (
      <Link
        href={medFra(`${FORVANDLINGER_ROUTE}/${tile.id}`)}
        className="no-underline block"
        style={{ background: tile.farve, borderRadius: 20, padding: lead ? '34px 18px 40px' : '20px 18px 24px', overflow: 'hidden' }}
      >
        {eyebrow}
        {titel}
      </Link>
    )
  }
  if (tile.slag === 'foto') {
    return (
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '3 / 4', background: '#E6DCC6' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async" src={tile.foto} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
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
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(24px, 6.5cqw, 30px)', lineHeight: 1.1, color: '#5F6658', margin: 0 }}>
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
    <Link href={medFra(FORVANDLINGER_ROUTE)} className="no-underline block" style={{ borderRadius: 20, padding: '16px 16px', border: '1px solid rgba(36,48,31,0.16)' }}>
      <span className="flex items-center" style={{ gap: 4, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#3B4A2F' }}>
        {tile.tekst}
        <ChevronRight style={{ width: 16, height: 16 }} strokeWidth={2.4} aria-hidden />
      </span>
    </Link>
  )
}

/**
 * "Blive til"-tilstand: brugeren har endnu ingen høst. Vi lover IKKE noget
 * om DENNE haves resultater — men holder modulet levende med havens brede
 * output-univers: den faste BASIS_MOSAIK (8 generiske forvandlinger på tværs
 * af mad, gem, duft, pynt og natur). En teaser til universet, ikke en tom-
 * state og ikke demo-data. Copy siger "kan blive", ikke "er blevet".
 */
type BasisTile =
  | { slag: 'element'; el: BasisMosaikElement; foto?: string; farve: string; stor: boolean }
  | { slag: 'cta' }

function SpisekammerBliveTil() {
  const maaned = new Date().getMonth() + 1
  const saeson = saesonForMaaned(maaned)

  // Byg tile-listen i Annas rækkefølge. Foto resolves gennem det eksisterende
  // asset-system for de katalog-bundne elementer (crop-match → farve-fallback);
  // crop-løse projekter (insekthotel) får bevidst en farve-tile. Mosaikken
  // knækker aldrig på et manglende billede.
  const tiles: BasisTile[] = []
  BASIS_MOSAIK.forEach((el, i) => {
    const f = el.forvandlingId ? findForvandling(el.forvandlingId) : undefined
    const asset = f ? selectForvandlingAssets(f, { season: saeson }) : undefined
    tiles.push({
      slag: 'element',
      el,
      foto: asset?.slag === 'foto' ? asset.path : undefined,
      farve: basisKategoriFarve(el.category),
      stor: i === 0, // Tomatsauce = lead-tile (større, sætter tonen).
    })
  })
  tiles.push({ slag: 'cta' })

  const venstre: BasisTile[] = []
  const hoejre: BasisTile[] = []
  tiles.forEach((t, i) => (i % 2 === 0 ? venstre : hoejre).push(t))

  return (
    <section>
      <p
        className="uppercase"
        style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.26em', color: 'rgba(36,48,31,0.5)', margin: 0, marginBottom: 12 }}
      >
        Det kan haven blive til
      </p>
      <p style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(21px, 5.6cqw, 26px)', lineHeight: 1.18, color: '#5F6658', margin: '0 0 8px', maxWidth: '28ch' }}>
        Drømmer du om noget bestemt?
      </p>
      <p style={{ fontFamily: sans, fontWeight: 400, fontSize: 14, lineHeight: 1.5, color: '#6E7568', margin: '0 0 18px', maxWidth: '34ch' }}>
        Du behøver ikke have noget i haven endnu. Vælg en idé, så viser Potalot hvilke planter og sorter, der kan føre dig derhen.
      </p>
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        {[venstre, hoejre].map((soejle, si) => (
          <div key={si} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {soejle.map((t, i) => (
              <BasisMosaikTile key={i} tile={t} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function BasisMosaikTile({ tile }: { tile: BasisTile }) {
  if (tile.slag === 'cta') {
    return (
      <Link
        href={medFra(FORVANDLINGER_ROUTE)}
        className="no-underline block"
        style={{ borderRadius: 20, padding: '16px 16px', border: '1px solid rgba(36,48,31,0.16)' }}
      >
        <span className="flex items-center" style={{ gap: 4, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#3B4A2F' }}>
          Se alle forvandlinger
          <ChevronRight style={{ width: 16, height: 16 }} strokeWidth={2.4} aria-hidden />
        </span>
      </Link>
    )
  }

  const { el, foto, farve, stor } = tile
  const eyebrow = (
    <span className="uppercase" style={{ display: 'block', fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: foto ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.68)', marginBottom: stor ? 12 : 8 }}>
      {basisKategoriLabel(el.category)}
    </span>
  )
  const titel = (
    <span style={{ display: 'block', fontFamily: serif, fontWeight: 500, fontSize: stor ? 'clamp(30px, 8.4cqw, 38px)' : 'clamp(21px, 5.6cqw, 26px)', lineHeight: 1.04, letterSpacing: '-0.01em', color: CREME }}>
      {el.title}
    </span>
  )

  // Foto-tile (asset fundet) — foto i bund, kategori-tonet gradient over.
  if (foto) {
    return (
      <Link
        href={medFra(el.href)}
        className="no-underline block"
        style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: stor ? '3 / 4' : '1 / 1', background: farve, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async" src={foto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${farve}E6 0%, ${farve}66 38%, rgba(0,0,0,0) 72%)` }} />
        <div style={{ position: 'relative', padding: stor ? '0 18px 22px' : '0 16px 18px' }}>
          {eyebrow}
          {titel}
        </div>
      </Link>
    )
  }

  // Farve-tile (intet foto — fx crop-løse projekter). Rent typografisk felt.
  return (
    <Link
      href={medFra(el.href)}
      className="no-underline block"
      style={{ background: farve, borderRadius: 20, padding: stor ? '34px 18px 40px' : '24px 18px 28px', overflow: 'hidden' }}
    >
      {eyebrow}
      {titel}
    </Link>
  )
}
