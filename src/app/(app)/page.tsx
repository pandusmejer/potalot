import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskRow } from '@/components/overblik/task-row'
import { PlantMiniCard } from '@/components/overblik/plant-mini-card'
import { ProgressCard } from '@/components/overblik/progress-card'
import { QuickActions } from '@/components/overblik/quick-actions'
import { EmptyState } from '@/components/ui/empty-state'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { MOCK_PROGRESS, MOCK_GENERAL_TASKS } from '@/lib/mock-data'
import { erForsinket, erIDag, aktuelMaaned, maanedNavn } from '@/lib/datetime'
import { AlertCircle, CalendarClock, Sprout, ArrowRight, Lightbulb } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OverblikPage() {
  const [tasks, plants] = await Promise.all([
    getAllTasks(),
    getAllPlants(),
  ])

  // Dagens opgaver
  const idagsOpgaver = tasks.filter(t => erIDag(t.date) && t.status === 'open')
  const kritiske = idagsOpgaver.filter(t => t.priority === 'critical' || t.priority === 'high')
  const oevrigeIdag = idagsOpgaver.filter(t => t.priority !== 'critical' && t.priority !== 'high')

  // Forsinkede opgaver
  const forsinkede = tasks.filter(t => erForsinket(t.date) && t.status === 'open')

  // Aktive planter (ikke arkiverede)
  const aktivePlanter = plants.filter(p => !p.isArchived).slice(0, 4)

  // Månedens sæsonbaserede inspiration fra årshjul
  const nu = aktuelMaaned()
  const maanedenNavn = maanedNavn(nu)
  const sæsonInspiration = MOCK_GENERAL_TASKS.filter(t => t.month === nu).slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Overblik</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dagens vigtigste — det du skal fokusere på nu.
        </p>
      </div>

      {forsinkede.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              {forsinkede.length === 1 ? '1 forsinket opgave' : `${forsinkede.length} forsinkede opgaver`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {forsinkede.map(t => <TaskRow key={t.id} task={t} compact />)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            I dag
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/kalender">
              Se alle <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {idagsOpgaver.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Ingen opgaver i dag. Nyd kaffen.
            </p>
          ) : (
            <div className="space-y-2">
              {kritiske.map(t => <TaskRow key={t.id} task={t} />)}
              {oevrigeIdag.map(t => <TaskRow key={t.id} task={t} compact />)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProgressCard progress={MOCK_PROGRESS} />
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Hurtige handlinger</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <QuickActions />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-primary" />
            Aktive planter
            <span className="text-sm font-normal text-muted-foreground">
              ({plants.filter(p => !p.isArchived).length})
            </span>
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/mine-planter">
              Se alle <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {aktivePlanter.length === 0 ? (
            <EmptyState
              icon={<Sprout className="h-8 w-8" />}
              title="Ingen aktive planter endnu"
              description="Start med at tilføje noget til frøbanken og så et frø."
            />
          ) : (
            <div className="space-y-2">
              {aktivePlanter.map(plant => <PlantMiniCard key={plant.id} plant={plant} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {sæsonInspiration.length > 0 && (
        <Card className="bg-gradient-to-br from-secondary/30 to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent-copper" style={{ color: 'var(--accent-copper)' }} />
              Tid til i {maanedenNavn}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sæsonInspiration.map(gen => (
              <div key={gen.id}>
                <p className="font-medium text-foreground text-sm">{gen.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{gen.description}</p>
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="mt-1">
              <Link href="/kalender">
                Se hele måneden <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
