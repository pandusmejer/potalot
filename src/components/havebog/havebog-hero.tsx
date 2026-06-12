import type { HeroStats, Tidslinje, HeroNarrative } from '@/data/havebog-demo'
import { aktuelMaaned } from '@/lib/datetime'
import { pickHavebogHero } from '@/lib/havebog-hero-photo'
import { dagensHilsen } from '@/lib/havehilsen'
import { DagTaeller } from './dag-taeller'

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
  /** V9: brugerens fornavn til den personlige hilsen. Null i demo. */
  fornavn?: string | null
  /** Override foto-stien — bruges i QA-routes. */
  photoOverride?: string
}

/**
 * Havebog-hero V5 (V9: havens stue) — den daglige åbning.
 *
 * Heroen er ikke en overskrift; den er brugerens daglige velkomst
 * til haven. Tre lag (Annas hierarki):
 *
 *   1. Personlig hilsen   — "Godmorgen, Rasmus." + stemningslinje;
 *                           skifter med tid på dagen, årstid og dag
 *   2. Dagtæller          — taktil flip-tæller, klikker på plads
 *   3. Sæson-stemning     — fotoet (pickHavebogHero, måned × state)
 *
 * "HAVEBOG" er rykket ned til en lille bog-titel over hilsnen —
 * brugeren åbner dagens side i sin havebog, ikke forsiden på en
 * app. V4's masthead-greb (lodret streg, datostak, organisk bølge)
 * bevares som bogens faste inventar.
 *
 * Ingen sæsondag (intet sået) → ingen tæller; hilsnen bærer alene.
 * Fallback-seasonLine vises kun når tælleren mangler.
 */
export function HavebogHero({ narrative, fornavn, photoOverride }: Props) {
  const month = aktuelMaaned() // 1-12
  const userState = narrative?.userState ?? 'active'
  const fotoPath = photoOverride ?? pickHavebogHero(month, userState)

  const today = new Date()
  const dayNum = String(today.getDate()).padStart(2, '0')
  const monthName = MAANED_FULD_UPPER[month - 1]
  const yearNum = today.getFullYear()

  const hilsen = dagensHilsen(today, fornavn)

  const saesonDag = narrative?.saesonDag ?? null
  const saesonEtiket = narrative?.saesonEtiket ?? null

  // Fallback når tælleren mangler: sæsonlinjen som stille kursiv
  // ("din første sæson" / "velkommen tilbage til juni").
  const seasonLine = narrative && saesonDag === null
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

      {/* Den daglige åbning — vertikalt centreret i fotoets øvre 2/3.
          Hierarki (V9): hilsen → dagtæller. */}
      <div
        className="relative z-10 flex h-full flex-col justify-center"
        style={{ padding: '0 24px 48px 24px' }}
      >
        <div
          style={{
            // Tynd lodret streg til venstre — bogens faste inventar
            borderLeft: '2px solid rgba(255,255,255,0.55)',
            paddingLeft: 18,
          }}
        >
          {/* Bog-titlen — lille og rolig; hilsnen er hovedpersonen */}
          <p
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.3em',
              lineHeight: 1,
              color: 'rgba(255,255,255,0.72)',
              textShadow: '0 1px 8px rgba(0,0,0,0.45)',
              margin: 0,
              marginBottom: 12,
            }}
          >
            HAVEBOG
          </p>

          {/* Personlig hilsen — dagens velkomst, aldrig chatbot */}
          <h1
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(27px, 6.6vw, 36px)',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
              textShadow: '0 2px 16px rgba(0,0,0,0.45)',
              margin: 0,
            }}
          >
            {hilsen.hilsen}
          </h1>
          <p
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(18px, 4vw, 23px)',
              lineHeight: 1.25,
              color: 'rgba(255,255,255,0.90)',
              textShadow: '0 1px 12px rgba(0,0,0,0.5)',
              margin: 0,
              marginTop: 6,
              maxWidth: '24ch',
            }}
          >
            {hilsen.stemning}
          </p>

          {/* Dagtælleren — tiden går; klikker på plads ved åbning */}
          {saesonDag !== null && saesonEtiket && (
            <DagTaeller dag={saesonDag} etiket={saesonEtiket} />
          )}
          {seasonLine && (
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(17px, 3.6vw, 21px)',
                lineHeight: 1.2,
                color: 'rgba(255,255,255,0.82)',
                textShadow: '0 1px 12px rgba(0,0,0,0.5)',
                margin: 0,
                marginTop: 16,
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
