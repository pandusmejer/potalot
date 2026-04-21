export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { TaskItem } from '@/components/calendar/task-item'
import { AddTaskForm } from '@/components/calendar/add-task-form'
import { Aarshjul } from '@/components/calendar/aarshjul'
import { TodoNiveauer } from '@/components/calendar/todo-niveauer'
import { MaanedsplanView } from '@/components/calendar/maanedsplan-view'
import { Fremgang } from '@/components/calendar/fremgang'
import { format, startOfWeek, endOfWeek, endOfMonth, isSameDay } from 'date-fns'
import { da } from 'date-fns/locale'
import { maanedFraDato } from '@/lib/calendar/maanedsplan'
import type { Task, PlantGuide } from '@/lib/types'

interface Props {
  searchParams: Promise<{ maaned?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const today = new Date()
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')
  const todayStr = format(today, 'yyyy-MM-dd')

  const activeMonth = params.maaned ?? maanedFraDato(today)

  const [tasksRes, overdueRes, plantsRes, guidesRes, hoestetRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, plant:plants(name, variety)')
      .eq('user_id', userId)
      .gte('due_date', todayStr)
      .lte('due_date', monthEnd)
      .is('completed_at', null)
      .order('due_date'),
    supabase
      .from('tasks')
      .select('*, plant:plants(name, variety)')
      .eq('user_id', userId)
      .lt('due_date', todayStr)
      .is('completed_at', null)
      .order('due_date'),
    supabase
      .from('plants')
      .select('id, name, variety, livscyklus, status')
      .eq('user_id', userId)
      .not('livscyklus', 'eq', 'afsluttet'),
    supabase
      .from('plant_guides')
      .select('*')
      .order('name_da'),
    supabase
      .from('plant_events')
      .select('id, data')
      .eq('user_id', userId)
      .eq('event_type', 'hoestet')
      .gte('event_date', `${today.getFullYear()}-01-01`),
  ])

  const tasks = (tasksRes.data ?? []) as Task[]
  const overdueTasks = (overdueRes.data ?? []) as Task[]
  const plants = plantsRes.data ?? []
  const guides = (guidesRes.data ?? []) as PlantGuide[]
  const hoestEvents = hoestetRes.data ?? []

  // Del tasks i niveauer
  const idag = tasks.filter(t => t.due_date === todayStr)
  const uge = tasks.filter(t => t.due_date >= todayStr && t.due_date <= weekEnd)
  const maaned = tasks.filter(t => t.due_date >= todayStr && t.due_date <= monthEnd)

  // Gamification-tal
  const aktivePlanter = plants.length
  const hoestetIkor = hoestEvents.reduce((sum, e) => {
    const maengde = ((e.data as Record<string, unknown> | undefined)?.maengde as number | undefined) ?? 1
    return sum + maengde
  }, 0)

  const plantsForForm = plants.map(p => ({ id: p.id, name: p.name, variety: p.variety }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalender</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(today, "EEEE 'den' d. MMMM", { locale: da })}
          </p>
        </div>
        <AddTaskForm plants={plantsForForm} />
      </div>

      {/* Årshjul */}
      <Aarshjul activeMonth={activeMonth} />

      {/* Fremgang */}
      <Fremgang aktivePlanter={aktivePlanter} hoestetIkor={Math.round(hoestetIkor)} />

      {/* Overskredne opgaver */}
      {overdueTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-foreground mb-2">
            Noget der venter
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* To-do i niveauer */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-3">Opgaver</h2>
        <TodoNiveauer idag={idag} uge={uge} maaned={maaned} />
      </section>

      {/* Månedsplan: "Det kan du i april" */}
      <MaanedsplanView guides={guides} maaned={activeMonth} />

      {/* Kommende uge — detalje-liste */}
      {uge.length > 0 && uge.some(t => !isSameDay(new Date(t.due_date), today)) && (
        <section>
          <h2 className="text-sm font-medium text-foreground mb-2">
            Uge {format(today, 'w', { locale: da })} — {format(today, 'd. MMM', { locale: da })} til {format(new Date(weekEnd), 'd. MMM', { locale: da })}
          </h2>
          <div className="space-y-2">
            {uge
              .filter(t => t.due_date !== todayStr)
              .map(task => <TaskItem key={task.id} task={task} />)}
          </div>
        </section>
      )}
    </div>
  )
}
