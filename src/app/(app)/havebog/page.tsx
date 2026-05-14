import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { backfillAllBadges, getBadgesForUser } from '@/actions/badges'
import { computeRole } from '@/lib/garden-roles'
import { GardenRoleCard } from '@/components/profil/garden-role-card'
import { BadgeGallery } from '@/components/profil/badge-gallery'

export const dynamic = 'force-dynamic'

/**
 * Min havebog — det centrale identitets- og historik-sted i PotAlot.
 *
 * Her bor:
 *   - Haverolle (Spire → Selvforsyner) som progression-identitet
 *   - Badge-galleri grupperet efter kategori
 *
 * Senere vil siden også indeholde:
 *   - Årets havefortælling (auto-genereret year-in-review)
 *   - Levende have-illustration der vokser med aktivitet
 *   - Sæson-arkiv med tilbageblik
 *
 * Profilsiden er fortsat det rent tekniske (navn, kodeord, opsætning).
 * Havebogen er det grønne, det poetiske, det samlerværdige.
 */
export default async function HavebogPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  // Backfill: retro-tildel badges baseret på eksisterende handlinger
  await backfillAllBadges(me.id)
  const earned = await getBadgesForUser(me.id)
  const roleProgress = computeRole(earned.map(e => e.badgeId))

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min havebog</h1>
        <p className="text-sm text-muted-foreground mt-1 italic">
          Dit grønne liv på PotAlot — rolle, badges og senere hele din havehistorie.
        </p>
      </div>

      <GardenRoleCard progress={roleProgress} />

      <BadgeGallery earned={earned} />
    </div>
  )
}
