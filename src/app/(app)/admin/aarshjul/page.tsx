import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GeneralTaskForm } from '@/components/admin/general-task-form'
import { isCurrentUserAdmin } from '@/lib/auth'
import { getGeneralGardenTasks } from '@/actions/aarshjul'
import { MONTHS_DA } from '@/lib/constants'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { aktuelMaaned } from '@/lib/datetime'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Lav',
  medium: 'Medium',
  high: 'Høj',
  critical: 'Kritisk',
}

export default async function AdminAarshjulPage() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/')

  const tasks = await getGeneralGardenTasks({ includeInactive: true })
  const currentMonth = aktuelMaaned()

  // Grupper per måned
  const byMonth: Record<number, typeof tasks> = {}
  for (let m = 1; m <= 12; m++) byMonth[m] = []
  for (const t of tasks) byMonth[t.month].push(t)

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Årshjul — administration</h1>
          <p className="text-sm text-muted-foreground">
            Globale gøremål synlige for alle brugere. Ændringer er øjeblikkelige.
          </p>
        </div>
        <GeneralTaskForm />
      </div>

      <div className="space-y-2">
        {MONTHS_DA.map(m => {
          const monthTasks = byMonth[m.num]
          const isCurrent = m.num === currentMonth
          return (
            <Card key={m.num} className={isCurrent ? 'border-primary/30' : undefined}>
              <details
                open={isCurrent}
                className="group"
              >
                <summary
                  className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 hover:bg-accent/30 transition-colors rounded-xl"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                  <p className="font-serif text-lg text-foreground flex-1">
                    {m.full}
                    {isCurrent && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-sans font-semibold">
                        Denne måned
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {monthTasks.length} gøremål
                  </span>
                </summary>

                <div className="px-4 pb-4 pt-1">
                  {monthTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Ingen gøremål endnu.</p>
                  ) : (
                    <div className="space-y-2">
                      {monthTasks.map(t => (
                        <div
                          key={t.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border',
                            t.isActive ? 'border-border bg-card' : 'border-dashed border-border bg-muted/30 opacity-70'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground">{t.title}</p>
                              {!t.isActive && <Badge variant="muted" className="text-[10px]">Inaktiv</Badge>}
                              <Badge variant="outline" className="text-[10px]">{PRIORITY_LABEL[t.priority] ?? t.priority}</Badge>
                              {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
                            </div>
                            {t.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                            )}
                            {t.timeWindow && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{t.timeWindow}</p>
                            )}
                          </div>
                          <GeneralTaskForm task={t} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
