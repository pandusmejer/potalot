import { getProfile } from '@/actions/profil'
import { ProfilForm } from '@/components/profil/profil-form'
import { MOCK_PROFILE } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const profile = (await getProfile()) ?? MOCK_PROFILE

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvem er du, og hvordan vil du bruge PotAlot.
        </p>
      </div>

      <ProfilForm initialProfile={profile} />
    </div>
  )
}
