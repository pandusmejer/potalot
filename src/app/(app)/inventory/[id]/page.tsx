export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PLANT_STATUSES, type PlantStatus } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Sparkles, StickyNote } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlantDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const { data: plant } = await supabase
    .from('plants')
    .select('*, guide:plant_guides(*), seed:seeds(name, variety)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!plant) notFound()

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, note_date, content')
    .eq('plant_id', id)
    .order('note_date', { ascending: false })
    .limit(10)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, task_type, due_date, completed_at')
    .eq('plant_id', id)
    .order('due_date', { ascending: false })
    .limit(10)

  const statusMeta = PLANT_STATUSES[plant.status as PlantStatus]

  const timeline = [
    { label: 'Sået', date: plant.sow_date },
    { label: 'Spiret', date: plant.germination_date },
    { label: 'Priklet', date: plant.prick_date },
    { label: 'Plantet ud', date: plant.plant_out_date },
    { label: 'Første høst', date: plant.first_harvest_date },
  ].filter((t) => t.date)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{plant.name}</h1>
          {plant.variety && <p className="text-sm text-muted-foreground">{plant.variety}</p>}
        </div>
        {statusMeta && <Badge className={statusMeta.color}>{statusMeta.label}</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Detaljer</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {plant.location && <div><dt className="text-muted-foreground">Placering</dt><dd>{plant.location}</dd></div>}
              {plant.quantity > 1 && <div><dt className="text-muted-foreground">Antal</dt><dd>{plant.quantity}</dd></div>}
              {plant.seed && <div><dt className="text-muted-foreground">Fra frø</dt><dd>{plant.seed.name}{plant.seed.variety ? ` — ${plant.seed.variety}` : ''}</dd></div>}
              {plant.notes && <div><dt className="text-muted-foreground">Noter</dt><dd>{plant.notes}</dd></div>}
            </dl>
          </CardContent>
        </Card>

        {timeline.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Tidslinje</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline.map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-foreground">{t.label}</span>
                    <span className="text-muted-foreground ml-auto">{formatDate(t.date!)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {plant.guide && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Dyrkningsguide — {plant.guide.name_da}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">{plant.guide.description}</p>
            {plant.guide.tips && (
              <p className="text-sm text-muted-foreground">{plant.guide.tips}</p>
            )}
            <Link href={`/guides/${plant.guide.slug}`} className="text-sm text-primary hover:underline mt-2 inline-block">
              Se fuld guide
            </Link>
          </CardContent>
        </Card>
      )}

      {tasks && tasks.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Opgaver</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${task.completed_at ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span className={task.completed_at ? 'line-through text-muted-foreground' : 'text-foreground'}>{task.title}</span>
                  <span className="text-muted-foreground ml-auto">{formatDate(task.due_date)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {notes && notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Noter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notes.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`} className="block hover:bg-muted rounded-lg p-2 -mx-2 transition-colors">
                  <p className="text-sm font-medium text-foreground">{note.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(note.note_date)}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-3 py-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Spørg AI om denne plante</p>
            <p className="text-xs text-muted-foreground">Få råd baseret på dine data og dyrkningsguiden</p>
          </div>
          <Link href={`/ai?plantId=${plant.id}`}>
            <Button size="sm">Spørg AI</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}