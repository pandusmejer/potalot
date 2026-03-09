'use client'

import { completeTask, uncompleteTask, deleteTask } from '@/actions/tasks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TASK_TYPES, type TaskType } from '@/lib/constants'
import type { Task } from '@/lib/types'
import { formatDate, isOverdue } from '@/lib/utils'
import { Check, Circle, Trash2, AlertTriangle } from 'lucide-react'
import { useTransition } from 'react'

interface TaskItemProps {
  task: Task
  showDate?: boolean
}

export function TaskItem({ task, showDate = true }: TaskItemProps) {
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

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id)
    })
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-card ${overdue ? 'border-destructive/30' : ''}`}>
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
        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.plant && (
            <span className="text-xs text-muted-foreground">{task.plant.name}</span>
          )}
          {task.description && (
            <span className="text-xs text-muted-foreground truncate">{task.description}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
        {taskMeta && <Badge className={taskMeta.color}>{taskMeta.label}</Badge>}
        {showDate && <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>}
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending} className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
