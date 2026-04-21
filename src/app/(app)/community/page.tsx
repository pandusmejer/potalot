export const dynamic = 'force-dynamic'

import { getMyCommunityProfile, getPendingInvitations, getActiveMemberships } from '@/actions/community'
import { ProfileSetup } from '@/components/community/profile-setup'
import { Invitations } from '@/components/community/invitations'
import { ActiveMemberships } from '@/components/community/active-memberships'

export default async function CommunityPage() {
  const profile = await getMyCommunityProfile()

  // Uden profil: vis setup-flow
  if (!profile || !profile.is_active) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sort-grupper med andre der dyrker det samme som dig.
          </p>
        </div>
        <ProfileSetup />
      </div>
    )
  }

  const [invitations, memberships] = await Promise.all([
    getPendingInvitations(),
    getActiveMemberships(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Velkommen tilbage, {profile.display_name}.
          {profile.location_general && ` Fra ${profile.location_general}.`}
        </p>
      </div>

      <Invitations invitations={invitations} />
      <ActiveMemberships memberships={memberships} />
    </div>
  )
}
