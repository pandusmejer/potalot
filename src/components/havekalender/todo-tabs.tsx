'use client'

import { useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TaskRow } from '@/components/overblik/task-row'
import { EmptyState } from '@/components/ui/empty-state'
import { ListChecks, CalendarCheck } from 'lucide-react'
import type { CalendarTask } from '@/lib/types'
import { erIDag, erForsinket, erForsinketOpgave, idag } from '@/lib/datetime'

interface Props {
  tasks: CalendarTask[]
}

/**
 * To-do tabs: I dag / Denne uge / Denne måned / Forsinket / Afsluttet.
 */
export function TodoTabs({ tasks }: Props) {
  const aaben = useMemo(() => tasks.filter(t => t.status === 'open'), [tasks])

  const idagsListe   = aaben.filter(t => erIDag(t.date))
  const ugensListe   = aaben.filter(t => erIDag(t.date) || (!erForsinket(t.date) && erInden(t.date, 7)))
  const maanedListe  = aaben.filter(t => erIDag(t.date) || (!erForsinket(t.date) && erInden(t.date, 30)))
  const forsinkede   = aaben.filter(t => erForsinketOpgave(t.date, t.createdAt))
  const afsluttede   = tasks.filter(t => t.status === 'completed').slice(0, 20)

  function renderList(list: CalendarTask[], emptyTitle: string, emptyDescription: string) {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      )
    }
    return (
      <div className="space-y-2">
        {list.map(t => <TaskRow key={t.id} task={t} />)}
      </div>
    )
  }

  return (
    <Tabs defaultValue="idag">
      <TabsList className="w-full overflow-x-auto h-auto flex-wrap sm:flex-nowrap">
        <TabsTrigger value="idag">I dag <span className="ml-1.5 text-xs opacity-60">({idagsListe.length})</span></TabsTrigger>
        <TabsTrigger value="uge">Denne uge <span className="ml-1.5 text-xs opacity-60">({ugensListe.length})</span></TabsTrigger>
        <TabsTrigger value="maaned">Denne måned <span className="ml-1.5 text-xs opacity-60">({maanedListe.length})</span></TabsTrigger>
        {forsinkede.length > 0 && (
          <TabsTrigger value="forsinket" className="text-destructive">
            Forsinket <span className="ml-1.5 text-xs opacity-60">({forsinkede.length})</span>
          </TabsTrigger>
        )}
        <TabsTrigger value="afsluttet">Afsluttet <span className="ml-1.5 text-xs opacity-60">({afsluttede.length})</span></TabsTrigger>
      </TabsList>

      <TabsContent value="idag">
        {renderList(idagsListe, 'Ingen opgaver i dag', 'Nyd kaffen.')}
      </TabsContent>
      <TabsContent value="uge">
        {renderList(ugensListe, 'Roligt program i denne uge', 'Intet på listen — pust ud.')}
      </TabsContent>
      <TabsContent value="maaned">
        {renderList(maanedListe, 'Tomt indtil videre i denne måned', 'Inspirer dig længere nede med "det kan du så".')}
      </TabsContent>
      <TabsContent value="forsinket">
        {renderList(forsinkede, 'Intet er forsinket', 'Du har styr på det hele.')}
      </TabsContent>
      <TabsContent value="afsluttet">
        {afsluttede.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-8 w-8" />}
            title="Ingen afsluttede opgaver endnu"
            description="Når du markerer opgaver som udført, dukker de op her."
          />
        ) : (
          <div className="space-y-2">{afsluttede.map(t => <TaskRow key={t.id} task={t} compact />)}</div>
        )}
      </TabsContent>
    </Tabs>
  )
}

function erInden(date: string, dage: number): boolean {
  const today = new Date(idag())
  const target = new Date(date)
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= dage
}
