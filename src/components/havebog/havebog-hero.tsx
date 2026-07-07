import type { HeroStats, Tidslinje, HeroNarrative } from '@/data/havebog-demo'
import { aktuelMaaned } from '@/lib/datetime'
import { pickHavebogHero } from '@/lib/havebog-hero-photo'
import { DagTaeller } from '@/components/havebog/dag-taeller'

const sans = 'var(--font-manrope)'

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
export function HavebogHero({ narrative, photoOverride }: Props) {
  const month = aktuelMaaned() // 1-12
  const userState = narrative?.userState ?? 'active'
  const fotoPath = photoOverride ?? pickHavebogHero(month, userState)

  const today = new Date()
  const dayNum = String(today.getDate()).padStart(2, '0')
  const monthName = MAANED_FULD_UPPER[month - 1]
  const yearNum = today.getFullYear()

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

      {/* Læsbarheds-gradient — V13: lysere, mindre dramatik (manifest:
          "mindre mørke flader"). Kun en blød bund-anker så den store
          hilsen kan læses; toppen er næsten ren. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.04) 40%, rgba(0,0,0,0.14) 100%)',
        }}
      />

      {/* Datostak øverst højre — diskret kolofon (mockup: 08/JUNI/2026).
          Hver linje har tracking; den efterfølgende bogstavafstand skubber
          ellers den højre kant ujævnt ud (så datoen så klemt/skæv ud). Vi
          neutraliserer trailing-tracking med negativ margin-right = tracking,
          så alle tre linjer flugter rent på samme højre kant. */}
      <div
        className="absolute z-10 flex flex-col items-end"
        style={{ top: 18, right: 24, gap: 2 }}
      >
        <span
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            marginRight: '-0.08em',
            color: 'rgba(255,255,255,0.92)',
            textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 2px 16px rgba(0,0,0,0.45)',
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
            marginRight: '-0.22em',
            color: 'rgba(255,255,255,0.96)',
            textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 2px 16px rgba(0,0,0,0.45)',
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
            marginRight: '-0.14em',
            color: 'rgba(255,255,255,0.72)',
            textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 2px 16px rgba(0,0,0,0.45)',
          }}
        >
          {yearNum}
        </span>
      </div>

      {/* Ingen tekst-blok mere (nameplate/hilsen/stemning fjernet). Hero
          er nu rent foto + dagtælleren lagt ovenpå som eneste indhold.
          Centreret, så bølgen i bunden ikke skærer i tallet. */}
      {narrative?.saesonDag != null && narrative?.saesonEtiket && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center" style={{ paddingBottom: 40 }}>
          <DagTaeller dag={narrative.saesonDag} etiket={narrative.saesonEtiket} onImage />
        </div>
      )}

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
