'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CompleteTaskDialog } from '@/components/havekalender/complete-task-dialog'
import { TaskActions } from '@/components/havekalender/task-actions'
import { TASK_TYPE_META, TASK_PRIORITY_META } from '@/lib/constants'
import { SourceChip, taskSourceLabel } from '@/components/havekalender/source-chip'
import { formatDatoKort, venligDato, erForsinket } from '@/lib/datetime'
import { completeTask, uncompleteTask } from '@/actions/havekalender'
import type { CalendarTask, PlantLogType } from '@/lib/types'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/**
 * Én opgave vist som række. Checkbox markerer udført.
 * Hvis opgaven er linket til en plante: prompts om at føje til log.
 */
export function TaskRow({ task, compact = false, showSource = false }: { task: CalendarTask; compact?: boolean; showSource?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [logPrompt, setLogPrompt] = useState<{
    plantId: string
    logType: PlantLogType
    title: string
  } | null>(null)

  const typeMeta = TASK_TYPE_META[task.taskType]
  const priMeta  = TASK_PRIORITY_META[task.priority]
  const forsinket = erForsinket(task.date) && task.status === 'open'
  const completed = task.status === 'completed'
  const IconCmp = ((LucideIcons as unknown) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[typeMeta.icon] ?? LucideIcons.ListTodo

  function handleToggle(checked: boolean | string) {
    const isChecked = checked === true
    startTransition(async () => {
      if (isChecked && !completed) {
        const res = await completeTask(task.id)
        if ('error' in res) return
        // Hvis task er linket til plante med suggestedLogType: vis prompt
        if (res.linkedPlantId && res.suggestedLogType) {
          setLogPrompt({
            plantId: res.linkedPlantId,
            logType: res.suggestedLogType,
            title: res.taskTitle,
          })
        } else {
          router.refresh()
        }
      } else if (!isChecked && completed) {
        await uncompleteTask(task.id)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div
        className={cn(
          'group flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors',
          completed && 'opacity-60',
          forsinket && !completed && 'border-destructive/30 bg-destructive/5',
          !forsinket && !completed && 'hover:bg-accent/30'
        )}
      >
        <Checkbox
          className="mt-1"
          aria-label={`Markér ${task.title} som udført`}
          checked={completed}
          onCheckedChange={handleToggle}
          disabled={pending}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <IconCmp className="h-3.5 w-3.5 text-muted-foreground" />
            <p className={cn(
              'text-sm font-medium text-foreground',
              completed && 'line-through',
              forsinket && !completed && 'text-destructive'
            )}>
              {task.title}
            </p>
            {task.priority === 'critical' && !completed && (
              <Badge variant="destructive" className="text-[10px]">
                {priMeta.label}
              </Badge>
            )}
          </div>

          {!compact && task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
            {task.linkedPlantId && (
              <Link
                href={`/mine-planter/${task.linkedPlantId}`}
                className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                title="Gå til plantedetalje"
              >
                <LucideIcons.Sprout className="h-3 w-3" />
                {task.linkedPlantName ?? 'Plante'}
                {task.linkedPlantVariety && (
                  <span className="italic opacity-80"> — {task.linkedPlantVariety}</span>
                )}
              </Link>
            )}
            {task.linkedPlantId && <span>·</span>}
            <span className={cn(forsinket && !completed && 'text-destructive font-medium')}>
              {forsinket && !completed ? venligDato(task.date) : formatDatoKort(task.date)}
            </span>
            {showSource && taskSourceLabel(task.source) && (
              <SourceChip label={taskSourceLabel(task.source)!} />
            )}
          </div>
        </div>
        {!completed && (
          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
            <TaskActions task={task} />
          </div>
        )}
      </div>

      {logPrompt && (
        <CompleteTaskDialog
          open={!!logPrompt}
          onClose={() => {
            setLogPrompt(null)
            router.refresh()
          }}
          taskId={task.id}
          plantId={logPrompt.plantId}
          taskTitle={logPrompt.title}
          suggestedLogType={logPrompt.logType}
        />
      )}
    </>
  )
}
