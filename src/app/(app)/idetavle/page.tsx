import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHero } from '@/components/ui/page-hero'
import { AddIdeaDialog } from '@/components/idetavle/add-idea-dialog'
import { ShareIdeaDialog } from '@/components/idetavle/share-idea-dialog'
import { getAllIdeas } from '@/actions/idetavle'
import { getIdeasSharedWithMe, getShareCountsByIdea } from '@/actions/idea-shares'
import { Lightbulb, Calendar, Users } from 'lucide-react'
import type { Idea } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  idea: 'Idé',
  planning: 'Planlagt',
  in_progress: 'I gang',
  done: 'Udført',
  abandoned: 'Droppet',
}

interface IdeaCardProps {
  idea: Idea
  shareCount?: number
  ownerLabel?: string
  viaGroupName?: string | null
}

function IdeaCard({ idea, shareCount, ownerLabel, viaGroupName }: IdeaCardProps) {
  const cover = idea.imageIds[0]
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[3/2] bg-pattern-botanical bg-secondary/20 flex items-center justify-center overflow-hidden">
        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img loading="lazy" decoding="async" src={cover} alt={idea.title} className="w-full h-full object-cover" />
        ) : (
          <Lightbulb className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>
      <CardContent className="space-y-2 pt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground flex-1 min-w-0">{idea.title}</p>
          <Badge
            variant={
              idea.status === 'planning' ? 'info' :
              idea.status === 'in_progress' ? 'success' : 'muted'
            }
            className="text-[10px]"
          >
            {STATUS_LABEL[idea.status]}
          </Badge>
        </div>
        {idea.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {idea.targetYear && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Målår {idea.targetYear}
            </span>
          )}
          {idea.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {idea.tags.map(t => (
                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          )}
        </div>
        {ownerLabel && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 pt-1">
            <Users className="h-3 w-3" />
            Delt af {ownerLabel}
            {viaGroupName && <span> · via {viaGroupName}</span>}
          </p>
        )}
        {shareCount !== undefined && (
          <div className="pt-1 -ml-2">
            <ShareIdeaDialog ideaId={idea.id} ideaTitle={idea.title} initialCount={shareCount} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function IdetavlePage() {
  const [ideas, sharedWithMe, shareCounts] = await Promise.all([
    getAllIdeas(),
    getIdeasSharedWithMe(),
    getShareCountsByIdea(),
  ])

  const sharedCount = sharedWithMe.length

  return (
    <div className="space-y-6">
      <PageHero
        tone="strong"
        kicker="Fri tænkning"
        title="Idétavle"
        subtitle="Langsigtede projekter og inspiration. Ingen daglige tasks."
        actions={<AddIdeaDialog />}
      />

      <Tabs defaultValue="mine" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mine">Mine ({ideas.length})</TabsTrigger>
          <TabsTrigger value="shared">Delt med mig ({sharedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          {ideas.length === 0 ? (
            <EmptyState
              icon={<Lightbulb className="h-10 w-10" />}
              title="Ingen idéer endnu"
              description="Pinterest-lignende samling af projekter — ny urtehave, plant frugttræ, byg drivhus."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ideas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  shareCount={shareCounts.get(idea.id) ?? 0}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared">
          {sharedWithMe.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="Ingen delte idéer endnu"
              description="Når andre brugere deler en idé med dig, vil den dukke op her."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sharedWithMe.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  ownerLabel={idea.ownerLabel}
                  viaGroupName={idea.viaGroupName}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
