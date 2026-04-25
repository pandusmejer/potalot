import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NextAction } from '@/components/mine-planter/next-action'
import { Timeline } from '@/components/mine-planter/timeline'
import { LogForm } from '@/components/mine-planter/log-form'
import { getPlant, getPlantLogs } from '@/actions/mine-planter'
import { getInventoryItem } from '@/actions/froebank'
import { MOCK_CALENDAR_TASKS, MOCK_GUIDES } from '@/lib/mock-data'
import { PLANT_STATUS_META } from '@/lib/constants'
import { dageSiden, formatDatoMedAar } from '@/lib/datetime'
import {
  ArrowLeft, MapPin, Calendar, BookOpen, Package, ArrowRight, Sprout,
  ClipboardList, Sparkles,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function PlanteDetailPage({ params }: Props) {
  const { id } = await params

  const plant = await getPlant(id)
  if (!plant) notFound()

  const logs = await getPlantLogs(plant.id)

  // TODO (database): Tasks og Guides skal også migreres
  const tasks = MOCK_CALENDAR_TASKS.filter(t => t.linkedPlantId === plant.id)
  const aabneOpgaver = tasks.filter(t => t.status === 'open').sort((a, b) => a.date.localeCompare(b.date))
  const naesteOpgave = aabneOpgaver[0] ?? null

  const guide = plant.guideId ? MOCK_GUIDES.find(g => g.id === plant.guideId) : null
  const inventoryItem = plant.sourceElementId
    ? await getInventoryItem(plant.sourceElementId)
    : null

  const statusMeta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null

  return (
    <article className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/mine-planter" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground truncate">
            {plant.name}
          </h1>
          {plant.variety && (
            <p className="text-sm italic text-muted-foreground truncate">
              {plant.variety}
            </p>
          )}
        </div>
        <Badge variant={(statusMeta.badgeVariant as 'muted' | 'info' | 'success' | 'warning' | 'outline') ?? 'muted'}>
          {statusMeta.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
        {plant.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {plant.location}
          </span>
        )}
        {alder !== null && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {alder} dage gammel
          </span>
        )}
        {plant.quantity > 1 && (
          <span className="inline-flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5" />
            {plant.quantity} stk
          </span>
        )}
        {plant.isArchived && plant.archivedYear && (
          <Badge variant="muted">Arkiveret {plant.archivedYear}</Badge>
        )}
      </div>

      {!plant.isArchived && <NextAction task={naesteOpgave} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Tidslinje
          </CardTitle>
          {!plant.isArchived && <LogForm plantId={plant.id} />}
        </CardHeader>
        <CardContent>
          <Timeline plant={plant} logs={logs} />
        </CardContent>
      </Card>

      {guide && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Dyrkningsguide
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/guides/${guide.id}`}>
                Åbn guide <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-foreground">
              {guide.plantName}{guide.variety ? ` — ${guide.variety}` : ''}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{guide.summary}</p>
          </CardContent>
        </Card>
      )}

      {inventoryItem && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Fra frøbank
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/froebank/${inventoryItem.id}`}>
                Se element <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-foreground">
              {inventoryItem.name}{inventoryItem.variety ? ` — ${inventoryItem.variety}` : ''}
            </p>
            {inventoryItem.supplier && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {inventoryItem.supplier}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!plant.isArchived && (
        <Card className="bg-gradient-to-br from-secondary/30 to-card border-secondary">
          <CardContent className="flex items-center gap-3 py-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Spørg AI om denne plante</p>
              <p className="text-xs text-muted-foreground">Få råd baseret på guide, log og status.</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Spørg (TODO AI)
            </Button>
          </CardContent>
        </Card>
      )}

      {plant.isArchived && (
        <Card className="bg-muted/40">
          <CardContent className="py-3">
            <p className="text-sm text-foreground">
              Denne plante er afsluttet og arkiveret{plant.archivedAt && ` ${formatDatoMedAar(plant.archivedAt)}`}.
              Loggen er låst som read-only.
            </p>
          </CardContent>
        </Card>
      )}
    </article>
  )
}
