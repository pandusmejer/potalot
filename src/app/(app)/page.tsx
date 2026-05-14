import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskRow } from '@/components/overblik/task-row'
import { PlantMiniCard } from '@/components/overblik/plant-mini-card'
import { ProgressCard } from '@/components/overblik/progress-card'
import { QuickActions } from '@/components/overblik/quick-actions'
import { EmptyState } from '@/components/ui/empty-state'
import { GardenRoleCard } from '@/components/profil/garden-role-card'
import { BadgeGallery } from '@/components/profil/badge-gallery'
import { StartHereCard } from '@/components/overblik/start-here-card'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getGeneralGardenTasks } from '@/actions/aarshjul'
import { backfillAllBadges, getBadgesForUser } from '@/actions/badges'
import { getCurrentUser } from '@/lib/auth'
import { getProfile } from '@/actions/profil'
import { computeRole, GARDEN_ROLES } from '@/lib/garden-roles'
import { erForsinket, erIDag, aktuelMaaned, maanedNavn } from '@/lib/datetime'
import { AlertCircle, CalendarClock, Sprout, ArrowRight, Lightbulb } from 'lucide-react'
import type { ProgressState } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function OverblikPage() {
  const me = await getCurrentUser()

  const [tasks, plants, inventory, generalTasks, profile, earned] = await Promise.all([
    getAllTasks(),
    getAllPlants(),
    getAllInventoryItems(),
    getGeneralGardenTasks(),
    getProfile(),
    me ? (async () => {
      await backfillAllBadges(me.id)
      return getBadgesForUser(me.id)
    })() : Promise.resolve([]),
  ])

  // Helt ny bruger: ingen planter + ingen frøbank-items
  const isNewUser = me !== null && plants.length === 0 && inventory.length === 0

  const roleProgress = computeRole(earned.map(e => e.badgeId))
  const roleLabel = GARDEN_ROLES[roleProgress.currentRole].label
  const greeting = greetingFor(profile?.username ?? null)

  // Dagens opgaver
  const idagsOpgaver = tasks.filter(t => erIDag(t.date) && t.status === 'open')
  const kritiske = idagsOpgaver.filter(t => t.priority === 'critical' || t.priority === 'high')
  const oevrigeIdag = idagsOpgaver.filter(t => t.priority !== 'critical' && t.priority !== 'high')

  // Forsinkede opgaver
  const forsinkede = tasks.filter(t => erForsinket(t.date) && t.status === 'open')

  // Aktive planter (ikke arkiverede)
  const aktivePlanter = plants.filter(p => !p.isArchived).slice(0, 4)

  // Månedens sæsonbaserede inspiration fra årshjul (filtrér skjulte væk)
  const nu = aktuelMaaned()
  const maanedenNavn = maanedNavn(nu)
  const sæsonInspiration = generalTasks
    .filter(t => t.month === nu && !t.isHiddenByMe)
    .slice(0, 3)

  // Beregn månedens fremgang fra rigtige tasks
  const yyyymm = new Date().toISOString().slice(0, 7)
  const monthTasks = tasks.filter(t => t.date.startsWith(yyyymm))
  const completedTasks = monthTasks.filter(t => t.status === 'completed').length
  const totalTasks = monthTasks.length
  const criticalMonth = monthTasks.filter(t => t.priority === 'critical' || t.priority === 'high')
  const ratio = totalTasks > 0 ? completedTasks / totalTasks : 0
  const visualState = ratio >= 0.8 ? 'basket_80_percent'
    : ratio >= 0.5 ? 'basket_60_percent'
    : ratio >= 0.2 ? 'basket_20_percent'
    : 'basket_empty'
  const progress: ProgressState = {
    userId: '',
    period: yyyymm,
    completedTasks,
    totalTasks,
    criticalTasksCompleted: criticalMonth.filter(t => t.status === 'completed').length,
    criticalTasksTotal: criticalMonth.length,
    visualState,
  }

  return (
    <div className="space-y-6">
      {/* Personlig velkomst med haverolle-tagline */}
      <div>
        <h1 className="text-3xl font-serif text-foreground">
          {greeting}{profile?.username ? `, ${profile.username}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {me ? (
            <>Du er <strong className="text-foreground">{roleLabel}</strong> · {earned.length} optjent badge{earned.length === 1 ? '' : 's'} · {maanedenNavn}</>
          ) : (
            <>Dit grønne overblik.</>
          )}
        </p>
      </div>

      {/* Start her-card for helt nye brugere */}
      {isNewUser && <StartHereCard />}

      {/* Forsinkede opgaver - haster */}
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

      {/* Praktisk: I dag */}
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
        <ProgressCard progress={progress} />
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
              title="Endnu ingen i jorden"
              description={
                inventory.length === 0
                  ? 'Tilføj først noget til frøbanken — så kan du aktivere det som plante.'
                  : 'Aktivér en sort fra din frøbank for at starte en dyrkning.'
              }
              action={
                inventory.length > 0 ? (
                  <Button asChild variant="outline">
                    <Link href="/mine-planter">
                      <Sprout className="h-3.5 w-3.5" />
                      Aktivér en plante
                    </Link>
                  </Button>
                ) : undefined
              }
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

      {/* Identitet: haverolle + badges (tidligere /havebog) */}
      {me && (
        <>
          <div className="pt-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Din havehistorie
            </p>
            <div className="space-y-4">
              <GardenRoleCard progress={roleProgress} />
              <BadgeGallery earned={earned} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Tidsspecifik hilsen — Godmorgen / Goddag / Godaften.
 */
function greetingFor(_name: string | null): string {
  const hour = new Date().getHours()
  if (hour < 10) return 'Godmorgen'
  if (hour < 17) return 'Goddag'
  return 'Godaften'
}
