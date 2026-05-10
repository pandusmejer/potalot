import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Sparkles } from 'lucide-react'
import type { GroupGuide } from '@/actions/group-content'

interface Props {
  guides: GroupGuide[]
  focusPlants: string[]
}

export function GroupGuidesTab({ guides, focusPlants }: Props) {
  if (focusPlants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Tilføj <strong>fokusplanter</strong> til gruppen for automatisk at vise relevante
          dyrkningsguides her. Det kan ejeren gøre i Indstillinger.
        </p>
      </div>
    )
  }

  if (guides.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4 text-center">
        Ingen guides matcher gruppens fokusplanter ({focusPlants.join(', ')}) endnu.
      </p>
    )
  }

  const masters = guides.filter(g => g.isMaster)
  const userGuides = guides.filter(g => !g.isMaster)

  return (
    <div className="space-y-4">
      {masters.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Master-guides ({masters.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {masters.map(g => <GuideCard key={g.id} guide={g} />)}
          </div>
        </div>
      )}

      {userGuides.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Bruger-guides ({userGuides.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {userGuides.map(g => <GuideCard key={g.id} guide={g} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function GuideCard({ guide }: { guide: GroupGuide }) {
  return (
    <Card className="overflow-hidden hover:bg-accent/20 transition-colors">
      <Link href={`/guides/${guide.id}`} className="flex gap-3 p-3">
        {guide.primaryImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={guide.primaryImageUrl} alt="" className="h-16 w-16 rounded-md object-cover shrink-0" />
        ) : (
          <div className="h-16 w-16 rounded-md bg-secondary/40 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground line-clamp-1">
            {guide.plantName}
            {guide.variety && <span className="text-muted-foreground"> · {guide.variety}</span>}
          </p>
          {guide.latinName && (
            <p className="text-[10px] italic text-muted-foreground line-clamp-1">{guide.latinName}</p>
          )}
          {guide.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{guide.summary}</p>
          )}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {guide.isMaster ? (
              <Badge variant="success" className="text-[9px]">Master</Badge>
            ) : (
              <Badge variant="muted" className="text-[9px]">{guide.ownerLabel ?? 'Bruger'}</Badge>
            )}
            {guide.isAiGenerated && (
              <Badge variant="outline" className="text-[9px] gap-0.5">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </Card>
  )
}
