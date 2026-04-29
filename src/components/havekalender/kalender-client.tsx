'use client'

import { useState } from 'react'
import { Aarshjul } from '@/components/havekalender/aarshjul'
import { TodoTabs } from '@/components/havekalender/todo-tabs'
import { DetKanDuNu } from '@/components/havekalender/det-kan-du-nu'
import { YearWheelSection } from '@/components/havekalender/year-wheel-section'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ListChecks } from 'lucide-react'
import { aktuelMaaned } from '@/lib/datetime'
import type {
  CalendarTask, GeneralGardenTask, Guide, InventoryItem, Plant,
} from '@/lib/types'

interface Props {
  tasks: CalendarTask[]
  plants: Plant[]
  inventory: InventoryItem[]
  generalTasks: GeneralGardenTask[]
  guides: Guide[]
}

export function KalenderClient({ tasks, plants, inventory, generalTasks, guides }: Props) {
  const [valgtMaaned, setValgtMaaned] = useState(aktuelMaaned())

  const aktivePlanter = plants
    .filter(p => !p.isArchived)
    .map(p => ({ id: p.id, name: p.name, variety: p.variety }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Havekalender</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Havens gøremål, det kan du så/plante nu og dine opgaver.
          </p>
        </div>
        <AddTaskDialog plants={aktivePlanter} />
      </div>

      <Aarshjul
        active={valgtMaaned}
        onChange={setValgtMaaned}
        tasks={tasks}
        generelle={generalTasks}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Mine opgaver
          </CardTitle>
        </CardHeader>
        <div className="px-5 pb-5">
          <TodoTabs tasks={tasks} />
        </div>
      </Card>

      <YearWheelSection
        existingTasks={tasks}
        year={new Date().getFullYear()}
      />

      <DetKanDuNu
        month={valgtMaaned}
        inventory={inventory}
        guides={guides}
      />
    </div>
  )
}
