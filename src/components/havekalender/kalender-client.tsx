'use client'

import { useState } from 'react'
import { Aarshjul } from '@/components/havekalender/aarshjul'
import { TodoTabs } from '@/components/havekalender/todo-tabs'
import { DetKanDuNu } from '@/components/havekalender/det-kan-du-nu'
import { YearWheelSection } from '@/components/havekalender/year-wheel-section'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { UserTaskDialog } from '@/components/havekalender/user-task-dialog'
import { GeneralTaskActions } from '@/components/havekalender/general-task-actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListChecks, Calendar, EyeOff, Eye, Info } from 'lucide-react'
import { aktuelMaaned } from '@/lib/datetime'
import { MONTHS_DA, TASK_PRIORITY_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type {
  CalendarTask, GeneralGardenTask, Guide, InventoryItem, Plant, UserGardenTask,
} from '@/lib/types'

interface Props {
  tasks: CalendarTask[]
  plants: Plant[]
  inventory: InventoryItem[]
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  guides: Guide[]
}

export function KalenderClient({ tasks, plants, inventory, generalTasks, userTasks, guides }: Props) {
  const [valgtMaaned, setValgtMaaned] = useState(aktuelMaaned())
  const [visSkjulte, setVisSkjulte] = useState(false)

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
        generelle={generalTasks.filter(g => !g.isHiddenByMe)}
      />

      <MaanedensGoeremaal
        month={valgtMaaned}
        generalTasks={generalTasks}
        userTasks={userTasks}
        visSkjulte={visSkjulte}
        onToggleSkjulte={() => setVisSkjulte(v => !v)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Mine opgaver
            <span
              className="inline-flex items-center"
              title="Konkrete to-dos med specifik dato. Auto-genereres fra dine dyrkningsguides (fx 'Udplant 13. maj') eller oprettes manuelt. Modsat 'Gøremål' der er sæsonbestemte ting."
            >
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
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

function MaanedensGoeremaal({
  month, generalTasks, userTasks, visSkjulte, onToggleSkjulte,
}: {
  month: number
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  visSkjulte: boolean
  onToggleSkjulte: () => void
}) {
  const monthName = MONTHS_DA[month - 1].full
  const generelleAlle = generalTasks.filter(g => g.month === month)
  const generelleSynlige = generelleAlle.filter(g => !g.isHiddenByMe)
  const generelleSkjulte = generelleAlle.filter(g => g.isHiddenByMe)
  const mine = userTasks.filter(u => u.month === month)
  const harSkjulte = generelleSkjulte.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Gøremål — {monthName}
          <span
            className="inline-flex items-center"
            title="Sæsonbestemte ting man typisk gør hver måned (fx 'I maj: udplant frostfølsomme planter'). Havens gøremål kommer fra PotAlot — Mine gøremål tilføjer du selv. Modsat 'Mine opgaver' der har specifik dato."
          >
            <Info className="h-3 w-3 text-muted-foreground" />
          </span>
        </CardTitle>
        <UserTaskDialog defaultMonth={month} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Globale aktive */}
        {generelleSynlige.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Havens gøremål</p>
            {generelleSynlige.map(t => <GeneralTaskRow key={t.id} task={t} />)}
          </div>
        )}

        {/* Skjulte (toggle) */}
        {harSkjulte && (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleSkjulte}
              className="text-xs text-muted-foreground"
            >
              {visSkjulte ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {visSkjulte ? 'Skjul markerede' : `Vis ${generelleSkjulte.length} skjulte`}
            </Button>
            {visSkjulte && (
              <div className="space-y-2 mt-2">
                {generelleSkjulte.map(t => <GeneralTaskRow key={t.id} task={t} />)}
              </div>
            )}
          </div>
        )}

        {/* Brugerens egne */}
        {mine.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Mine gøremål</p>
            {mine.map(t => <UserTaskRow key={t.id} task={t} />)}
          </div>
        )}

        {generelleSynlige.length === 0 && mine.length === 0 && !harSkjulte && (
          <p className="text-sm text-muted-foreground italic">Ingen gøremål i {monthName.toLowerCase()}.</p>
        )}
      </CardContent>
    </Card>
  )
}

function GeneralTaskRow({ task }: { task: GeneralGardenTask }) {
  const pri = TASK_PRIORITY_META[task.priority]
  const isHigh = task.priority === 'high' || task.priority === 'critical'
  return (
    <div className={cn(
      'border-l-2 pl-3 py-1 transition-opacity',
      task.isHiddenByMe ? 'border-muted-foreground/30 opacity-60' : 'border-primary/30'
    )}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{task.title}</p>
            {isHigh && <Badge variant="warning" className="text-[10px]">{pri.label}</Badge>}
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
          )}
          {task.timeWindow && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{task.timeWindow}</p>
          )}
        </div>
        <GeneralTaskActions taskId={task.id} isHidden={!!task.isHiddenByMe} />
      </div>
    </div>
  )
}

function UserTaskRow({ task }: { task: UserGardenTask }) {
  return (
    <div className="border-l-2 border-accent-copper/40 pl-3 py-1">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{task.title}</p>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
          )}
          {task.timeWindow && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{task.timeWindow}</p>
          )}
        </div>
        <UserTaskDialog task={task} />
      </div>
    </div>
  )
}
