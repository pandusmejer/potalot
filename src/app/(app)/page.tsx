import type { ReactNode } from 'react'
import { getHavebogData } from '@/actions/havebog'
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { HavensStemme } from '@/components/havebog/havens-stemme'
import { HavebogDateline } from '@/components/havebog/havebog-dateline'
import { HavebogDivider } from '@/components/havebog/havebog-divider'
import { TalTilDinHave } from '@/components/havebog/tal-til-din-have'
import { TalOptager } from '@/components/havebog/tal-optager'
import { InspirerMig } from '@/components/havebog/inspirer-mig'
import { MaaskeDuOgsaa } from '@/components/havebog/maaske-du-ogsaa'
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
import { kurater, type RumId } from '@/lib/havebog-kurator'
import { kompetenceAntal } from '@/lib/havebog-kompetencer'
import { aktuelMaaned } from '@/lib/datetime'
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
 * 📖 HAVEBOG — den offentlige forside.
 *
 * Havebog er en redaktionel havejournal, ikke et dashboard eller en
 * opgaveliste. Både demo og indlogget bruger kører nu SAMME kurator
 * (V17 + Annas trim, 7. juli): fast top + få kuraterede rum. Demoen
 * skal vise den RIGTIGE oplevelse en ny bruger møder — ikke hele huset.
 *
 * Det faste lag (altid, i denne rækkefølge):
 *   1. Hero  2. Dagtæller  3. Dagens historie (ildsted)  4. Tal til din have
 * Derefter højst 3 kuraterede rum (kurater maks:3, så i alt maks 7).
 *
 * Hele-huset-visningen (alle 15 rum til design-review) er flyttet til
 * den interne rute /admin/qa/havebog — værkstedet, ikke stuen.
 *
 * Prototype-rum uden ægte kilde (Inspirér, Status, Kompetencer,
 * Spisekammer, Projekter, Bedrifter, Vejret, Populært) kører på demo-
 * data og er derfor gated false for indloggede — de tændes ét ad
 * gangen når deres deriver/kilde lander (ærligheds-reglen).
 */
export default async function HavebogPage() {
  const data = await getHavebogData()
  const isDemo = data === null

  const heroStats = isDemo ? DEMO_HERO_STATS : data.heroStats
  const tidslinje = isDemo ? DEMO_TIDSLINJE : data.tidslinje
  const heroNarrative = isDemo ? DEMO_HERO_NARRATIVE : data.heroNarrative
  const dagensOpslag = isDemo ? DEMO_DAGENS_OPSLAG : data.dagensOpslag
  const onThisDay = isDemo ? DEMO_ON_THIS_DAY : data.onThisDay
  const vendepunkter = isDemo ? DEMO_VENDEPUNKTER : data.vendepunkter
  const minder = isDemo ? DEMO_MINDER : data.minder
  const archivedPlants = isDemo ? DEMO_ARCHIVED_PLANTS : data.archivedPlants

  // Det faste lag — forsiden + ildstedet + Tal til din have.
  const forside = (
    <>
      <HavebogHero
        stats={heroStats}
        tidslinje={tidslinje}
        narrative={heroNarrative}
        fornavn={isDemo ? null : data.fornavn}
      />
      {/* Dateline ("adressen") trukket op under hero-bølgen, så den står
          ~12 mm under bølgens højeste punkt. Den negative margin overskriver
          space-y-fugen og løfter resten af siden med op. */}
      <div
        style={{
          marginTop: -141,
          position: 'relative',
          zIndex: 20,
          // Venstrestillet, samme venstre-akse som Dagens historie
          // (main px-4 = 16 + samme paddingInline som Ildstedet).
          paddingLeft: 'clamp(12px, 3.5cqw, 16px)',
        }}
      >
        <HavebogDateline />
      </div>
      {/* Ildstedet: ~100 px luft mellem dato og "Dagens historie", så
          hovedopslaget føles som en ny magasin-side (overskriver space-y). */}
      <div style={{ marginTop: -12 }}>
        <HavensStemme opslag={dagensOpslag} />
      </div>
      {/* Ornament — lukker Dagens historie-opslaget før Tal til din have.
          marginTop:0 dræber space-y-fugen, så divider-bundmarginen (64) ejer
          afstanden divider→diktafon. */}
      <HavebogDivider />
      {/* Tal til din have = fast 4. rum. Demo: eksempler + afspilning.
          Indlogget: den ægte råstof-motor (tal/skriv → Claude → gem),
          det eneste rum der SKABER indhold til alle de andre. */}
      <div style={{ marginTop: 0 }}>
        {isDemo ? (
          <TalTilDinHave eksempler={DEMO_TAL_EKSEMPLER} optagelser={DEMO_OPTAGELSER} />
        ) : (
          <TalOptager />
        )}
      </div>
    </>
  )

  // ── Kuratoren (V17) — samme logik i demo og indlogget ──
  // Tal er nu et fast 4. rum, så vi capper de kuraterede til 3 (maks 7
  // i alt). Kun rum med ÆGTE data kommer i betragtning. I demo har alle
  // rum demo-data (undtagen talTilDinHave, der rendres fast ovenfor);
  // for indloggede er kun de fire deriver-rum tændt endnu.
  const harData: Partial<Record<RumId, boolean>> = isDemo
    ? {
        inspirerMig: true,
        maaskeDuOgsaa: true,
        dyrkerstatus: true,
        dyrkerkompetencer: true,
        paaDenneDag: onThisDay.length > 0,
        minder: minder.length > 0,
        vendepunkter: vendepunkter.length > 0,
        spisekammer: true,
        projekter: true,
        bedrifter: true,
        vejret: true,
        populaert: true,
        historienFortsaetter: archivedPlants.length > 0,
      }
    : {
        inspirerMig: data.inspirerForslag !== null,
        maaskeDuOgsaa: (data.inspirerForslag?.sekundaer ?? null) !== null,
        spisekammer: data.spisekammer !== null,
        // Produktregel: "På denne dag" skal have en kilde/destination —
        // skjul modulet hvis det viste minde ikke kan åbnes (ingen href).
        paaDenneDag: (onThisDay[0]?.href ?? null) !== null,
        minder: minder.length > 0,
        vendepunkter: vendepunkter.length > 0,
        historienFortsaetter: archivedPlants.length > 0,
        // V13: afledte rum — gated på ægte data (ærligheds-reglen).
        dyrkerstatus: data.dyrkerstatus.length > 0,
        dyrkerkompetencer: kompetenceAntal(data.dyrkerkompetencer) >= 2,
        // Første gange (V1): vis ved mindst én beviselig milepæl.
        bedrifter: data.bedrifter.length > 0,
      }
  const valgteRum = kurater({ maaned: aktuelMaaned(), harData, maks: 3 })

  const RUM_RENDER: Partial<Record<RumId, ReactNode>> = {
    inspirerMig: <InspirerMig forslag={isDemo ? DEMO_INSPIRER : data?.inspirerForslag ?? DEMO_INSPIRER} />,
    maaskeDuOgsaa: <MaaskeDuOgsaa forslag={(isDemo ? DEMO_INSPIRER : data?.inspirerForslag ?? DEMO_INSPIRER).sekundaer ?? DEMO_INSPIRER.sekundaer!} billede="/images/havebog/maaske-du-ogsaa-froeavl.jpg" />,
    dyrkerstatus: <Dyrkerstatus status={isDemo ? DEMO_DYRKERSTATUS : (data?.dyrkerstatus[0] ?? DEMO_DYRKERSTATUS)} />,
    dyrkerkompetencer: <Dyrkerkompetencer omraader={isDemo ? DEMO_KOMPETENCER : (data?.dyrkerkompetencer ?? DEMO_KOMPETENCER)} />,
    paaDenneDag: <PaaDenneDag entries={onThisDay} />,
    minder: <Minder minder={minder} />,
    vendepunkter: <Vendepunkter vendepunkter={vendepunkter} />,
    spisekammer: <Spisekammer data={isDemo ? DEMO_SPISEKAMMER : data?.spisekammer ?? DEMO_SPISEKAMMER} />,
    projekter: <Projekter projekt={DEMO_PROJEKT} />,
    bedrifter: <Bedrifter bedrifter={isDemo ? DEMO_BEDRIFTER : data?.bedrifter ?? DEMO_BEDRIFTER} />,
    vejret: <VejretIHaven vejr={DEMO_VEJR} />,
    populaert: <PopulaertLigeNu emner={DEMO_POPULAERT} />,
    historienFortsaetter: <HistorienFortsaetter plants={archivedPlants} />,
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {forside}
      {valgteRum.map(id => <div key={id}>{RUM_RENDER[id]}</div>)}
    </div>
  )
}
