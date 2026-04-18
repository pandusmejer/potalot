'use client'

import { completeTask, uncompleteTask } from '@/actions/tasks'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { TASK_TYPES, type TaskType } from '@/lib/constants'
import type { Task } from '@/lib/types'
import { formatDate, isOverdue } from '@/lib/utils'
import { Check, Circle, AlertTriangle } from 'lucide-react'
import { useTransition } from 'react'
import { EMPTY_STATES } from '@/lib/sprog'

interface TodaysTasksProps {
  tasks: Task[]
  title?: string
}

export function TodaysTasks({ tasks, title = 'Dagens opgaver' }: TodaysTasksProps) {
  const isToday = title.toLowerCase().includes('dag')
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          {isToday ? EMPTY_STATES.ingen_opgaver_i_dag : EMPTY_STATES.ingen_kommende_opgaver}
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </Card>
  )
}

function TaskRow({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition()
  const isCompleted = !!task.completed_at
  const overdue = !isCompleted && isOverdue(task.due_date)
  const taskMeta = TASK_TYPES[task.task_type as TaskType]

  function handleToggle() {
    startTransition(async () => {
      if (isCompleted) {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
    })
  }

  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
      >
        {isCompleted ? (
          <Check className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        {task.plant && (
          <p className="text-xs text-muted-foreground">{task.plant.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
        {taskMeta && (
          <Badge className={taskMeta.color}>{taskMeta.label}</Badge>
        )}
        <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
      </div>
    </div>
  )
}
