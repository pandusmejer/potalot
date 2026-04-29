import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { AddIdeaDialog } from '@/components/idetavle/add-idea-dialog'
import { getAllIdeas } from '@/actions/idetavle'
import { Lightbulb, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  idea: 'Idé',
  planning: 'Planlagt',
  in_progress: 'I gang',
  done: 'Udført',
  abandoned: 'Droppet',
}

export default async function IdetavlePage() {
  const ideas = await getAllIdeas()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Min idétavle</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Langsigtede projekter og inspiration. Ingen daglige tasks.
          </p>
        </div>
        <AddIdeaDialog />
      </div>

      {ideas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="h-10 w-10" />}
          title="Ingen idéer endnu"
          description="Pinterest-lignende samling af projekter — ny urtehave, plant frugttræ, byg drivhus."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ideas.map(idea => {
            const cover = idea.imageIds[0]
            return (
              <Card key={idea.id} className="overflow-hidden">
                <div className="aspect-[3/2] bg-pattern-botanical bg-secondary/20 flex items-center justify-center overflow-hidden">
                  {cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={cover} alt={idea.title} className="w-full h-full object-cover" />
                  ) : (
                    <Lightbulb className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="space-y-2 pt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{idea.title}</p>
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
