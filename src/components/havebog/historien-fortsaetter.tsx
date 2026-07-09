import { ArrowRight, BookOpen } from 'lucide-react'
import type { ArchivedPlant } from '@/data/havebog-demo'
import { laantErfaring } from '@/lib/havevisdom'
import { aktuelMaaned } from '@/lib/datetime'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  plants: ArchivedPlant[]
}

/**
 * Kapitel 5: "Historien fortsætter" — bogens rolige afslutning
 * (V7, havebog.md V3).
 *
 * Kapitel-tempo: BRED komposition, lavt tempo. Fremtid, arkiv,
 * refleksion. INGEN CTA, ingen knapper, ingen navigation, intet salg.
 *
 * Med arkiv: én reflekterende linje + arkiverede planter som stille,
 * brede tekstrækker med hårstreger — ikke kort, ikke grid. Det der
 * er afsluttet læses som erfaring, ikke som database-poster.
 *
 * Uden arkiv (første sæson): ét bredt, lavt naturfoto med lånt
 * erfaring (V6 niveau 0) — bogen lukker stille med et kig fremad.
 *
 * ⚠️ Stadig rent read-only. INGEN <Link href="/mine-planter/...">.
 * Planter-universet er bygget til AKTIV dyrkning; en arkiveret tomat
 * hører ikke hjemme dér. Dedikeret arkiv-detailside er en senere
 * opgave.
 */
export function HistorienFortsaetter({ plants }: Props) {
  return (
    <section className="space-y-5">
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
        }}
      >
        Historien fortsætter
      </p>

      {plants.length === 0 ? <FoersteSaesonSlutning /> : <Arkiv plants={plants} />}
    </section>
  )
}

/**
 * Arkivet som en stak af arkivkort — gamle havebogsblade. Hvert forløb
 * er et taktilt kort (år-chip, thumbnail, titel, resultat, pil), ikke en
 * tekstrække. Bag den nederste kant peeker et par lag frem, så stakken
 * føles som noget man kan bladre i. Bevidst ANDERLEDES end Minder: dette
 * er arkiv, ikke levende sæson.
 *
 * Max 3 forløb — nok til dybde, ikke nok til at blive kælderrum. "Se
 * tidligere sæsoner" er en visuel indgang; den peger på et sæsonarkiv
 * der bygges senere (ingen rute endnu — bevidst ikke-navigerende).
 */
function Arkiv({ plants }: { plants: ArchivedPlant[] }) {
  const vist = plants.slice(0, 3)
  return (
    <div className="space-y-5">
      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(19px, 3.8vw, 24px)',
          lineHeight: 1.35,
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
          maxWidth: '30ch',
        }}
      >
        Det der er afsluttet, er blevet erfaring.
      </p>

      {/* Kort-stak med peek-lag bagved den nederste kant */}
      <div style={{ position: 'relative' }}>
        <div className="flex flex-col" style={{ gap: 11, position: 'relative', zIndex: 2 }}>
          {vist.map(p => (
            <ArkivKort key={p.id} plant={p} />
          ))}
        </div>
        {/* To forskudte lag der peeker frem under stakken */}
        <div aria-hidden style={{ position: 'absolute', left: 10, right: 10, bottom: -7, height: 18, background: '#EBE3CF', border: '1px solid #D8D0B9', borderRadius: 18, zIndex: 1 }} />
        <div aria-hidden style={{ position: 'absolute', left: 20, right: 20, bottom: -13, height: 16, background: '#E7DECA', border: '1px solid #D5CCB3', borderRadius: 18, zIndex: 0 }} />
      </div>

      {/* Indgang til sæsonarkivet — visuel intention, rute bygges senere */}
      <div
        className="flex items-center"
        style={{ gap: 12, marginTop: 20, padding: '15px 18px', background: 'rgba(59,74,47,0.045)', borderRadius: 16 }}
      >
        <BookOpen className="h-[18px] w-[18px]" style={{ color: 'rgba(36,48,31,0.5)', flexShrink: 0 }} aria-hidden strokeWidth={1.7} />
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: 'rgba(36,48,31,0.7)' }}>
          Se tidligere sæsoner
        </span>
        <ArrowRight className="h-[18px] w-[18px]" style={{ color: 'rgba(36,48,31,0.4)', marginLeft: 'auto', flexShrink: 0 }} aria-hidden strokeWidth={1.7} />
      </div>
    </div>
  )
}

/** Ét arkivkort — taktilt havebogsblad. */
function ArkivKort({ plant: p }: { plant: ArchivedPlant }) {
  return (
    <div
      className="flex items-center"
      style={{ gap: 14, background: '#EEE7D5', border: '1px solid #D8D0B9', borderRadius: 20, padding: '14px 16px' }}
    >
      {/* Thumbnail eller farvefelt */}
      <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 14, overflow: 'hidden', background: '#E2D9C1' }}>
        {p.primaryImageId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.primaryImageId} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
        )}
      </div>

      {/* År-chip */}
      <span
        style={{ flexShrink: 0, fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'rgba(36,48,31,0.5)', background: '#E3DAC3', borderRadius: 8, padding: '5px 9px' }}
      >
        {p.archivedYear}
      </span>

      {/* Titel + resultat */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(19px, 4.4vw, 23px)', lineHeight: 1.12, color: '#24301F', margin: 0 }}
        >
          {p.name}
          {p.variety && (
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(36,48,31,0.58)' }}> {p.variety}</span>
          )}
        </p>
        {p.summary && (
          <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: 'rgba(36,48,31,0.52)', margin: '3px 0 0' }}>
            {p.summary}
          </p>
        )}
      </div>

      {/* Åbne-indikation */}
      <div
        aria-hidden
        style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(36,48,31,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ArrowRight className="h-4 w-4" style={{ color: 'rgba(36,48,31,0.55)' }} strokeWidth={1.8} />
      </div>
    </div>
  )
}

/**
 * Første sæson: intet arkiv endnu. Ét bredt, lavt naturfoto lukker
 * bogen — duggen på bladet som "fundet øjeblik", lånt erfaring som
 * den reflekterende linje. Ingen polaroid, ingen ramme (V7-forbud).
 */
function FoersteSaesonSlutning() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        marginInline: -16,
        aspectRatio: '1.9 / 1',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/makro/chili/blad-dug.jpg"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 45%',
          filter: 'saturate(0.92)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(12,18,8,0.52) 0%, rgba(12,18,8,0.30) 45%, rgba(12,18,8,0.08) 80%, rgba(12,18,8,0) 100%)',
        }}
      />
      <div
        className="relative z-10 flex h-full flex-col justify-center"
        style={{ padding: '0 26px', maxWidth: 380 }}
      >
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(18px, 3.6vw, 24px)',
            lineHeight: 1.3,
            color: 'rgba(244,239,220,0.95)',
            textShadow: '0 1px 14px rgba(12,18,8,0.55)',
            margin: 0,
          }}
        >
          {laantErfaring(aktuelMaaned()).historik}
        </p>
        <p
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 'clamp(14px, 2.7vw, 17px)',
            lineHeight: 1.45,
            color: 'rgba(244,239,220,0.76)',
            textShadow: '0 1px 12px rgba(12,18,8,0.55)',
            margin: 0,
            marginTop: 12,
          }}
        >
          Din egen historie begynder her — med den første sæson.
        </p>
      </div>
    </div>
  )
}
