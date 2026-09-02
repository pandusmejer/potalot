import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Lightbulb, Gift, Sprout, Image as ImageIcon, Trophy, UserPlus } from 'lucide-react'
import type { WeeklyDigest } from '@/actions/group-timeline'

interface Props {
  digest: WeeklyDigest
  groupName: string
  isInterest: boolean
}

export function WeeklyDigestCard({ digest, groupName, isInterest }: Props) {
  const items: { icon: React.ElementType; value: number; label: string }[] = []
  if (digest.posts > 0) items.push({ icon: MessageSquare, value: digest.posts, label: digest.posts === 1 ? 'nyt opslag' : 'nye opslag' })
  if (digest.replies > 0) items.push({ icon: MessageSquare, value: digest.replies, label: digest.replies === 1 ? 'nyt svar' : 'nye svar' })
  if (digest.ideas > 0) items.push({ icon: Lightbulb, value: digest.ideas, label: digest.ideas === 1 ? 'delt idé' : 'delte idéer' })
  if (digest.swapsCreated > 0) items.push({ icon: Gift, value: digest.swapsCreated, label: digest.swapsCreated === 1 ? 'frøbytte' : 'frøbytter' })
  if (isInterest && digest.newVarieties > 0) items.push({ icon: Sprout, value: digest.newVarieties, label: digest.newVarieties === 1 ? 'ny sort' : 'nye sorter' })
  if (digest.imagesShared > 0) items.push({ icon: ImageIcon, value: digest.imagesShared, label: digest.imagesShared === 1 ? 'billede' : 'billeder' })
  if (digest.challengeEntries > 0) items.push({ icon: Trophy, value: digest.challengeEntries, label: digest.challengeEntries === 1 ? 'bidrag til udfordring' : 'bidrag til udfordringer' })
  if (digest.newMembers > 0) items.push({ icon: UserPlus, value: digest.newMembers, label: digest.newMembers === 1 ? 'nyt medlem' : 'nye medlemmer' })

  const totalActivity = items.reduce((s, i) => s + i.value, 0)

  return (
    <Card className="bg-gradient-to-br from-secondary/30 to-card border-secondary">
      <CardContent className="py-4 space-y-2.5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Denne uge i {groupName}
        </p>
        {totalActivity === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Stille uge — endnu intet nyt fra gruppen.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
            {items.map((it, idx) => {
              const Icon = it.icon
              return (
                <li key={idx} className="flex items-center gap-1.5 text-sm">
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{it.value}</span>
                  <span className="text-muted-foreground text-xs">{it.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
