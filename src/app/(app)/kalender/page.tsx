'use client'

import { useState } from 'react'
import { Aarshjul } from '@/components/havekalender/aarshjul'
import { TodoTabs } from '@/components/havekalender/todo-tabs'
import { DetKanDuNu } from '@/components/havekalender/det-kan-du-nu'
import { HavensGoeremaal } from '@/components/havekalender/havens-goeremaal'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListChecks } from 'lucide-react'
import { aktuelMaaned } from '@/lib/datetime'
import {
  MOCK_CALENDAR_TASKS, MOCK_GENERAL_TASKS, MOCK_INVENTORY, MOCK_GUIDES,
} from '@/lib/mock-data'

// TODO (database): Hent fra Supabase
export default function KalenderPage() {
  const [valgtMaaned, setValgtMaaned] = useState(aktuelMaaned())

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Havekalender</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Havens gøremål, det kan du så/plante nu og dine opgaver.
          </p>
        </div>
        <AddTaskDialog />
      </div>

      {/* Årshjul */}
      <Aarshjul
        active={valgtMaaned}
        onChange={setValgtMaaned}
        tasks={MOCK_CALENDAR_TASKS}
        generelle={MOCK_GENERAL_TASKS}
      />

      {/* Personlige opgaver */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Mine opgaver
          </CardTitle>
        </CardHeader>
        <div className="px-5 pb-5">
          <TodoTabs tasks={MOCK_CALENDAR_TASKS} />
        </div>
      </Card>

      {/* Havens gøremål for måneden */}
      <HavensGoeremaal month={valgtMaaned} tasks={MOCK_GENERAL_TASKS} />

      {/* Det kan du så/plante nu */}
      <DetKanDuNu
        month={valgtMaaned}
        inventory={MOCK_INVENTORY}
        guides={MOCK_GUIDES}
      />
    </div>
  )
}
