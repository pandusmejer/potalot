export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { StatusCards } from '@/components/dashboard/status-cards'
import { TodaysTasks } from '@/components/dashboard/todays-tasks'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getCurrentSeason } from '@/lib/utils'
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { da } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const nextWeekEnd = format(addDays(endOfWeek(today, { weekStartsOn: 1 }), 7), 'yyyy-MM-dd')

  const [
    todayTasksRes,
    weekTasksRes,
    upcomingTasksRes,
    plantsRes,
    seedsRes,
    notesRes,
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, plant:plants(name)')
      .eq('user_id', userId)
      .eq('due_date', todayStr)
      .order('priority', { ascending: true }),
    supabase
      .from('tasks')
      .select('*, plant:plants(name)')
      .eq('user_id', userId)
      .gte('due_date', weekStart)
      .lte('due_date', weekEnd)
      .is('completed_at', null)
      .order('due_date'),
    supabase
      .from('tasks')
      .select('*, plant:plants(name)')
      .eq('user_id', userId)
      .gt('due_date', weekEnd)
      .lte('due_date', nextWeekEnd)
      .is('completed_at', null)
      .order('due_date')
      .limit(5),
    supabase
      .from('plants')
      .select('id, status')
      .eq('user_id', userId)
      .not('status', 'in', '("done","dead")'),
    supabase
      .from('seeds')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'in_stock'),
    supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .eq('season_year', today.getFullYear()),
  ])

  const activePlants = plantsRes.data?.length ?? 0
  const seedsInStock = seedsRes.data?.length ?? 0
  const tasksThisWeek = weekTasksRes.data?.length ?? 0
  const notesSeason = notesRes.data?.length ?? 0

  const season = getCurrentSeason()
  const seasonLabel = season.charAt(0).toUpperCase() + season.slice(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Overblik</h1>
        <p className="text-sm text-muted-foreground">
          {format(today, "EEEE d. MMMM yyyy", { locale: da })} — {seasonLabel} {today.getFullYear()}
        </p>
      </div>

      <StatusCards
        activePlants={activePlants}
        seedsInStock={seedsInStock}
        tasksThisWeek={tasksThisWeek}
        notesSeason={notesSeason}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <TodaysTasks tasks={todayTasksRes.data ?? []} />
        <TodaysTasks tasks={upcomingTasksRes.data ?? []} title="Kommende opgaver" />
      </div>

      {activePlants > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sæsonmål</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Du har <strong>{activePlants}</strong> aktive planter og <strong>{seedsInStock}</strong> frø på lager denne sæson.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}