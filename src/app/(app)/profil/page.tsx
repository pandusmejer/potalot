import { getProfile } from '@/actions/profil'
import { ProfilForm } from '@/components/profil/profil-form'
import { ChangePasswordForm } from '@/components/profil/change-password-form'
import { BadgeGallery } from '@/components/profil/badge-gallery'
import { backfillAllBadges, getBadgesForUser } from '@/actions/badges'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  // Backfill: kør alle badge-checks så eksisterende handlinger retro-tildeler badges
  // (idempotent — silent skip ved duplikat). Derefter hent den opdaterede liste.
  await backfillAllBadges(profile.id)
  const earned = await getBadgesForUser(profile.id)

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvem er du, og hvordan vil du bruge PotAlot.
        </p>
      </div>

      <ProfilForm initialProfile={profile} />

      <BadgeGallery earned={earned} />

      <ChangePasswordForm />
    </div>
  )
}
