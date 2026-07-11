import { HavebogHero } from '@/components/havebog/havebog-hero'
import { HavensStemme } from '@/components/havebog/havens-stemme'
import { TalTilDinHave } from '@/components/havebog/tal-til-din-have'
import { InspirerMig } from '@/components/havebog/inspirer-mig'
import { Dyrkerstatus } from '@/components/havebog/dyrkerstatus'
import { Dyrkerkompetencer } from '@/components/havebog/dyrkerkompetencer'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { Vendepunkter } from '@/components/havebog/vendepunkter'
import { Minder } from '@/components/havebog/minder'
import { Spisekammer } from '@/components/havebog/spisekammer'
import { PopulaertLigeNu } from '@/components/havebog/populaert-lige-nu'
import { VejretIHaven } from '@/components/havebog/vejret-i-haven'
import { Projekter } from '@/components/havebog/projekter'
import { Bedrifter } from '@/components/havebog/bedrifter'
import { HistorienFortsaetter } from '@/components/havebog/historien-fortsaetter'
import {
  DEMO_HERO_STATS,
  DEMO_TIDSLINJE,
  DEMO_HERO_NARRATIVE,
  DEMO_DAGENS_OPSLAG,
  DEMO_VENDEPUNKTER,
  DEMO_MINDER,
  DEMO_ON_THIS_DAY,
  DEMO_ARCHIVED_PLANTS,
  DEMO_TAL_EKSEMPLER,
  DEMO_OPTAGELSER,
  DEMO_INSPIRER,
  DEMO_DYRKERSTATUS,
  DEMO_KOMPETENCER,
  DEMO_SPISEKAMMER,
  DEMO_POPULAERT,
  DEMO_VEJR,
  DEMO_PROJEKT,
  DEMO_BEDRIFTER,
} from '@/data/havebog-demo'

export const dynamic = 'force-dynamic'

/**
 * QA / design-lab: Havebog — HELE HUSET.
 *
 * Den offentlige forside (/) kører kuratoren og viser kun den faste
 * top + få kuraterede rum — den rigtige bruger-oplevelse. Dette er
 * VÆRKSTEDET: alle 15 rum i rækkefølge med demo-data, så vi kan stå i
 * huset og evaluere hvert rum isoleret. Bevidst ikke i navigation.
 *
 * (Afløser den tidligere "demo = hele huset"-gren i page.tsx — brugeren
 * skal ikke vandre rundt i værkstedet og tro det er stuen.)
 */
export default function HavebogDesignLabPage() {

  function Sep({ label }: { label: string }) {
    return (
      <div
        style={{
          padding: '8px 14px',
          background: 'rgba(36,48,31,0.04)',
          borderLeft: '3px solid rgba(36,48,31,0.25)',
          marginBottom: 8,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.75)',
            margin: 0,
          }}
        >
          {label}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      <header className="space-y-2 border-b border-foreground/10 pb-6">
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
          }}
        >
          QA · Havebog · design-lab
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 500,
            fontSize: 'clamp(28px, 5vw, 40px)',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: '#24301F',
            margin: 0,
          }}
        >
          Hele huset — alle rum
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 14,
            color: 'rgba(36,48,31,0.62)',
            margin: 0,
            maxWidth: 520,
          }}
        >
          Alle 15 rum i rækkefølge med demo-data, til intern evaluering.
          Den offentlige forside (/) kurerer og viser kun et udsnit. Ikke
          i navigation.
        </p>
      </header>

      <Sep label="1-3 · Forside: hero (m. dagtæller ovenpå) · ildsted" />
      <HavebogHero stats={DEMO_HERO_STATS} tidslinje={DEMO_TIDSLINJE} narrative={DEMO_HERO_NARRATIVE} />
      <HavensStemme opslag={DEMO_DAGENS_OPSLAG} />

      <Sep label="4 · Tal til din have" />
      <TalTilDinHave eksempler={DEMO_TAL_EKSEMPLER} optagelser={DEMO_OPTAGELSER} />
      <Sep label="5 · Inspirér mig" />
      <InspirerMig forslag={DEMO_INSPIRER} />
      <Sep label="6 · Dyrkerstatus" />
      <Dyrkerstatus status={DEMO_DYRKERSTATUS} />
      <Sep label="7 · Kompetencer" />
      <Dyrkerkompetencer omraader={DEMO_KOMPETENCER} />
      <Sep label="8 · På denne dag" />
      <PaaDenneDag entries={DEMO_ON_THIS_DAY} />
      <Sep label="9 · Minder" />
      <Minder minder={DEMO_MINDER} />
      <Sep label="10 · Vendepunkter" />
      <Vendepunkter vendepunkter={DEMO_VENDEPUNKTER} />
      <Sep label="11 · Spisekammer" />
      <Spisekammer data={DEMO_SPISEKAMMER} />
      <Sep label="12 · Populært lige nu (prototype)" />
      <PopulaertLigeNu emner={DEMO_POPULAERT} />
      <Sep label="13 · Vejret i haven (prototype)" />
      <VejretIHaven vejr={DEMO_VEJR} />
      <Sep label="14 · Projekter" />
      <Projekter projekt={DEMO_PROJEKT} />
      <Sep label="15 · Bedrifter" />
      <Bedrifter bedrifter={DEMO_BEDRIFTER} />
      <Sep label="16 · Historien fortsætter" />
      <HistorienFortsaetter plants={DEMO_ARCHIVED_PLANTS} />
    </div>
  )
}
