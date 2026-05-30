/**
 * Kalender-kobling — viser hvilke aktiviteter denne guide vil generere
 * i brugerens kalender, hvis guiden følges.
 *
 * Lukker kredsløbet Frøbank → Guides → Planter → Kalender → Havebog.
 *
 * Guides ejer IKKE kalender-handlinger. Guides forklarer hvad der
 * KOMMER til at ske — det er kalenderens ejerskab at faktisk lægge
 * opgaverne ind. Derfor: ren informativ liste, ingen handlings-knapper.
 */

import type { GuideCalendarRule } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const MAANEDER_KORT = [
  'jan', 'feb', 'marts', 'april', 'maj', 'juni',
  'juli', 'aug', 'sep', 'okt', 'nov', 'dec',
]

interface Props {
  rules: GuideCalendarRule[]
}

export function KalenderKobling({ rules }: Props) {
  if (rules.length === 0) return null

  return (
    <section className="space-y-4">
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
        }}
      >
        Rytme i kalenderen
      </p>
      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: 1.5,
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
          maxWidth: 460,
        }}
      >
        Når du følger denne guide:
      </p>

      <ul
        style={{ margin: 0, padding: 0, listStyle: 'none' }}
        className="space-y-2"
      >
        {rules.map((r, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3"
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(123,148,96,0.07)',
              border: '1px solid rgba(123,148,96,0.18)',
            }}
          >
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#7B9460',
                transform: 'translateY(-1px)',
              }}
            />
            <div className="min-w-0 flex-1">
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: '#24301F',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {r.title}
              </p>
              {r.recommendedMonths && r.recommendedMonths.length > 0 && (
                <p
                  style={{
                    fontFamily: sans,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'rgba(36,48,31,0.62)',
                    margin: 0,
                    marginTop: 2,
                  }}
                >
                  {r.recommendedMonths
                    .map(m => MAANEDER_KORT[m - 1])
                    .join(' · ')}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p
        style={{
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
          maxWidth: 460,
        }}
      >
        Aktiviteterne lægges automatisk i din kalender når du tilknytter
        guiden til en plante.
      </p>
    </section>
  )
}
