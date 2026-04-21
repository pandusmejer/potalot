export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlantActions } from '@/components/plant/plant-actions'
import { PlantTimeline } from '@/components/plant/plant-timeline'
import { livscyklusVenligt } from '@/lib/sprog'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Sparkles, MapPin, Sprout } from 'lucide-react'
import type { Livscyklus, Placering, PlantEvent } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlantDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const { data: plant } = await supabase
    .from('plants')
    .select(`
      *,
      guide:plant_guides(*),
      seed:seeds(name, variety),
      variety_ref:varieties(*),
      placering:placeringer(*),
      garden:gardens(name)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!plant) notFound()

  // Tidslinje events
  const { data: events } = await supabase
    .from('plant_events')
    .select('*')
    .eq('plant_id', id)
    .order('event_date', { ascending: false })
    .order('event_time', { ascending: false })

  // Åbne opgaver
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description, task_type, due_date, priority')
    .eq('plant_id', id)
    .is('completed_at', null)
    .order('due_date', { ascending: true })

  // Placeringer (for action dialogs)
  const { data: placeringer } = await supabase
    .from('placeringer')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  const livscyklus = (plant.livscyklus as Livscyklus) ?? 'planlagt'
  const senesteEvent = events?.[0]?.event_date
  const placering = plant.placering as Placering | null

  return (
    <article className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/have">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif text-foreground truncate">
            {plant.name}
          </h1>
          {plant.variety && (
            <p className="text-sm text-muted-foreground italic font-serif">{plant.variety}</p>
          )}
        </div>
        <Badge className="bg-primary/10 text-primary">
          {livscyklusVenligt(livscyklus, senesteEvent)}
        </Badge>
      </div>

      {/* Hurtig-info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        {placering && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {placering.name}
          </span>
        )}
        {plant.quantity > 1 && (
          <span className="inline-flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5" />
            {plant.quantity} planter
          </span>
        )}
      </div>

      {/* Handlings-knapper */}
      <Card>
        <CardHeader>
          <CardTitle>Hvad nu?</CardTitle>
        </CardHeader>
        <CardContent>
          <PlantActions
            plantId={plant.id}
            livscyklus={livscyklus}
            placeringer={placeringer ?? []}
            currentPlaceringId={plant.placering_id}
          />
        </CardContent>
      </Card>

      {/* Kommende opgaver */}
      {tasks && tasks.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Kommende opgaver</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.due_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tidslinje */}
      <Card>
        <CardHeader>
          <CardTitle>Tidslinje</CardTitle>
        </CardHeader>
        <CardContent>
          <PlantTimeline events={(events ?? []) as PlantEvent[]} />
        </CardContent>
      </Card>

      {/* Dyrkningsguide */}
      {plant.guide && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Dyrkningsguide
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plant.guide.description && (
              <p className="text-sm mb-3">{plant.guide.description}</p>
            )}
            {plant.guide.tips && (
              <p className="text-sm text-muted-foreground italic">{plant.guide.tips}</p>
            )}
            <Link href={`/guides/${plant.guide.slug}`} className="text-sm text-primary hover:underline mt-3 inline-block">
              Se fuld guide →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* AI-rådgiver */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-3 py-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Spørg om denne plante</p>
            <p className="text-xs text-muted-foreground">Få hjælp baseret på tidslinjen og guiden</p>
          </div>
          <Link href={`/ai?plantId=${plant.id}`}>
            <Button size="sm" variant="secondary">Spørg</Button>
          </Link>
        </CardContent>
      </Card>
    </article>
  )
}
