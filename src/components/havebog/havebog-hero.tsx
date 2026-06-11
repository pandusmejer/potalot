import type { HeroStats, Tidslinje, HeroNarrative } from '@/data/havebog-demo'
import { aktuelMaaned } from '@/lib/datetime'
import { pickHavebogHero } from '@/lib/havebog-hero-photo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const MAANED_FULD_UPPER = [
  'JANUAR', 'FEBRUAR', 'MARTS', 'APRIL', 'MAJ', 'JUNI',
  'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER',
] as const

interface Props {
  /** Bevaret som API-kontrakt — stats render'es ikke i hero (V3+) */
  stats?: HeroStats | null
  tidslinje?: Tidslinje
  narrative?: HeroNarrative
  /** Override foto-stien — bruges i QA-routes. */
  photoOverride?: string
}

/**
 * Havebog-hero V4 (11. juni 2026 — Annas mockup 1:1).
 *
 * Mockup'ets greb:
 *   - "HAVEBOG" i tracked caps med tynd lodret streg til venstre —
 *     som et magasin-mastehoved, ikke en app-titel
 *   - Sæsonlinjen i Cormorant italic, lowercase ("din første sæson",
 *     "dag 98 af din første sæson") — dagbogs-stemmen
 *   - Lille datostak øverst højre: 08 / JUNI / 2026 — diskret
 *     kolofon, ikke det store V3.8-dagstal
 *   - ORGANISK BØLGE som overgang til sidens creme — ikke en lige
 *     fade. Bølgen er asymmetrisk (højere sving venstre-midt).
 *   - Hero ~50vh — halv skærm, så "I DIN HAVE"-tallene anes med
 *     det samme
 *
 * Foto vælges fortsat pr. måned × bruger-state via pickHavebogHero
 * (juni har nu komplet trippel: ny/aktiv/år2+).
 */
export function HavebogHero({ narrative, photoOverride }: Props) {
  const month = aktuelMaaned() // 1-12
  const userState = narrative?.userState ?? 'active'
  const fotoPath = photoOverride ?? pickHavebogHero(month, userState)

  const today = new Date()
  const dayNum = String(today.getDate()).padStart(2, '0')
  const monthName = MAANED_FULD_UPPER[month - 1]
  const yearNum = today.getFullYear()

  // Dagbogs-stemmen er lowercase ("din første sæson") — mockup'et
  // behandler sæsonlinjen som en håndskreven undertitel, ikke en
  // overskrift.
  const seasonLine = narrative
    ? narrative.seasonLine.charAt(0).toLowerCase() + narrative.seasonLine.slice(1)
    : null

  return (
    <section
      className="relative -mx-4 -mt-6 overflow-hidden"
      style={{ height: '52vh', minHeight: 420 }}
    >
      {/* Foto — fuld flade */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url('${fotoPath}')`,
          backgroundPosition: 'center 30%',
        }}
      />

      {/* Læsbarheds-gradient — let; fotoets mørke top bærer det meste */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      {/* Datostak øverst højre — diskret kolofon (mockup: 08/JUNI/2026) */}
      <div
        className="absolute z-10 flex flex-col items-end"
        style={{ top: 18, right: 20, gap: 2 }}
      >
        <span
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 1px 6px rgba(0,0,0,0.45)',
          }}
        >
          {dayNum}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.92)',
            textShadow: '0 1px 6px rgba(0,0,0,0.45)',
            paddingLeft: '0.22em',
          }}
        >
          {monthName}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.62)',
            textShadow: '0 1px 6px rgba(0,0,0,0.45)',
          }}
        >
          {yearNum}
        </span>
      </div>

      {/* Mastehovedet — vertikalt centreret i fotoets øvre 2/3 */}
      <div
        className="relative z-10 flex h-full flex-col justify-center"
        style={{ padding: '0 24px 48px 24px' }}
      >
        <div
          style={{
            // Tynd lodret streg til venstre — magasin-mastehovedet
            borderLeft: '2px solid rgba(255,255,255,0.55)',
            paddingLeft: 18,
          }}
        >
          <h1
            style={{
              fontFamily: sans,
              fontSize: 'clamp(30px, 8vw, 40px)',
              fontWeight: 700,
              letterSpacing: '0.16em',
              lineHeight: 1,
              color: '#FFFFFF',
              textShadow: '0 2px 16px rgba(0,0,0,0.45)',
              margin: 0,
            }}
          >
            HAVEBOG
          </h1>
          {seasonLine && (
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(22px, 5.4vw, 30px)',
                lineHeight: 1.2,
                color: 'rgba(255,255,255,0.92)',
                textShadow: '0 1px 12px rgba(0,0,0,0.5)',
                margin: 0,
                marginTop: 8,
              }}
            >
              {seasonLine}
            </p>
          )}
        </div>
      </div>

      {/* ORGANISK BØLGE — overgangen til sidens baggrund. ÉT stort
          sving (mockup'et): høj kam mod venstre, langt elegant fald
          mod højre. Amplitude ~96px så bølgen reelt skærer ind i
          fotoet i stedet for at kante det.
          preserveAspectRatio="none" strækker den til fuld bredde. */}
      <svg
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 w-full"
        style={{ height: 96, display: 'block' }}
        viewBox="0 0 375 96"
        preserveAspectRatio="none"
      >
        {/* Fill følger sidens sæson-baggrund (var(--background)) —
            hardcoded creme ville stikke af fra canvas når sæsonen
            skifter tone (sommer er #F6F0DF, ikke #EAE6D8). */}
        <path
          d="M0,26 C70,0 145,8 215,40 C275,66 330,70 375,60 L375,96 L0,96 Z"
          style={{ fill: 'var(--background)' }}
        />
      </svg>
    </section>
  )
}
