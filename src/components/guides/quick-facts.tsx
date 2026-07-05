import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LIGHT_META, WATER_META, DIFFICULTY_META, MONTHS_DA } from '@/lib/constants'
import type { Guide } from '@/lib/types'
import {
  Sun, Droplets, Calendar, Sprout, TreePine, Wheat, ChevronDown,
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
          <CardTitle
            style={{
              fontFamily: 'var(--font-plex-condensed), sans-serif',
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: '-0.01em',
            }}
          >
            Hurtigt overblik
          </CardTitle>
          {guide.difficulty && (
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${difficultyMeta.chipClass}`}>
              {difficultyMeta.label}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary er flyttet op i guide-toppen som sort-dom (ingen dublet her). */}
        {/* Primære nøglefakta — de beslutningskritiske, altid synlige. Kortet
            fylder mindre vertikalt; resten ligger i "Flere detaljer". */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {qf.growthType && (
            <Fact label="Vækstform" value={qf.growthType} />
          )}
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
          {qf.maturityDays && (
            <Fact
              label="Modning"
              value={qf.maturityDays}
              icon={<Calendar className="h-3.5 w-3.5" />}
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
        </div>

        {/* Sekundære detaljer — foldet væk som editorial undersektion, ikke endnu
            et tæt ikon-grid. Grupperet i Dyrkning/Forhold/Planten med rolige
            tekst-eyebrows; INGEN ikon pr. felt (labels bærer betydningen). Én
            soft glyph som markør ved "Flere detaljer" (option B — vi har kun
            plante.png; 3 gruppe-glyffer venter på sprout/leaf/fruit-uploads).
            Native <details>, ingen JS i denne server-component. */}
        {hasSecondary(qf) && (() => {
          const grupper = [
            {
              titel: 'Dyrkning',
              felter: [
                qf.germinationDays && {
                  label: 'Spiretid',
                  value: /dage/i.test(qf.germinationDays) ? qf.germinationDays : `${qf.germinationDays} dage`,
                },
                qf.germinationTemperature && { label: 'Spiretemp', value: qf.germinationTemperature },
                qf.directSowingMonths.length > 0 && { label: 'Direkte såning', value: formatMonths(qf.directSowingMonths) },
                qf.sowingDepthMm !== undefined && {
                  label: 'Sådybde',
                  value: qf.sowingDepthMm === 0 ? '0 mm (overflade)' : `${qf.sowingDepthMm} mm`,
                },
              ],
            },
            {
              titel: 'Forhold',
              felter: [
                // Jord er ofte den længste værdi — får fuld bredde (egen linje),
                // så den ikke bliver en høj, dominerende venstre-kolonne-mur.
                qf.soil && { label: 'Jord', value: qf.soil, wide: true },
                // Frost følger kortets oliven-univers via label (ingen blå snefnug).
                qf.frostSensitive && { label: 'Frost', value: 'Følsom' },
                qf.minimumTemperature && { label: 'Min. temp', value: qf.minimumTemperature },
              ],
            },
            {
              titel: 'Planten',
              felter: [
                qf.height && { label: 'Højde', value: qf.height },
                qf.primaryUse && { label: 'Anvendelse', value: qf.primaryUse },
                qf.plantSpacing && { label: 'Afstand', value: qf.plantSpacing },
                qf.rowSpacing && { label: 'Rækkeafstand', value: qf.rowSpacing },
              ],
            },
          ]
            .map(g => ({
              titel: g.titel,
              felter: g.felter.filter(
                (f): f is { label: string; value: string; wide?: boolean } => Boolean(f),
              ),
            }))
            .filter(g => g.felter.length > 0)

          return (
            <details className="group mt-3 border-t border-border pt-3">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-primary [&::-webkit-details-marker]:hidden">
                {/* Soft glyph = næsten vandmærke; pilen er den primære markør. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/glyphs/plante.png" alt="" aria-hidden style={{ height: 16, width: 'auto', opacity: 0.22 }} />
                Flere detaljer
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 space-y-3.5">
                {grupper.map(g => (
                  <div key={g.titel}>
                    {/* Gruppetitler guider, men skal ikke ligne nye kapitler:
                        mindre, lettere vægt, dæmpet salvie. */}
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(127,143,106,0.72)]" style={{ fontFamily: 'var(--font-manrope)' }}>
                      {g.titel}
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
                      {g.felter.map(f => (
                        <Fact
                          key={f.label}
                          label={f.label}
                          value={f.value}
                          className={f.wide ? 'col-span-full' : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )
        })()}

        {guide.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pb-1 pt-3">
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

function Fact({
  label,
  value,
  icon,
  className,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ''}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1" style={{ fontFamily: 'var(--font-manrope)' }}>
        {icon}
        {label}
      </span>
      <span className="text-sm text-foreground font-medium" style={{ fontFamily: 'var(--font-manrope)' }}>{value}</span>
    </div>
  )
}

/** Er der overhovedet sekundære felter at folde ud? Ellers skjules folden. */
function hasSecondary(qf: Guide['quickFacts']): boolean {
  return Boolean(
    qf.soil ||
      qf.germinationDays ||
      qf.primaryUse ||
      qf.height ||
      qf.directSowingMonths.length > 0 ||
      qf.sowingDepthMm !== undefined ||
      qf.germinationTemperature ||
      qf.plantSpacing ||
      qf.rowSpacing ||
      qf.frostSensitive ||
      qf.minimumTemperature,
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return '—'
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].full
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
