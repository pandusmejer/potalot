import { Suspense } from 'react'
import { MinePlanterClient } from '@/components/mine-planter/mine-planter-client'
import { PlanterKompakt } from '@/components/mine-planter/planter-kompakt'
import { getAllTasks } from '@/actions/havekalender'
import { mockPlants } from '@/data/mock-plants'
import { MVP_PLANTER } from '@/lib/mvp-config'
import { getAllPlants } from '@/actions/mine-planter'
import { getTaskCompletionsForDate } from '@/actions/plant-tasks'
import { getGardenLocations } from '@/actions/garden-locations'
import { getCurrentUser } from '@/lib/auth'
import { PageIntroNote } from '@/components/ui/page-intro-note'
import { Sprout } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * 🌱 PLANTER — aktiv dyrkning, handling.
 *
 * Henter brugerens ægte planter server-side og sender dem til
 * MinePlanterClient. Tomt array → demo-mode (mock-plants overtager
 * UI'et), så designvisionen er synlig for anonyme/nye brugere.
 *
 * Rolle-fordeling:
 *   Frøbank  = ejerskab
 *   Planter  = handling             ← her
 *   Kalender = timing
 *   Havebog  = hukommelse
 *   Guides   = viden
 */
/**
 * Streaming-skal (koldstart-fix 5/8): siden flusher første byte med det
 * samme, så browseren henter CSS/JS/fonte/billeder PARALLELT med serverens
 * datahentning — i stedet for en hvid fane, til alt er færdigt. Indholdet
 * (uændret markup) streames ind, når dataene lander.
 */
export default function MinePlanterPage() {
  return (
    <Suspense fallback={null}>
      <MinePlanterIndhold />
    </Suspense>
  )
}

async function MinePlanterIndhold() {
  const today = new Date().toISOString().slice(0, 10)
  const [plants, doneTaskKeys, gardenLocations, user, tasks] = await Promise.all([
    getAllPlants(),
    getTaskCompletionsForDate(today),
    getGardenLocations(),
    getCurrentUser(),
    // Opgaver hentes kun til MVP'ens "næste opgave" — den oprindelige side
    // bruger dem ikke, så den betaler ikke for forespørgslen.
    MVP_PLANTER.kompaktListe ? getAllTasks() : Promise.resolve([]),
  ])

  // MVP 1.0: kompakt dyrkningsliste (mvp-config.ts). Samme data som den
  // oprindelige side; kun visningen er en anden. Demo (anonym uden planter)
  // ser mock-planterne, præcis som på den oprindelige side.
  if (MVP_PLANTER.kompaktListe) {
    const erDemo = !user && plants.length === 0
    return (
      <PlanterKompakt
        plants={erDemo ? mockPlants : plants}
        tasks={tasks}
        gardenLocations={gardenLocations}
        today={today}
        isLoggedIn={!!user}
      />
    )
  }

  return (
    <>
      <div className="mb-5">
        <PageIntroNote
          id="planter"
          icon={<Sprout className="h-4 w-4" />}
          title="Tilføj det, du dyrker nu"
          body="Så kan Potalot følge med i spiring, udplantning, høst og alt det, haven finder på undervejs."
          hideWhen={plants.length >= 3}
        />
      </div>
      <MinePlanterClient
        plants={plants}
        today={today}
        doneTaskKeys={doneTaskKeys}
        gardenLocations={gardenLocations}
        isLoggedIn={!!user}
      />
    </>
  )
}
