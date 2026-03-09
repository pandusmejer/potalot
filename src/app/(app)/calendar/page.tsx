export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { TaskItem } from '@/components/calendar/task-item'
import { AddTaskForm } from '@/components/calendar/add-task-form'
import { EmptyState } from '@/components/ui/empty-state'
import { format, startOfWeek, endOfWeek, addWeeks, isSameDay, parseISO } from 'date-fns'
import { da } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'

export default async function CalendarPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const today = new Date()
  const fourWeeksOut = format(addWeeks(endOfWeek(today, { weekStartsOn: 1 }), 3), 'yyyy-MM-dd')

  const [tasksRes, overdueRes, plantsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, plant:plants(name)')
      .eq('user_id', userId)
      .gte('due_date', format(today, 'yyyy-MM-dd'))
      .lte('due_date', fourWeeksOut)
      .order('due_date'),
    supabase
      .from('tasks')
      .select('*, plant:plants(name)')
      .eq('user_id', userId)
      .lt('due_date', format(today, 'yyyy-MM-dd'))
      .is('completed_at', null)
      .order('due_date'),
    supabase
      .from('plants')
      .select('id, name, variety')
      .eq('user_id', userId)
      .not('status', 'in', '("done","dead")'),
  ])

  const overdueTasks = overdueRes.data ?? []
  const tasks = tasksRes.data ?? []
  const plants = plantsRes.data ?? []

  // Group tasks by date
  const grouped = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const dateKey = task.due_date
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push(task)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Kalender</h1>
          <p className="text-sm text-muted-foreground">
            {format(today, "MMMM yyyy", { locale: da })}
          </p>
        </div>
        <AddTaskForm plants={plants} />
      </div>

      {overdueTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-destructive mb-2">Forsinkede opgaver</h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && overdueTasks.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title="Ingen opgaver endnu"
          description="Opret din første opgave for at komme i gang med din dyrkningskalender."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, dateTasks]) => {
            const date = parseISO(dateKey)
            const isToday = isSameDay(date, today)
            return (
              <div key={dateKey}>
                <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  {isToday && <span className="w-2 h-2 rounded-full bg-primary" />}
                  {format(date, "EEEE d. MMMM", { locale: da })}
                  {isToday && <span className="text-xs text-muted-foreground font-normal">(i dag)</span>}
                </h2>
                <div className="space-y-2">
                  {dateTasks.map((task) => (
                    <TaskItem key={task.id} task={task} showDate={false} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}