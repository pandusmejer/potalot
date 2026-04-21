import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { StatusCards } from '@/components/dashboard/status-cards'
import { TodaysTasks } from '@/components/dashboard/todays-tasks'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SEED_STATUSES, GUIDE_CATEGORIES } from '@/lib/constants'
import { getCurrentSeason } from '@/lib/utils'
import type { Task, Seed, PlantGuide, Variety, Placering } from '@/lib/types'
import Link from 'next/link'
import { Package, BookOpen, ArrowRight } from 'lucide-react'
import { SowButton } from '@/components/actions/sow-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const [seedsRes, plantsRes, tasksRes, notesRes, guidesRes, varietiesRes, placeringerRes] = await Promise.all([
    supabase.from('seeds').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('plants').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*, plant:plants(name, variety)').eq('user_id', userId).is('completed_at', null).order('due_date', { ascending: true }).limit(10),
    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('season_year', new Date().getFullYear()),
    supabase.from('plant_guides').select('*').order('name_da', { ascending: true }),
    supabase.from('varieties').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('species_name'),
    supabase.from('placeringer').select('*').eq('user_id', userId).order('name'),
  ])

  const seeds = (seedsRes.data || []) as Seed[]
  const plants = plantsRes.data || []
  const tasks = (tasksRes.data || []) as Task[]
  const guides = (guidesRes.data || []) as PlantGuide[]
  const varieties = (varietiesRes.data || []) as Variety[]
  const placeringer = (placeringerRes.data || []) as Placering[]

  const activePlants = plants.filter(p => !['done', 'dead'].includes(p.status)).length
  const seedsInStock = seeds.filter(s => s.status === 'in_stock').length
  const notesSeason = notesRes.count || 0
  const season = getCurrentSeason()
  const recentSeeds = seeds.slice(0, 6)
  const upcomingTasks = tasks.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hjem</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {season.charAt(0).toUpperCase() + season.slice(1)} {new Date().getFullYear()}{seeds.length > 0 ? ` — ${seeds.length} frø, ${activePlants} planter i vækst` : ''}
          </p>
        </div>
        <SowButton seeds={seeds} varieties={varieties} placeringer={placeringer} />
      </div>

      <StatusCards
        activePlants={activePlants}
        seedsInStock={seedsInStock}
        tasksThisWeek={upcomingTasks.length}
        notesSeason={notesSeason}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <TodaysTasks tasks={upcomingTasks} title="Kommende opgaver" />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Frøbank
            </CardTitle>
            <Link href="/vaekst" className="text-xs text-primary flex items-center gap-1 hover:underline">
              Se alle <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          {recentSeeds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Frøbanken er tom. Tilføj din første pose.</p>
          ) : (
            <div className="space-y-2">
              {recentSeeds.map((seed) => {
                const statusMeta = SEED_STATUSES[seed.status as keyof typeof SEED_STATUSES]
                return (
                  <div key={seed.id} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {seed.name}{seed.variety ? ` — ${seed.variety}` : ''}
                      </p>
                      {seed.brand && (
                        <p className="text-xs text-muted-foreground">{seed.brand}</p>
                      )}
                    </div>
                    {statusMeta && (
                      <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Dyrkningsguides
          </CardTitle>
          <Link href="/guides" className="text-xs text-primary flex items-center gap-1 hover:underline">
            Se alle {guides.length} <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GUIDE_CATEGORIES).map(([key, meta]) => {
            const count = guides.filter(g => g.category === key).length
            if (count === 0) return null
            return (
              <Link key={key} href={`/guides?category=${key}`} className="inline-flex items-center gap-1.5">
                <Badge className={meta.color}>{meta.label} ({count})</Badge>
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
