'use client'

import { useState } from 'react'
import { Aarshjul } from '@/components/havekalender/aarshjul'
import { TodoTabs } from '@/components/havekalender/todo-tabs'
import { DetKanDuNu } from '@/components/havekalender/det-kan-du-nu'
import { MaanedsHero } from '@/components/havekalender/maaneds-hero'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { UserTaskDialog } from '@/components/havekalender/user-task-dialog'
import { GeneralTaskCard } from '@/components/havekalender/general-task-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ListChecks, Calendar, EyeOff, Eye, Info, Compass, ArrowRight } from 'lucide-react'
import { aktuelMaaned } from '@/lib/datetime'
import { MONTHS_DA } from '@/lib/constants'
import { challengesForMonth } from '@/lib/seasonal-challenges'
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
  const year = new Date().getFullYear()

  const aktivePlanter = plants
    .filter(p => !p.isArchived)
    .map(p => ({ id: p.id, name: p.name, variety: p.variety }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Havekalender</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sæsonens rytme, dine opgaver og hvad du kan så lige nu.
          </p>
        </div>
        <AddTaskDialog plants={aktivePlanter} />
      </div>

      {/* Årshjul — navigation */}
      <Aarshjul
        active={valgtMaaned}
        onChange={setValgtMaaned}
        tasks={tasks}
        generelle={generalTasks.filter(g => !g.isHiddenByMe)}
      />

      {/* Måneds-hero med stemning */}
      <MaanedsHero month={valgtMaaned} year={year} />

      {/* Sæson-challenge promo hvis der er aktive i valgte måned */}
      {challengesForMonth(valgtMaaned).length > 0 && (
        <Link
          href="/havelandskab"
          className="block rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-card p-3 hover:bg-amber-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Compass className="h-4 w-4 text-amber-700 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {challengesForMonth(valgtMaaned).length === 1
                  ? `Én sæson-challenge denne måned: ${challengesForMonth(valgtMaaned)[0].title}`
                  : `${challengesForMonth(valgtMaaned).length} sæson-challenges denne måned`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Deltag i den fælles rytme — alle PotAlot-brugere er med.
              </p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </Link>
      )}

      {/* Tre-kort grid: Gøremål · Mine opgaver · Det kan du så */}
      <div className="grid gap-4 lg:grid-cols-3">
        <MaanedensGoeremaal
          month={valgtMaaned}
          generalTasks={generalTasks}
          userTasks={userTasks}
          visSkjulte={visSkjulte}
          onToggleSkjulte={() => setVisSkjulte(v => !v)}
          existingTasks={tasks}
          year={year}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Mine opgaver
              <span
                className="inline-flex items-center"
                title="Konkrete to-dos med specifik dato. Auto-genereres fra dine dyrkningsguides eller oprettes manuelt. Modsat 'Gøremål' der er sæsonbestemte ting."
              >
                <Info className="h-3 w-3 text-muted-foreground" />
              </span>
            </CardTitle>
          </CardHeader>
          <div className="px-5 pb-5">
            <TodoTabs tasks={tasks} />
          </div>
        </Card>

        <DetKanDuNu
          month={valgtMaaned}
          inventory={inventory}
          guides={guides}
          plants={plants}
        />
      </div>
    </div>
  )
}

function MaanedensGoeremaal({
  month, generalTasks, userTasks, visSkjulte, onToggleSkjulte, existingTasks, year,
}: {
  month: number
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  visSkjulte: boolean
  onToggleSkjulte: () => void
  existingTasks: CalendarTask[]
  year: number
}) {
  const monthName = MONTHS_DA[month - 1].full
  const generelleAlle = generalTasks.filter(g => g.month === month)
  const generelleSynlige = generelleAlle.filter(g => !g.isHiddenByMe)
  const generelleSkjulte = generelleAlle.filter(g => g.isHiddenByMe)
  const mine = userTasks.filter(u => u.month === month)
  const harSkjulte = generelleSkjulte.length > 0

  // Find hvilke general_task_ids brugeren allerede har tilføjet til kalender i indeværende år
  const yearStr = String(year)
  const tilfoejedeIds = new Set(
    existingTasks
      .filter(t => t.source === 'general' && t.sourceId && t.date.startsWith(yearStr))
      .map(t => t.sourceId as string)
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Gøremål — {monthName}
          <span
            className="inline-flex items-center"
            title="Sæsonbestemte ting man typisk gør hver måned. Klik et gøremål for at folde det ud og se detaljer eller tilføje det til Mine opgaver."
          >
            <Info className="h-3 w-3 text-muted-foreground" />
          </span>
        </CardTitle>
        <UserTaskDialog defaultMonth={month} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Havens gøremål */}
        {generelleSynlige.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Havens gøremål</p>
            {generelleSynlige.map(t => (
              <GeneralTaskCard
                key={t.id}
                task={t}
                alreadyAdded={tilfoejedeIds.has(t.id)}
                year={year}
              />
            ))}
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
                {generelleSkjulte.map(t => (
                  <GeneralTaskCard
                    key={t.id}
                    task={t}
                    alreadyAdded={tilfoejedeIds.has(t.id)}
                    year={year}
                  />
                ))}
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
