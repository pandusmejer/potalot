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
 * Arkivet som stille, brede rækker. Året står som lille kolonne til
 * venstre, planten i serif, resuméet dæmpet til højre — som et
 * register bagerst i en bog.
 */
function Arkiv({ plants }: { plants: ArchivedPlant[] }) {
  return (
    <div className="space-y-6">
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
        Det der er afsluttet, er ikke væk — det er blevet erfaring.
      </p>

      <div>
        {plants.map(p => (
          <div
            key={p.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr',
              gap: 14,
              alignItems: 'baseline',
              borderTop: '1px solid rgba(36,48,31,0.10)',
              paddingBlock: 14,
            }}
          >
            <p
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'rgba(36,48,31,0.45)',
                margin: 0,
              }}
            >
              {p.archivedYear}
            </p>
            <div>
              <p
                style={{
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: 'clamp(18px, 3.6vw, 22px)',
                  lineHeight: 1.2,
                  color: '#24301F',
                  margin: 0,
                }}
              >
                {p.name}
                {p.variety && (
                  <span
                    style={{
                      fontStyle: 'italic',
                      fontWeight: 400,
                      color: 'rgba(36,48,31,0.60)',
                    }}
                  >
                    {' '}
                    {p.variety}
                  </span>
                )}
              </p>
              {p.summary && (
                <p
                  style={{
                    fontFamily: sans,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'rgba(36,48,31,0.50)',
                    margin: 0,
                    marginTop: 3,
                  }}
                >
                  {p.summary}
                </p>
              )}
            </div>
          </div>
        ))}
        {/* Afsluttende hårstreg så registret står som en lukket blok */}
        <div aria-hidden style={{ borderTop: '1px solid rgba(36,48,31,0.10)' }} />
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
