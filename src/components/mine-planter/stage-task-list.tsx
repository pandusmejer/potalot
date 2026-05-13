import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskRow } from '@/components/overblik/task-row'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { Plus, ListChecks, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { taskBelongsTo, TASK_STAGE } from '@/lib/plant-stages'
import { PLANT_STATUS_META } from '@/lib/constants'
import type { CalendarTask, PlantStatus, Plant } from '@/lib/types'

interface Props {
  plantId: string
  plantName: string
  plantVariety: string | null
  status: PlantStatus
  tasks: CalendarTask[]
  /** Andre aktive planter (til plant-dropdown i create-dialog) */
  otherPlants: Pick<Plant, 'id' | 'name' | 'variety'>[]
}

/**
 * Plantens opgaver grupperet efter stadie-relevans.
 * - Aktuelt: opgaver relevante i nuværende stadie + uspecificerede (vand, gød)
 * - Senere: opgaver der hører til kommende stadier
 * - Forsinkede: hvis dato er overskredet
 */
export function StageTaskList({
  plantId, plantName, plantVariety, status, tasks, otherPlants,
}: Props) {
  const aabne = tasks.filter(t => t.status === 'open')

  const aktuelle = aabne.filter(t => taskBelongsTo(t.taskType, status) === 'aktuelt')
  const senere = aabne.filter(t => taskBelongsTo(t.taskType, status) === 'senere')

  // Sorter hver gruppe efter dato
  aktuelle.sort((a, b) => a.date.localeCompare(b.date))
  senere.sort((a, b) => a.date.localeCompare(b.date))

  // Saml planter inkl. denne (så plant-dropdown i edit-form ikke mister current)
  const allPlantsForDropdown = [
    { id: plantId, name: plantName, variety: plantVariety },
    ...otherPlants.filter(p => p.id !== plantId),
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          Plantens gøremål
          <span
            className="inline-flex"
            title="Gøremål kommer fra dyrkningsguiden og er grupperet efter hvilket stadie de hører til."
          >
            <ChevronDown className="h-3 w-3 text-muted-foreground rotate-0" />
          </span>
        </CardTitle>
        <AddTaskDialog defaultPlantId={plantId} plants={allPlantsForDropdown}>
          <Button variant="outline" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Tilføj opgave
          </Button>
        </AddTaskDialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {aktuelle.length === 0 && senere.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Ingen åbne gøremål for denne plante. Den passer sig selv lige nu.
          </p>
        )}

        {aktuelle.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-green-800 font-semibold">
              Lige nu — {PLANT_STATUS_META[status].label.toLowerCase()} ({aktuelle.length})
            </p>
            <div className="space-y-2">
              {aktuelle.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          </div>
        )}

        {senere.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Kommende stadier ({senere.length})
            </p>
            <div className="space-y-2">
              {senere.map(t => {
                const stageHint = TASK_STAGE[t.taskType]
                const stageLabel = stageHint !== 'enhver'
                  ? PLANT_STATUS_META[stageHint].label
                  : null
                return (
                  <div key={t.id} className="relative">
                    {stageLabel && (
                      <span className="absolute -top-1 right-2 z-10 text-[9px] uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                        {stageLabel}
                      </span>
                    )}
                    <TaskRow task={t} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
