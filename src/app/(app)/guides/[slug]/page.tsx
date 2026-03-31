export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GUIDE_CATEGORIES } from '@/lib/constants'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GuideUserNotes } from '@/components/guides/guide-user-notes'
import { CollapsibleSection } from '@/components/guides/collapsible-section'
import { GenerateGuideContentButton } from '@/components/guides/generate-guide-content-button'
import { GuideActions } from '@/components/guides/guide-actions'
import { GuideImages } from '@/components/guides/guide-images'
import {
  ArrowLeft, Sun, Droplets, Snowflake, Ruler, ArrowDown,
  Sprout, Flower2, Scissors, TreePine, Bug, AlertTriangle,
  Lightbulb, Calendar, Info, BookOpen, Camera, Sparkles
} from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

const SUN_LABELS: Record<string, string> = { full_sun: 'Fuld sol', partial_shade: 'Halvskygge', shade: 'Skygge' }
const WATER_LABELS: Record<string, string> = { low: 'Lavt', medium: 'Medium', high: 'Højt' }

function Callout({ type, children }: { type: 'tip' | 'warning' | 'mistake'; children: React.ReactNode }) {
  const styles = {
    tip: { bg: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800', icon: <Lightbulb className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />, label: 'Tip' },
    warning: { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />, label: 'Vær opmærksom' },
    mistake: { bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800', icon: <Info className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />, label: 'Typisk fejl' },
  }
  const s = styles[type]
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${s.bg}`}>
      {s.icon}
      <div className="text-sm">
        <span className="font-medium">{s.label}: </span>
        <span className="text-foreground/80">{children}</span>
      </div>
    </div>
  )
}

function Prose({ text }: { text: string }) {
  return <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{text}</div>
}

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

  const hasGrowingInfo = guide.sowing_info || guide.repotting_info || guide.planting_out_info || guide.care_info
  const hasBiology = guide.biology_info || (guide.companion_plants && guide.companion_plants.length > 0)

  return (
    <article className="max-w-2xl space-y-8">
      {/* ========== Header ========== */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/guides">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{guide.name_da}</h1>
            {guide.botanical_name && (
              <p className="text-sm text-muted-foreground italic mt-0.5">{guide.botanical_name}</p>
            )}
            {!guide.botanical_name && guide.name_en && (
              <p className="text-sm text-muted-foreground italic mt-0.5">{guide.name_en}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {catMeta && <Badge className={catMeta.color}>{catMeta.label}</Badge>}
            {guide.created_automatically && (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </div>

        {/* Profile image */}
        {guide.image_url && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={guide.image_url}
              alt={guide.name_da}
              className="w-full h-48 sm:h-64 object-cover"
            />
          </div>
        )}

        {guide.description && (
          <p className="text-base text-foreground/80 leading-relaxed mt-4">{guide.description}</p>
        )}

        {/* Edit / Delete */}
        <div className="mt-3">
          <GuideActions guide={guide} />
        </div>
      </div>

      {/* ========== Quick Reference ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {guide.sun_requirement && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <Sun className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sol</p>
              <p className="text-sm font-medium">{SUN_LABELS[guide.sun_requirement]}</p>
            </div>
          </div>
        )}
        {guide.water_need && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vand</p>
              <p className="text-sm font-medium">{WATER_LABELS[guide.water_need]}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20">
          <Snowflake className="h-5 w-5 text-cyan-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Frost</p>
            <p className="text-sm font-medium">{guide.frost_hardy ? 'Tåler frost' : 'Frostfølsom'}</p>
          </div>
        </div>
        {guide.spacing_cm && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
            <Ruler className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Afstand</p>
              <p className="text-sm font-medium">{guide.spacing_cm} cm</p>
            </div>
          </div>
        )}
      </div>

      {guide.depth_cm != null && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <ArrowDown className="h-3.5 w-3.5" />
          Sådybde: {guide.depth_cm} cm
        </p>
      )}

      {/* ========== Kalender / Tidslinje ========== */}
      {timeline.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground border-b border-border pb-2">
            <Calendar className="h-4 w-4 text-primary" />
            Årskalender
          </h2>
          <div className="space-y-3">
            {timeline.map((t, i) => (
              <div key={t.label} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className={`w-3 h-3 rounded-full ${i === timeline.length - 1 ? 'bg-green-500' : 'bg-primary'}`} />
                  {i < timeline.length - 1 && <span className="w-0.5 h-6 bg-border" />}
                </div>
                <div className="flex-1 flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                  <span className="text-sm text-muted-foreground">{t.period}</span>
                </div>
              </div>
            ))}
          </div>

          {(guide.days_to_germination_min || guide.days_to_harvest_min) && (
            <div className="flex gap-6 mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
              {guide.days_to_germination_min && (
                <span>Spiretid: <strong className="text-foreground">{guide.days_to_germination_min}–{guide.days_to_germination_max} dage</strong></span>
              )}
              {guide.days_to_harvest_min && (
                <span>Tid til høst: <strong className="text-foreground">{guide.days_to_harvest_min}–{guide.days_to_harvest_max} dage</strong></span>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========== Collapsible Prose Sections ========== */}
      {guide.sowing_info && (
        <CollapsibleSection
          icon={<Sprout className="h-4 w-4 text-green-600" />}
          title="Såning og etablering"
          defaultOpen
        >
          <Prose text={guide.sowing_info} />
        </CollapsibleSection>
      )}

      {guide.repotting_info && (
        <CollapsibleSection
          icon={<Flower2 className="h-4 w-4 text-purple-600" />}
          title="Ompotning"
        >
          <Prose text={guide.repotting_info} />
        </CollapsibleSection>
      )}

      {guide.planting_out_info && (
        <CollapsibleSection
          icon={<TreePine className="h-4 w-4 text-emerald-600" />}
          title="Udplantning"
        >
          <Prose text={guide.planting_out_info} />
        </CollapsibleSection>
      )}

      {guide.care_info && (
        <CollapsibleSection
          icon={<Scissors className="h-4 w-4 text-orange-600" />}
          title="Vækst og pasning"
        >
          <Prose text={guide.care_info} />
        </CollapsibleSection>
      )}

      {guide.environment_info && (
        <CollapsibleSection
          icon={<Sun className="h-4 w-4 text-amber-600" />}
          title="Miljø og voksested"
        >
          <Prose text={guide.environment_info} />
        </CollapsibleSection>
      )}

      {hasBiology && (
        <CollapsibleSection
          icon={<Bug className="h-4 w-4 text-rose-600" />}
          title="Biologi og relationer"
        >
          {guide.biology_info && <Prose text={guide.biology_info} />}
          {guide.companion_plants && guide.companion_plants.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-foreground mb-2">Gode naboer (companion planting)</p>
              <div className="flex gap-2 flex-wrap">
                {guide.companion_plants.map((cp: string) => (
                  <Link key={cp} href={`/guides/${cp}`}>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors">{cp}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ========== Frøinformation ========== */}
      {(guide.seed_type || guide.seed_harvest_possible != null) && (
        <CollapsibleSection
          icon={<Sprout className="h-4 w-4 text-teal-600" />}
          title="Frøinformation"
        >
          <div className="text-sm space-y-1">
            {guide.seed_type && <p><span className="text-muted-foreground">Frøtype:</span> {guide.seed_type}</p>}
            {guide.seed_harvest_possible != null && (
              <p><span className="text-muted-foreground">Frøhøst mulig:</span> {guide.seed_harvest_possible ? 'Ja' : 'Nej'}</p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* ========== Callouts ========== */}
      {guide.tips && <Callout type="tip">{guide.tips}</Callout>}
      {guide.warnings && <Callout type="warning">{guide.warnings}</Callout>}
      {guide.common_mistakes && <Callout type="mistake">{guide.common_mistakes}</Callout>}

      {/* ========== Billeder ========== */}
      <section className="space-y-3 pt-4 border-t border-border">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Camera className="h-4 w-4 text-primary" />
          Billeder
        </h2>
        <p className="text-xs text-muted-foreground">
          Tilføj egne billeder — spiringsstadier, sygdomme, høst, referencefotos.
        </p>
        <GuideImages guideId={guide.id} images={guide.user_images ?? []} />
      </section>

      {/* ========== Brugernoter ========== */}
      <section className="space-y-3 pt-4 border-t border-border">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          Mine noter
        </h2>
        <p className="text-xs text-muted-foreground">
          Tilføj dine egne erfaringer og observationer. Disse noter er adskilt fra guiden og overskriver ikke AI-genereret indhold.
        </p>
        <GuideUserNotes guideId={guide.id} initialNotes={guide.user_notes ?? ''} />
      </section>

      {/* ========== Fallback / Generate ========== */}
      {!hasGrowingInfo && !hasBiology && !guide.tips && !guide.warnings && !guide.common_mistakes && (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">Denne guide har endnu ikke detaljerede sektioner.</p>
          <GenerateGuideContentButton
            guideId={guide.id}
            guideName={guide.name_da}
            guideCategory={guide.category}
          />
        </div>
      )}
    </article>
  )
}
