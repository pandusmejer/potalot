import type { SpisekammerData } from '@/data/havebog-demo'
import {
  selectSpisekammerAssets,
  saesonForMaaned,
  type SpisekammerAssetRole,
} from '@/lib/spisekammer-assets'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const CREME = '#F7F1DF'

interface Props {
  data: SpisekammerData
}

type Tile =
  | { slag: 'opskrift'; navn: string; farve: string; lead: boolean }
  | { slag: 'foto'; foto: string; label: string; role: SpisekammerAssetRole }
  | { slag: 'note'; linjer: string[] }
  | { slag: 'status'; poster: { antal: string; navn: string }[]; kunNavne: boolean }
  | { slag: 'cta'; tekst: string }

/**
 * RUM 10 · Spisekammer — have → høst → køkken som EDITORIAL MOSAIK.
 *
 * Et visuelt reward-moment: 2-søjlers staggered mosaik der veksler mellem
 * opskrift-typografi på dæmpede sæson-farvefelter, afgrøde-fotos valgt fra
 * Spisekammer-asset-systemet (lib/spisekammer-assets), en stemnings-note og
 * et stille høst-status. Fotos vælges med fallback sort → art → mood →
 * farvetile, så mosaikken aldrig knækker på et manglende billede.
 */
export function Spisekammer({ data }: Props) {
  const maaned = new Date().getMonth() + 1
  const valg = selectSpisekammerAssets({
    harvestedCrops: data.hoest,
    recipeIdeas: data.opskrifter,
    season: saesonForMaaned(maaned),
    maxPhotos: 2,
    antalErHoester: data.antalErHoester,
  })

  // ── Byg mosaik-tiles (varieret rækkefølge, tydeligt hierarki) ──
  const tiles: Tile[] = []
  valg.opskrifter.forEach((o, i) => {
    tiles.push({ slag: 'opskrift', navn: o.navn, farve: o.farve, lead: i === 0 })
    if (i === 1) tiles.push({ slag: 'note', linjer: valg.note })
  })
  const fotoTiles: Tile[] = valg.fotos.map(f => ({ slag: 'foto', foto: f.path, label: f.cropLabel, role: f.role }))
  if (fotoTiles[0]) tiles.splice(1, 0, fotoTiles[0])
  if (fotoTiles[1]) tiles.splice(Math.min(4, tiles.length), 0, fotoTiles[1])
  if (valg.hoest.length > 0) {
    tiles.push({
      slag: 'status',
      poster: valg.hoest.map(h => ({ antal: h.antal, navn: h.navn.toLowerCase() })),
      kunNavne: valg.antalErHoester, // ægte data: skjul tal (18 = logs, ikke stk.)
    })
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
    // Editorial status-tile, ikke adminfelt: varm sand-bund, markante tal,
    // serif-afgrøder, plakat-luft + subtil ornamental streg (note-familie).
    return (
      <div style={{ background: '#E7DFC9', borderRadius: 20, padding: '22px 18px' }}>
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
  // cta — diskret "mere"-åbning (antyder liv; ingen destination endnu)
  return (
    <div style={{ borderRadius: 20, padding: '16px 16px', border: '1px solid rgba(36,48,31,0.16)' }}>
      <span className="flex items-center" style={{ gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#3B4A2F' }}>
        {tile.tekst}
        <span aria-hidden>→</span>
      </span>
    </div>
  )
}
