import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Lock, Globe } from 'lucide-react'
import { lookupInvitation } from '@/actions/group-invitations'
import { RequestAccessForm } from '@/components/grupper/request-access-form'
import { VISIBILITY_LABEL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params
  const info = await lookupInvitation(token)

  if (!info) {
    return (
      <div className="space-y-5 max-w-md">
        <h1 className="text-2xl font-serif text-foreground">Ugyldigt invitations-link</h1>
        <p className="text-sm text-muted-foreground">
          Linket er enten udløbet, slettet eller forkert. Bed personen der inviterede dig om at sende et nyt link.
        </p>
        <Button asChild variant="outline">
          <Link href="/grupper"><ArrowLeft className="h-4 w-4" /> Til Mine grupper</Link>
        </Button>
      </div>
    )
  }

  // Allerede medlem? Send direkte til gruppen
  if (info.isMember) redirect(`/grupper/${info.groupId}`)

  if (!info.groupId) notFound()

  return (
    <div className="space-y-5 max-w-md">
      <Button asChild variant="ghost" size="sm">
        <Link href="/grupper"><ArrowLeft className="h-4 w-4" /> Til Mine grupper</Link>
      </Button>

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-secondary/40 flex items-center justify-center shrink-0">
              {info.groupType === 'private' ? <Lock className="h-5 w-5 text-primary" /> : <Globe className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-serif text-foreground">{info.groupName}</h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <Badge variant="muted" className="text-[10px]">
                  {info.groupType === 'private' ? 'Privat gruppe' : 'Interessegruppe'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{VISIBILITY_LABEL[info.visibility]}</Badge>
                <Badge variant="muted" className="text-[10px] gap-1">
                  <Users className="h-2.5 w-2.5" />
                  {info.memberCount}
                </Badge>
              </div>
            </div>
          </div>

          {info.groupDescription && (
            <p className="text-sm text-muted-foreground">{info.groupDescription}</p>
          )}

          {info.hasPendingRequest ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">Anmodning sendt</p>
              <p className="text-xs text-muted-foreground">
                Du får adgang når en ejer godkender din anmodning. Du kan trygt lukke siden.
              </p>
            </div>
          ) : (
            <RequestAccessForm token={token} />
          )}
        </CardContent>
      </Card>

    </div>
  )
}
