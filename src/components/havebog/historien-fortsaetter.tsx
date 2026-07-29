import Link from 'next/link'
import { ChevronRight, BookOpen } from 'lucide-react'
import type { ArchivedPlant } from '@/data/havebog-demo'
import { laantErfaring } from '@/lib/havevisdom'
import { aktuelMaaned } from '@/lib/datetime'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  plants: ArchivedPlant[]
  /** false i demo (opdigtede arkiv-id'er ruter ikke) → kort er ikke-klikbare. */
  linkable?: boolean
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
 * Kortene er nu navigerbare (Anna 15/7): hvert kort → plantens detalje-side,
 * hvor den kan hentes tilbage eller slettes.
 * Planter-universet er bygget til AKTIV dyrkning; en arkiveret tomat
 * hører ikke hjemme dér. Dedikeret arkiv-detailside er en senere
 * opgave.
 */
export function HistorienFortsaetter({ plants, linkable = true }: Props) {
  return (
    <section>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
        }}
      >
        Historien fortsætter
      </p>

      {plants.length === 0 ? (
        <div style={{ marginTop: 20 }}>
          <FoersteSaesonSlutning />
        </div>
      ) : (
        <Arkiv plants={plants} linkable={linkable} />
      )}
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
 * tidligere sæsoner" fører til sæsonarkivet (/mine-planter/arkiv).
 */
function Arkiv({ plants, linkable }: { plants: ArchivedPlant[]; linkable: boolean }) {
  const vist = plants.slice(0, 3)
  return (
    <div>
      {/* Undertekst — samme størrelse/linjeafstand som Minders undertitel */}
      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(17px, 3.9cqw, 20px)',
          lineHeight: 'normal',
          color: 'rgba(36,48,31,0.55)',
          margin: '4px 0 22px',
          whiteSpace: 'nowrap',
        }}
      >
        Det der er afsluttet, er blevet erfaring.
      </p>

      {/* Kort-stak med peek-lag bagved den nederste kant */}
      <div style={{ position: 'relative' }}>
        <div className="flex flex-col" style={{ gap: 11, position: 'relative', zIndex: 2 }}>
          {vist.map(p => (
            <ArkivKort key={p.id} plant={p} linkable={linkable} />
          ))}
        </div>
        {/* To forskudte lag der peeker frem under stakken */}
        <div aria-hidden style={{ position: 'absolute', left: 10, right: 10, bottom: -7, height: 18, background: '#EBE3CF', border: '1px solid #D8D0B9', borderRadius: 18, zIndex: 1 }} />
        <div aria-hidden style={{ position: 'absolute', left: 20, right: 20, bottom: -13, height: 16, background: '#E7DECA', border: '1px solid #D5CCB3', borderRadius: 18, zIndex: 0 }} />
      </div>

      {/* Indgang til sæsonarkivet — nu en ægte rute (Anna 15/7). */}
      <Link
        href="/mine-planter/arkiv"
        className="flex items-center no-underline"
        style={{ gap: 12, marginTop: 22, color: 'inherit' }}
      >
        <BookOpen className="h-[18px] w-[18px]" style={{ color: 'rgba(36,48,31,0.5)', flexShrink: 0 }} aria-hidden strokeWidth={1.7} />
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: 'rgba(36,48,31,0.7)' }}>
          Se tidligere sæsoner
        </span>
        <ChevronRight className="h-[18px] w-[18px]" style={{ color: 'rgba(36,48,31,0.4)', marginLeft: 'auto', flexShrink: 0 }} aria-hidden strokeWidth={2.2} />
      </Link>
    </div>
  )
}

/** Ét arkivkort — taktilt havebogsblad. */
function ArkivKort({ plant: p, linkable }: { plant: ArchivedPlant; linkable: boolean }) {
  const kortStyle = { gap: 12, background: '#EEE7D5', border: '1px solid #D8D0B9', borderRadius: 20, padding: '12px 14px' } as const
  const inner = (
    <>
      {/* Thumbnail eller farvefelt (136×140 @2x ≈ 68×70) */}
      <div style={{ flexShrink: 0, width: 68, height: 70, borderRadius: 14, overflow: 'hidden', background: '#E2D9C1' }}>
        {p.primaryImageId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={p.primaryImageId} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
        )}
      </div>

      {/* Tekst — art + sort på samme linje, år og resultat vandret nedenunder */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(17px, 4.2cqw, 20px)', lineHeight: 1.1, color: '#24301F', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {p.name}
          {p.variety && (
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(36,48,31,0.58)' }}> {p.variety}</span>
          )}
        </p>
        <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
          <span
            style={{ flexShrink: 0, fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'rgba(36,48,31,0.5)', background: '#E3DAC3', borderRadius: 7, padding: '3px 7px' }}
          >
            {p.archivedYear}
          </span>
          {p.summary && (
            <span style={{ minWidth: 0, fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: 'rgba(36,48,31,0.52)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.summary}
            </span>
          )}
        </div>
      </div>

      {/* Åbne-indikation */}
      <div
        aria-hidden
        style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 999, border: '1px solid rgba(36,48,31,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronRight className="h-4 w-4" style={{ color: 'rgba(36,48,31,0.55)' }} strokeWidth={2.2} />
      </div>
    </>
  )

  // Demo (anonym) har opdigtede arkiv-id'er der ikke ruter → ikke-klikbart kort.
  // Rigtige, indloggede planter har ægte id'er → kort åbner detalje-siden.
  return linkable ? (
    <Link
      href={`/mine-planter/${p.id}`}
      className="flex items-center no-underline transition-transform active:scale-[0.995]"
      style={{ ...kortStyle, color: 'inherit' }}
    >
      {inner}
    </Link>
  ) : (
    <div className="flex items-center" style={kortStyle}>{inner}</div>
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
      <img loading="lazy" decoding="async"
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
            fontSize: 'clamp(18px, 3.6cqw, 24px)',
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
            fontSize: 'clamp(14px, 2.7cqw, 17px)',
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
