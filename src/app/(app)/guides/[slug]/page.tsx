export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GUIDE_CATEGORIES } from '@/lib/constants'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sun, Droplets, Snowflake, Ruler, ArrowDown } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

const SUN_LABELS: Record<string, string> = { full_sun: 'Fuld sol', partial_shade: 'Halvskygge', shade: 'Skygge' }
const WATER_LABELS: Record<string, string> = { low: 'Lavt', medium: 'Medium', high: 'Højt' }

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: guide } = await supabase
    .from('plant_guides')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!guide) notFound()

  const catMeta = GUIDE_CATEGORIES[guide.category as keyof typeof GUIDE_CATEGORIES]

  const timeline = [
    { label: 'Så indendørs', period: guide.sow_indoor_start && guide.sow_indoor_end ? `${guide.sow_indoor_start} – ${guide.sow_indoor_end}` : null },
    { label: 'Så udendørs', period: guide.sow_outdoor_start && guide.sow_outdoor_end ? `${guide.sow_outdoor_start} – ${guide.sow_outdoor_end}` : null },
    { label: 'Prikl ud', period: guide.prick_out_weeks_after_sow ? `${guide.prick_out_weeks_after_sow} uger efter såning` : null },
    { label: 'Plant ud', period: guide.plant_out_start && guide.plant_out_end ? `${guide.plant_out_start} – ${guide.plant_out_end}` : null },
    { label: 'Høst', period: guide.harvest_start && guide.harvest_end ? `${guide.harvest_start} – ${guide.harvest_end}` : null },
  ].filter((t) => t.period)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/guides">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{guide.name_da}</h1>
          {guide.name_en && <p className="text-sm text-muted-foreground italic">{guide.name_en}</p>}
        </div>
        {catMeta && <Badge className={catMeta.color}>{catMeta.label}</Badge>}
      </div>

      {guide.description && (
        <p className="text-sm text-foreground">{guide.description}</p>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {guide.sun_requirement && (
          <Card className="flex items-center gap-2 text-sm">
            <Sun className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sol</p>
              <p className="font-medium">{SUN_LABELS[guide.sun_requirement]}</p>
            </div>
          </Card>
        )}
        {guide.water_need && (
          <Card className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Vand</p>
              <p className="font-medium">{WATER_LABELS[guide.water_need]}</p>
            </div>
          </Card>
        )}
        <Card className="flex items-center gap-2 text-sm">
          <Snowflake className="h-4 w-4 text-cyan-500" />
          <div>
            <p className="text-xs text-muted-foreground">Frostfast</p>
            <p className="font-medium">{guide.frost_hardy ? 'Ja' : 'Nej'}</p>
          </div>
        </Card>
        {guide.spacing_cm && (
          <Card className="flex items-center gap-2 text-sm">
            <Ruler className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-muted-foreground">Afstand</p>
              <p className="font-medium">{guide.spacing_cm} cm</p>
            </div>
          </Card>
        )}
      </div>

      {guide.depth_cm != null && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowDown className="h-3.5 w-3.5" />
          Sådybde: {guide.depth_cm} cm
        </div>
      )}

      {timeline.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Kalender</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.map((t) => (
                <div key={t.label} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="font-medium text-foreground w-32">{t.label}</span>
                  <span className="text-muted-foreground">{t.period}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(guide.days_to_germination_min || guide.days_to_harvest_min) && (
        <Card>
          <CardHeader><CardTitle>Tidslinje</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {guide.days_to_germination_min && (
                <p>
                  <span className="text-muted-foreground">Spiretid:</span>{' '}
                  {guide.days_to_germination_min}–{guide.days_to_germination_max} dage
                </p>
              )}
              {guide.days_to_harvest_min && (
                <p>
                  <span className="text-muted-foreground">Tid til høst:</span>{' '}
                  {guide.days_to_harvest_min}–{guide.days_to_harvest_max} dage
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {guide.tips && (
        <Card>
          <CardHeader><CardTitle>Tips & Råd</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-line">{guide.tips}</p>
          </CardContent>
        </Card>
      )}

      {guide.companion_plants && guide.companion_plants.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Gode naboer</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {guide.companion_plants.map((slug: string) => (
                <Link key={slug} href={`/guides/${slug}`}>
                  <Badge className="bg-accent text-foreground hover:bg-primary/10 cursor-pointer">{slug}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}