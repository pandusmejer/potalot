import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getGardenLocations } from '@/actions/garden-locations'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Hvis allerede onboarded, send ind
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, username')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarded) redirect('/')

  // Data til have-fasen (fortsæt-senere viser haven indtil videre).
  const [plants, seeds, gardenLocations] = await Promise.all([
    getAllPlants(),
    getAllInventoryItems(),
    getGardenLocations(),
  ])

  const existingNames = [
    ...plants.map(p => p.name),
    ...seeds.map(s => s.name),
  ].filter(Boolean)

  // Har brugeren allerede et brugernavn? → genoptag på have-fasen.
  const startPhase = profile?.username ? 'have' : 'profil'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background py-8">
      <OnboardingWizard
        email={user.email ?? ''}
        startPhase={startPhase}
        gardenLocations={gardenLocations}
        existingNames={existingNames}
        plantCount={plants.length}
        seedCount={seeds.length}
      />
    </div>
  )
}
