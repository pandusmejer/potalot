import type { DetailMilestone } from '@/data/plant-detail'
import {
  Apple,
  Bean,
  Leaf,
  Shrub,
  Sprout,
  type LucideIcon,
} from 'lucide-react'

const sans = 'var(--font-manrope)'

const MILESTONE_ICON: Record<DetailMilestone['ikon'], LucideIcon> = {
  fro: Bean,
  spire: Sprout,
  blad: Leaf,
  plante: Shrub,
  frugt: Apple,
}

const GREEN = '#617345'

/**
 * TIDSLINJE — plantens livshistorie som ét vandret spor.
 *
 * Spec: "Historie, ikke diagram. Ikke statistik." Hver milepæl er en
 * lille ikon-node på et spor; nåede stadier er fyldt grønne, det
 * kommende (Første høst) står som en stiplet, ventende node, og sporet
 * derhen er stiplet — så øjet ser at rejsen ikke er færdig endnu.
 */
export function PlantTidslinje({ milestones }: { milestones: DetailMilestone[] }) {
  const n = milestones.length

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'rgba(36,48,31,0.52)',
          }}
        >
          Tidslinje
        </h2>
        <span
          className="flex items-center gap-1"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.50)',
          }}
        >
          Se alle <span aria-hidden>→</span>
        </span>
      </div>

      <ol className="mt-5 flex items-start">
        {milestones.map((m, i) => {
          const Icon = MILESTONE_ICON[m.ikon]
          const done = m.dato !== null
          // Et segment (i-1 → i) er nået, hvis milepæl i er nået.
          const leftReached = i > 0 && milestones[i].dato !== null
          const rightReached = i < n - 1 && milestones[i + 1].dato !== null

          return (
            <li key={m.label} className="flex flex-1 flex-col items-center">
              {/* Spor + node */}
              <div className="relative flex h-11 w-full items-center justify-center">
                {/* venstre segment */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute left-0 right-1/2 top-1/2"
                    style={segmentStyle(leftReached)}
                  />
                )}
                {/* højre segment */}
                {i < n - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 right-0 top-1/2"
                    style={segmentStyle(rightReached)}
                  />
                )}
                {/* node */}
                <span
                  className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full"
                  style={
                    done
                      ? { background: GREEN, color: '#F4F7EE' }
                      : {
                          background: 'var(--background)',
                          color: 'rgba(36,48,31,0.40)',
                          border: '1.5px dashed rgba(97,115,69,0.55)',
                        }
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
              </div>

              {/* dato + label */}
              <p
                className="mt-2 text-center"
                style={{
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: done ? '#24301F' : 'rgba(36,48,31,0.40)',
                }}
              >
                {m.dato ?? '—'}
              </p>
              <p
                className="text-center"
                style={{
                  fontFamily: sans,
                  fontSize: 11.5,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: 'rgba(36,48,31,0.58)',
                  marginTop: 1,
                }}
              >
                {m.label}
              </p>
              {m.note && (
                <p
                  className="text-center"
                  style={{
                    fontFamily: sans,
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: 'rgba(36,48,31,0.42)',
                    marginTop: 1,
                  }}
                >
                  {m.note}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Spor-segment: nået → solid grøn; kommende → stiplet grøn. */
function segmentStyle(reached: boolean): React.CSSProperties {
  if (reached) {
    return { height: 2, background: GREEN, marginTop: -1 }
  }
  return {
    height: 0,
    marginTop: -1,
    borderTop: '2px dashed rgba(97,115,69,0.45)',
  }
}
