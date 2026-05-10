import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Trophy, Calendar, Users } from 'lucide-react'
import { CreateChallengeDialog } from '@/components/grupper/create-challenge-dialog'
import { SubmitChallengeEntryDialog } from '@/components/grupper/submit-challenge-entry-dialog'
import type { Challenge } from '@/actions/challenges'

interface Props {
  groupId: string
  challenges: Challenge[]
  isMember: boolean
  isOwner: boolean
}

function venligTid(iso: string): string {
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return 'afsluttet'
  const days = Math.floor(diff / 86400000)
  if (days >= 1) return `${days} dage tilbage`
  const hours = Math.floor(diff / 3600000)
  return `${hours}t tilbage`
}

export function ChallengesTab({ groupId, challenges, isMember, isOwner }: Props) {
  const active = challenges.filter(c => c.isActive)
  const past = challenges.filter(c => !c.isActive)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Tidsbegrænsede udfordringer hvor medlemmer indsender et bidrag.
        </p>
        {isOwner && <CreateChallengeDialog groupId={groupId} />}
      </div>

      {challenges.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="Ingen challenges endnu"
          description={isOwner
            ? 'Opret en challenge for at samle gruppen om en udfordring — fx månedens høst-foto.'
            : 'Når ejeren opretter en challenge, kan du deltage her.'}
        />
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Aktive ({active.length})</p>
              {active.map(c => <ChallengeCard key={c.id} challenge={c} isMember={isMember} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Afsluttede ({past.length})</p>
              {past.map(c => <ChallengeCard key={c.id} challenge={c} isMember={isMember} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ChallengeCard({ challenge, isMember }: { challenge: Challenge; isMember: boolean }) {
  return (
    <Card className="overflow-hidden">
      {challenge.coverImageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={challenge.coverImageUrl} alt="" className="w-full h-32 object-cover" />
      )}
      <CardContent className="space-y-2 py-3">
        <div className="flex items-start gap-2 flex-wrap">
          <Trophy className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{challenge.title}</p>
            {challenge.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
            )}
            {challenge.prompt && (
              <p className="text-xs text-foreground/80 mt-1 italic">&ldquo;{challenge.prompt}&rdquo;</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={challenge.isActive ? 'success' : 'muted'} className="text-[10px]">
            {challenge.isActive ? 'Aktiv' : 'Afsluttet'}
          </Badge>
          {challenge.endsAt && (
            <Badge variant="outline" className="text-[10px] gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {challenge.isActive ? timeUntil(challenge.endsAt) : `Sluttet ${venligTid(challenge.endsAt)}`}
            </Badge>
          )}
          <Badge variant="muted" className="text-[10px] gap-0.5">
            <Users className="h-2.5 w-2.5" />
            {challenge.entryCount} bidrag
          </Badge>
          {challenge.myEntry && <Badge variant="info" className="text-[10px]">Du deltager</Badge>}
        </div>

        {challenge.myEntry && (
          <div className="rounded-lg border border-border bg-muted/20 p-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dit bidrag</p>
            {challenge.myEntry.imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={challenge.myEntry.imageUrl} alt="" className="rounded-md max-h-32 object-cover" />
            )}
            {challenge.myEntry.caption && (
              <p className="text-xs text-foreground">{challenge.myEntry.caption}</p>
            )}
          </div>
        )}

        {isMember && challenge.isActive && (
          <SubmitChallengeEntryDialog
            challengeId={challenge.id}
            prompt={challenge.prompt}
            existingEntry={challenge.myEntry}
          />
        )}
      </CardContent>
    </Card>
  )
}
