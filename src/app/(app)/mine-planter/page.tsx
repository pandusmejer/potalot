import { MinePlanterClient } from '@/components/mine-planter/mine-planter-client'
import { getAllPlants } from '@/actions/mine-planter'
import { getTaskCompletionsForDate } from '@/actions/plant-tasks'

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
export default async function MinePlanterPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [plants, doneTaskKeys] = await Promise.all([
    getAllPlants(),
    getTaskCompletionsForDate(today),
  ])
  return <MinePlanterClient plants={plants} today={today} doneTaskKeys={doneTaskKeys} />
}
