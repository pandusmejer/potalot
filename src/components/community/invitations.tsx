'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { accepterInvitation, afvisInvitation } from '@/actions/community'
import { Users } from 'lucide-react'
import type { CommunityMembership, CommunityGroup } from '@/lib/types'

interface Props {
  invitations: Array<CommunityMembership & { group: CommunityGroup }>
}

export function Invitations({ invitations }: Props) {
  if (invitations.length === 0) return null

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Invitationer
        </CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {invitations.map(inv => <InvitationRow key={inv.id} invitation={inv} />)}
      </div>
    </Card>
  )
}

function InvitationRow({ invitation }: { invitation: CommunityMembership & { group: CommunityGroup } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [handled, setHandled] = useState<'joined' | 'declined' | null>(null)

  function handleAccept() {
    startTransition(async () => {
      await accepterInvitation(invitation.group.id)
      setHandled('joined')
      setTimeout(() => router.refresh(), 800)
    })
  }

  function handleDecline() {
    startTransition(async () => {
      await afvisInvitation(invitation.group.id)
      setHandled('declined')
      setTimeout(() => router.refresh(), 800)
    })
  }

  if (handled === 'joined') {
    return (
      <div className="py-2 text-sm text-primary">
        Velkommen i {invitation.group.title}.
      </div>
    )
  }

  if (handled === 'declined') {
    return (
      <div className="py-2 text-sm text-muted-foreground">
        Ingen problem — invitationen er fjernet.
      </div>
    )
  }

  const gruppeNavn = invitation.group.variety_name
    ? `${invitation.group.variety_name} (${invitation.group.species_name})`
    : invitation.group.species_name

  return (
    <div className="py-2 space-y-2">
      <p className="text-sm text-foreground">
        Vil du se hvad andre <strong>{gruppeNavn}</strong>-dyrkere laver?
      </p>
      <p className="text-xs text-muted-foreground">
        {invitation.group.member_count === 0 ? (
          'Du er den første der har oprettet denne sort. Gruppen åbner når flere kommer til.'
        ) : invitation.group.threshold_reached ? (
          `${invitation.group.member_count} ${invitation.group.member_count === 1 ? 'person' : 'personer'} er med.`
        ) : (
          `${invitation.group.member_count} afventer — gruppen åbner når flere kommer til.`
        )}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAccept} disabled={isPending}>Ja tak</Button>
        <Button size="sm" variant="ghost" onClick={handleDecline} disabled={isPending}>
          Nej tak
        </Button>
      </div>
    </div>
  )
}
