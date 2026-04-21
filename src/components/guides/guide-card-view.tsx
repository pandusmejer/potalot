import { Badge } from '@/components/ui/badge'
import { GUIDE_CATEGORIES } from '@/lib/constants'
import type { PlantGuide } from '@/lib/types'
import {
  Sun, Droplets, Snowflake, Ruler, ArrowDown,
  Calendar, Sprout, Scissors, TreePine, Lightbulb,
  AlertTriangle,
} from 'lucide-react'

/**
 * "Bilkort" quick-view til en guide.
 * Én skærm, scanbar info — tiltænkt brug i haven på telefon.
 * Kun overskrifter og nøgletal, ingen lange tekster.
 */

const SUN_LABELS: Record<string, string> = { full_sun: 'Fuld sol', partial_shade: 'Halvskygge', shade: 'Skygge' }
const WATER_LABELS: Record<string, string> = { low: 'Lavt', medium: 'Medium', high: 'Højt' }

export function GuideCardView({ guide }: { guide: PlantGuide }) {
  const catMeta = GUIDE_CATEGORIES[guide.category as keyof typeof GUIDE_CATEGORIES]

  const dates = [
    { label: 'Så inde', period: guide.sow_indoor_start && guide.sow_indoor_end ? `${guide.sow_indoor_start}–${guide.sow_indoor_end}` : null },
    { label: 'Så ude', period: guide.sow_outdoor_start && guide.sow_outdoor_end ? `${guide.sow_outdoor_start}–${guide.sow_outdoor_end}` : null },
    { label: 'Plant ud', period: guide.plant_out_start && guide.plant_out_end ? `${guide.plant_out_start}–${guide.plant_out_end}` : null },
    { label: 'Høst', period: guide.harvest_start && guide.harvest_end ? `${guide.harvest_start}–${guide.harvest_end}` : null },
  ].filter(d => d.period)

  return (
    <div className="max-w-sm mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {guide.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={guide.image_url}
            alt={guide.name_da}
            className="h-16 w-16 rounded-lg object-cover border border-border bg-amber-50/30 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl text-foreground leading-tight">{guide.name_da}</h1>
          {guide.botanical_name && (
            <p className="text-xs italic text-muted-foreground">{guide.botanical_name}</p>
          )}
          {catMeta && <Badge className={`${catMeta.color} mt-1.5`}>{catMeta.label}</Badge>}
        </div>
      </div>

      {/* Kvik-ikoner */}
      <div className="grid grid-cols-4 gap-2">
        <IconStat icon={<Sun className="h-4 w-4" />} value={guide.sun_requirement ? SUN_LABELS[guide.sun_requirement] : '—'} label="Sol" />
        <IconStat icon={<Droplets className="h-4 w-4" />} value={guide.water_need ? WATER_LABELS[guide.water_need] : '—'} label="Vand" />
        <IconStat icon={<Snowflake className="h-4 w-4" />} value={guide.frost_hardy ? 'Ja' : 'Nej'} label="Frosthård" />
        <IconStat icon={<Ruler className="h-4 w-4" />} value={guide.spacing_cm ? `${guide.spacing_cm} cm` : '—'} label="Afstand" />
      </div>

      {/* Sådybde */}
      {guide.depth_mm != null && (
        <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-muted/50">
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Sådybde:</span>
          <span className="text-foreground font-medium">
            {guide.depth_mm === 0 ? 'Overfladen' : `${guide.depth_mm} mm`}
          </span>
        </div>
      )}

      {/* Kalender-compact */}
      {dates.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Kalender
          </div>
          {dates.map((d, i) => (
            <div key={d.label} className={`flex items-center justify-between px-3 py-1.5 text-sm ${i < dates.length - 1 ? 'border-b border-border' : ''}`}>
              <span className="text-muted-foreground">{d.label}</span>
              <span className="text-foreground font-medium">{d.period}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dage til */}
      {(guide.days_to_germination_min || guide.days_to_harvest_min) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {guide.days_to_germination_min && (
            <div className="px-3 py-2 rounded-lg bg-muted/40">
              <p className="text-muted-foreground">Spiretid</p>
              <p className="text-foreground font-medium mt-0.5">
                {guide.days_to_germination_min}–{guide.days_to_germination_max} dage
              </p>
            </div>
          )}
          {guide.days_to_harvest_min && (
            <div className="px-3 py-2 rounded-lg bg-muted/40">
              <p className="text-muted-foreground">Tid til høst</p>
              <p className="text-foreground font-medium mt-0.5">
                {guide.days_to_harvest_min}–{guide.days_to_harvest_max} dage
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top-3 tips */}
      {guide.tips && (
        <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm flex gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-foreground/80 leading-snug">{truncate(guide.tips, 120)}</p>
        </div>
      )}

      {/* Advarsel kort */}
      {guide.warnings && (
        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-foreground/80 leading-snug">{truncate(guide.warnings, 100)}</p>
        </div>
      )}

      {/* Companions */}
      {guide.companion_plants && guide.companion_plants.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center text-xs">
          <TreePine className="h-3 w-3 text-green-600" />
          <span className="text-muted-foreground">Gode naboer:</span>
          {guide.companion_plants.slice(0, 4).map(cp => (
            <span key={cp} className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">{cp}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function IconStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-muted/40">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-foreground font-medium text-center leading-tight">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max).trim() + '…'
}

// Re-export for use in guide page with toggle
export { GuideCardView as Default }
