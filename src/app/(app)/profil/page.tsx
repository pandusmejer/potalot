import { getProfile } from '@/actions/profil'
import { PageHero } from '@/components/ui/page-hero'
import { ProfilForm } from '@/components/profil/profil-form'
import { ChangePasswordForm } from '@/components/profil/change-password-form'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div className="space-y-6 max-w-xl">
      <PageHero
        tone="coral"
        kicker="Dig"
        title="Min profil"
        subtitle="Hvem er du, og hvordan vil du bruge PotAlot."
      />

      <ProfilForm initialProfile={profile} />

      <ChangePasswordForm />
    </div>
  )
}
