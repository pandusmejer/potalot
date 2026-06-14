import type { DetailMaal } from '@/data/plant-detail'
import { Heart, Ruler, Sprout } from 'lucide-react'

const sans = 'var(--font-manrope)'

/**
 * PLANTE-MÅL — fire rolige instrument-tal (Status · Alder · Højde · Sundhed).
 *
 * Spec'en advarer mod "KPI-kort" og dashboards. Derfor: ét varmt papir-
 * panel, ikke fire bokse; ikonerne er sarte og grå; tallene er stille.
 * Det skal læses som et måleinstrument på et havekort, ikke som metrics.
 * Status og sundhed bærer et lille farve-signal (grøn prik / hjerte).
 */
export function PlantMaal({ maal }: { maal: DetailMaal }) {
  const felter = [
    {
      label: 'Status',
      value: maal.statusValue,
      note: maal.statusNote,
      dot: '#617345',
      Icon: null,
    },
    { label: 'Alder', value: maal.alderValue, note: maal.alderNote, Icon: Sprout },
    { label: 'Højde', value: maal.hoejdeValue, note: maal.hoejdeNote, Icon: Ruler },
    {
      label: 'Sundhed',
      value: maal.sundhedValue,
      note: maal.sundhedNote,
      Icon: Heart,
      heart: true,
    },
  ]

  return (
    <section
      className="relative mt-3 flex items-stretch overflow-hidden rounded-[22px]"
      style={{
        background: 'var(--card)',
        border: '1px solid rgba(36,48,31,0.08)',
        boxShadow: '0 14px 32px rgba(26,34,22,0.10)',
        padding: '15px 6px',
      }}
    >
      {felter.map((f, i) => {
        const Icon = f.Icon
        return (
          <div key={f.label} className="relative flex flex-1 flex-col px-2 min-w-0">
            {i > 0 && (
              <span
                aria-hidden
                className="absolute left-0 top-1 bottom-1 w-px"
                style={{ background: 'rgba(36,48,31,0.08)' }}
              />
            )}
            <span
              className="flex items-center gap-1 uppercase"
              style={{
                fontFamily: sans,
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'rgba(36,48,31,0.46)',
              }}
            >
              {Icon && <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />}
              {f.label}
            </span>
            <span className="mt-1.5 flex items-center gap-1.5">
              {f.dot && (
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: f.dot }}
                />
              )}
              {f.heart && (
                <Heart
                  className="h-3.5 w-3.5 shrink-0"
                  strokeWidth={2}
                  style={{ color: '#617345' }}
                  aria-hidden
                />
              )}
              <span
                className="whitespace-nowrap"
                style={{
                  fontFamily: sans,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: '#24301F',
                }}
              >
                {f.value}
              </span>
            </span>
            <span
              className="mt-0.5 whitespace-nowrap"
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 400,
                color: 'rgba(36,48,31,0.50)',
              }}
            >
              {f.note}
            </span>
          </div>
        )
      })}
    </section>
  )
}
