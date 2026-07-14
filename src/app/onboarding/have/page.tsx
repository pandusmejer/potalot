import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getGardenLocations } from '@/actions/garden-locations'

export const dynamic = 'force-dynamic'

/**
 * F2 — genåbnelig "Få din have ind".
 *
 * Samme import-/tilføj-univers som onboarding, men for ALLEREDE onboardede
 * brugere: nået fra Profil + tom-tilstande i Planter/Frøbank. Ligger uden for
 * (app)-gruppen (ingen onboarding-vagt) men er auth-gated via middleware.
 * `isRevisit` sikrer: onboarded sættes IKKE igen, ingen bounce, bund-copy =
 * "tilbage til min have". Viser sande server-tal for frø/planter.
 */
export default async function HaveImportPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [plants, seeds, gardenLocations] = await Promise.all([
    getAllPlants(),
    getAllInventoryItems(),
    getGardenLocations(),
  ])
  const existingNames = [
    ...plants.map(p => p.name),
    ...seeds.map(s => s.name),
  ].filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background py-8">
      <OnboardingShell
        gardenLocations={gardenLocations}
        existingNames={existingNames}
        plantCount={plants.length}
        seedCount={seeds.length}
        isRevisit
      />
    </div>
  )
}
