import { getProfile } from '@/actions/profil'
import { ProfilForm } from '@/components/profil/profil-form'
import { ChangePasswordForm } from '@/components/profil/change-password-form'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvem er du, og hvordan vil du bruge PotAlot.
        </p>
      </div>

      <ProfilForm initialProfile={profile} />
      <ChangePasswordForm />
    </div>
  )
}
