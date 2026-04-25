'use client'

import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { TASK_TYPE_META, TASK_PRIORITY_META } from '@/lib/constants'
import { formatDatoKort, venligDato, erForsinket } from '@/lib/datetime'
import type { CalendarTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/**
 * Én opgave vist som række — bruges på Overblik, Mine planter og Kalender.
 * TODO: Implementér completeTask server action når DB er koblet op.
 */
export function TaskRow({ task, compact = false }: { task: CalendarTask; compact?: boolean }) {
  const typeMeta = TASK_TYPE_META[task.taskType]
  const priMeta  = TASK_PRIORITY_META[task.priority]
  const forsinket = erForsinket(task.date) && task.status === 'open'
  const IconCmp = ((LucideIcons as unknown) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[typeMeta.icon] ?? LucideIcons.ListTodo

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/30',
        forsinket && 'border-destructive/30 bg-destructive/5'
      )}
    >
      <Checkbox
        className="mt-1"
        aria-label={`Markér ${task.title} som udført`}
        // TODO: onCheckedChange triggers opgave→log-flow
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <IconCmp className="h-3.5 w-3.5 text-muted-foreground" />
          <p className={cn('text-sm font-medium text-foreground', forsinket && 'text-destructive')}>
            {task.title}
          </p>
          {task.priority === 'critical' && (
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
              className="hover:text-foreground hover:underline"
            >
              {/* Plante-navnet er ikke i task-modellen her; opslag laves i parent */}
              Til plante
            </Link>
          )}
          <span>·</span>
          <span className={cn(forsinket && 'text-destructive font-medium')}>
            {forsinket ? venligDato(task.date) : formatDatoKort(task.date)}
          </span>
        </div>
      </div>
    </div>
  )
}
