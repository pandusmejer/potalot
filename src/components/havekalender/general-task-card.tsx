'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronDown, ChevronRight, Plus, Check, EyeOff, Eye,
  Lightbulb, AlertTriangle, Loader2,
} from 'lucide-react'
import { TASK_PRIORITY_META } from '@/lib/constants'
import { addGeneralTasksToCalendar } from '@/actions/year-wheel'
import { hideGeneralTask, unhideGeneralTask } from '@/actions/aarshjul'
import type { GeneralGardenTask } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  task: GeneralGardenTask
  /** True hvis brugeren allerede har tilføjet denne general_task til sin kalender i indeværende år */
  alreadyAdded: boolean
  /** Indeværende år til 'tilføj'-action */
  year: number
  /** Blødere look: skjul kategori/prioritet-badges (timing
   *  vises i stedet via sektions-headeren) — mindre admin-agtigt */
  soft?: boolean
}

/**
 * Ekspanderbar visning af et generelt gøremål.
 *
 * Klik på header → folder ud med beskrivelse, tip, risiko.
 * Knapper: 'Tilføj til mine opgaver' (eller status hvis allerede tilføjet)
 * + 'Ikke relevant for min have' (skjul-funktion).
 */
export function GeneralTaskCard({ task, alreadyAdded, year, soft = false }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const pri = TASK_PRIORITY_META[task.priority]
  const isHigh = task.priority === 'high' || task.priority === 'critical'
  const isHidden = !!task.isHiddenByMe
  const hasDetails = !!(task.description || task.tip || task.risk || task.timeWindow)

  function handleAdd() {
    setError(null)
    startTransition(async () => {
      const res = await addGeneralTasksToCalendar({
        generalTaskIds: [task.id],
        year,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function handleToggleHidden() {
    setError(null)
    startTransition(async () => {
      const res = isHidden
        ? await unhideGeneralTask(task.id)
        : await hideGeneralTask(task.id)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'border-l-2 transition-opacity rounded-r-md',
        isHidden ? 'border-muted-foreground/30 opacity-60' : 'border-primary/30',
        alreadyAdded && !isHidden && 'border-green-600/50 bg-green-50/30',
      )}
    >
      {/* Header — klikbar for at folde ud */}
      <button
        type="button"
        onClick={() => hasDetails && setOpen(o => !o)}
        className={cn(
          'w-full text-left pl-3 pr-2 py-2 flex items-start gap-2',
          hasDetails && 'cursor-pointer hover:bg-accent/30 transition-colors rounded-r-md',
          !hasDetails && 'cursor-default',
        )}
        aria-expanded={open}
      >
        {hasDetails && (
          open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{task.title}</p>
            {!soft && isHigh && <Badge variant="warning" className="text-[10px]">{pri.label}</Badge>}
            {!soft && task.category && (
              <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
            )}
            {alreadyAdded && (
              <Badge variant="success" className="text-[10px] gap-0.5">
                <Check className="h-2.5 w-2.5" />
                I min kalender
              </Badge>
            )}
          </div>
          {!open && task.timeWindow && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{task.timeWindow}</p>
          )}
        </div>
      </button>

      {/* Foldet ud */}
      {open && hasDetails && (
        <div className="pl-7 pr-3 pb-3 space-y-2">
          {task.description && (
            <p className="text-sm text-foreground/85 leading-relaxed">{task.description}</p>
          )}
          {task.timeWindow && (
            <p className="text-xs text-muted-foreground italic">
              <strong className="not-italic font-medium text-foreground/70">Tidsrum:</strong> {task.timeWindow}
            </p>
          )}
          {task.tip && (
            <div className="flex items-start gap-2 text-xs text-foreground/80 bg-amber-50/50 border border-amber-200/60 rounded-md p-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>{task.tip}</span>
            </div>
          )}
          {task.risk && (
            <div className="flex items-start gap-2 text-xs text-foreground/80 bg-rose-50/50 border border-rose-200/60 rounded-md p-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-700 shrink-0 mt-0.5" />
              <span>{task.risk}</span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-1">
            {alreadyAdded ? (
              <Button type="button" size="sm" variant="outline" disabled className="text-xs">
                <Check className="h-3.5 w-3.5" />
                Tilføjet til mine opgaver
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={pending}
                className="text-xs"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Tilføj til mine opgaver
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleToggleHidden}
              disabled={pending}
              className="text-xs text-muted-foreground"
            >
              {isHidden ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Vis igen
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Ikke relevant for min have
                </>
              )}
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
