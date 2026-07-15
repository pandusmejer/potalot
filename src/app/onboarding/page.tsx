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

  // Hvis allerede onboarded, send ind. season_status bruges til at genoptage
  // "godt i gang"-brugeren på import-trinnet efter en import-navigation.
  // Defensivt: hvis kolonnen ikke findes endnu (før 00058), falder vi tilbage.
  const supabase = await createClient()
  let profile: { onboarded: boolean | null; username: string | null; season_status: string | null } | null = null
  const withSeason = await supabase
    .from('profiles')
    .select('onboarded, username, season_status')
    .eq('id', user.id)
    .maybeSingle()
  if (withSeason.error) {
    const base = await supabase.from('profiles').select('onboarded, username').eq('id', user.id).maybeSingle()
    profile = base.data ? { ...base.data, season_status: null } : null
  } else {
    profile = withSeason.data
  }

  if (profile?.onboarded) redirect('/')
  const resumeImport = profile?.season_status === 'igang'

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
        resumeImport={resumeImport}
        gardenLocations={gardenLocations}
        existingNames={existingNames}
        plantCount={plants.length}
        seedCount={seeds.length}
      />
    </div>
  )
}
