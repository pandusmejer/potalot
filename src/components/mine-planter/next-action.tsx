import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TASK_TYPE_META, TASK_PRIORITY_META } from '@/lib/constants'
import { venligDato, erForsinket } from '@/lib/datetime'
import type { CalendarTask } from '@/lib/types'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/**
 * Sticky næste-handling komponent på plantedetalje.
 * Vises øverst i toppen så brugeren altid ved hvad næste skridt er.
 */
export function NextAction({ task }: { task: CalendarTask | null }) {
  if (!task) {
    return (
      <Card className="bg-secondary/40 border-secondary">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Alt på skinner</p>
            <p className="text-xs text-muted-foreground">Ingen åbne opgaver lige nu.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const typeMeta = TASK_TYPE_META[task.taskType]
  const priMeta  = TASK_PRIORITY_META[task.priority]
  const forsinket = erForsinket(task.date)
  const Icon = ((LucideIcons as unknown) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[typeMeta.icon] ?? Sparkles

  return (
    <Card className={forsinket ? 'border-destructive/40 bg-destructive/5' : 'bg-primary/5 border-primary/20'}>
      <CardContent className="flex items-start gap-3 py-4">
        <Checkbox className="mt-0.5" aria-label="Markér som udført" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Næste handling
            </span>
            {(task.priority === 'critical' || task.priority === 'high') && (
              <span className="text-xs text-destructive">{priMeta.label}</span>
            )}
          </div>
          <p className="font-medium text-foreground mt-1">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{venligDato(task.date)}</p>
        </div>
        <Button size="sm" variant="ghost">
          Senere
        </Button>
      </CardContent>
    </Card>
  )
}
