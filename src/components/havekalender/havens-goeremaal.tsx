import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TASK_PRIORITY_META, MONTHS_DA } from '@/lib/constants'
import type { GeneralGardenTask } from '@/lib/types'
import { Calendar } from 'lucide-react'

interface Props {
  month: number
  tasks: GeneralGardenTask[]
}

/**
 * Havens gøremål — generelle (ikke-personlige) opgaver for valgte måned.
 * Kommer fra det kuraterede årshjul i mock-data.
 */
export function HavensGoeremaal({ month, tasks }: Props) {
  const monthName = MONTHS_DA[month - 1].full
  const filtered = tasks.filter(t => t.month === month)

  if (filtered.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Havens gøremål — {monthName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.map(task => {
          const pri = TASK_PRIORITY_META[task.priority]
          return (
            <div key={task.id} className="border-l-2 border-primary/30 pl-3 py-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground">{task.title}</p>
                {task.priority === 'high' && (
                  <Badge variant="warning" className="text-[10px]">{pri.label}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
