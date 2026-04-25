import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LIGHT_META, WATER_META, DIFFICULTY_META, MONTHS_DA } from '@/lib/constants'
import type { Guide } from '@/lib/types'
import {
  Sun, Droplets, Snowflake, Ruler, ArrowDown, Calendar, Star,
  ThermometerSun, Sprout, TreePine, Wheat,
} from 'lucide-react'

interface Props {
  guide: Guide
  /** Hvilke felter er arvet fra parent (vises diskret) */
  inheritedFields?: Set<string>
}

/**
 * "Hurtigt overblik" — quick card til toppen af guide-detail.
 * Én skærm, scanbar, alt det vigtigste.
 */
export function QuickFactsCard({ guide, inheritedFields }: Props) {
  const qf = guide.quickFacts
  const difficultyMeta = DIFFICULTY_META[guide.difficulty]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Hurtigt overblik</CardTitle>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{difficultyMeta.label}</span>
            <span className="inline-flex">
              {Array.from({ length: difficultyMeta.stars }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
              {Array.from({ length: 3 - difficultyMeta.stars }).map((_, i) => (
                <Star key={`e${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
              ))}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground mb-4 leading-relaxed">{guide.summary}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {qf.preCultivation !== undefined && (
            <Fact
              label="Forspiring"
              value={qf.preCultivation ? 'Ja' : 'Nej'}
              icon={<Sprout className="h-3.5 w-3.5" />}
            />
          )}
          {qf.sowingMonths.length > 0 && (
            <Fact
              label="Såning"
              value={formatMonths(qf.sowingMonths)}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
          )}
          {qf.directSowingMonths.length > 0 && (
            <Fact
              label="Direkte såning"
              value={formatMonths(qf.directSowingMonths)}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
          )}
          {qf.sowingDepthMm !== undefined && (
            <Fact
              label="Sådybde"
              value={qf.sowingDepthMm === 0 ? '0 mm (overflade)' : `${qf.sowingDepthMm} mm`}
              icon={<ArrowDown className="h-3.5 w-3.5" />}
            />
          )}
          {qf.plantingOutMonths.length > 0 && (
            <Fact
              label="Plant ud"
              value={formatMonths(qf.plantingOutMonths)}
              icon={<TreePine className="h-3.5 w-3.5" />}
            />
          )}
          {qf.harvestMonths.length > 0 && (
            <Fact
              label="Høst"
              value={formatMonths(qf.harvestMonths)}
              icon={<Wheat className="h-3.5 w-3.5" />}
            />
          )}
          {qf.light && (
            <Fact
              label="Lys"
              value={LIGHT_META[qf.light].label}
              icon={<Sun className="h-3.5 w-3.5" />}
            />
          )}
          {qf.water && (
            <Fact
              label="Vand"
              value={WATER_META[qf.water].label}
              icon={<Droplets className="h-3.5 w-3.5" />}
            />
          )}
          {qf.soil && <Fact label="Jord" value={qf.soil} />}
          {qf.germinationTemperature && (
            <Fact
              label="Spiretemp"
              value={qf.germinationTemperature}
              icon={<ThermometerSun className="h-3.5 w-3.5" />}
            />
          )}
          {qf.germinationDays && (
            <Fact label="Spiretid" value={`${qf.germinationDays} dage`} />
          )}
          {qf.plantSpacing && (
            <Fact label="Afstand" value={qf.plantSpacing} icon={<Ruler className="h-3.5 w-3.5" />} />
          )}
          {qf.rowSpacing && <Fact label="Rækkeafstand" value={qf.rowSpacing} />}
          {qf.frostSensitive && (
            <Fact
              label="Frost"
              value="Følsom"
              icon={<Snowflake className="h-3.5 w-3.5 text-blue-600" />}
            />
          )}
          {qf.minimumTemperature && (
            <Fact label="Min. temp" value={qf.minimumTemperature} />
          )}
        </div>

        {guide.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-4 pt-3 border-t border-border">
            {guide.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
          </div>
        )}

        {inheritedFields && inheritedFields.size > 0 && (
          <p className="text-xs text-muted-foreground italic mt-3">
            Visse felter kommer fra arts-guiden.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return '—'
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].full
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
