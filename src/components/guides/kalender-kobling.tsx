/**
 * Kalender-kobling — viser hvilke aktiviteter denne guide vil generere
 * i brugerens kalender, hvis guiden følges.
 *
 * V4.1 — 3-4 kapitler efter sæson, ikke 7 ens bokse.
 *
 * Annas diagnose: "Du går fra 7 bokse til 3 kapitler, og det læses
 * langt hurtigere. Brugeren skal se sæsonens rytme, ikke en checklist."
 *
 * Aktiviteter grupperes efter første måned i recommendedMonths.
 * Kapitler uden aktiviteter rendres ikke.
 *
 * Spec-kilde: Docs/design-system/guides.md sektion -1.C.
 */

import type { GuideCalendarRule } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const MAANEDER_KORT = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
]

interface Saeson {
  id: string
  /** Cormorant kapitel-titel — Tidlig sæson, Forår, ... */
  label: string
  /** Manrope-eyebrow med måneder — "jan · feb · mar" */
  monthsLabel: string
  /** Range [first, last] inkl. — bruges til at matche rules. */
  range: [number, number]
}

const SAESONER: Saeson[] = [
  { id: 'tidlig',   label: 'Tidlig sæson',          monthsLabel: 'jan · feb · mar',  range: [1, 3] },
  { id: 'forar',    label: 'Forår',                 monthsLabel: 'apr · maj',        range: [4, 5] },
  { id: 'sommer',   label: 'Sommer',                monthsLabel: 'jun · jul · aug',  range: [6, 8] },
  { id: 'efteraar', label: 'Sensommer & efterår',   monthsLabel: 'sep · okt · nov',  range: [9, 11] },
  { id: 'vinter',   label: 'Vinter',                monthsLabel: 'dec',              range: [12, 12] },
]

interface Props {
  rules: GuideCalendarRule[]
}

function pickSaesonIndex(months: number[] | undefined): number {
  if (!months || months.length === 0) return 0
  const first = Math.min(...months)
  const idx = SAESONER.findIndex(s => first >= s.range[0] && first <= s.range[1])
  return idx >= 0 ? idx : 0
}

export function KalenderKobling({ rules }: Props) {
  if (rules.length === 0) return null

  // Grupper rules efter sæson — bevarer original rækkefølge inden i hver sæson.
  const chapters = SAESONER.map(saeson => ({
    saeson,
    rules: rules.filter(r => pickSaesonIndex(r.recommendedMonths) === SAESONER.indexOf(saeson)),
  })).filter(c => c.rules.length > 0)

  return (
    <section className="space-y-8 sm:space-y-10">
      <header className="space-y-3">
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
            fontSize: 'clamp(17px, 3vw, 19px)',
            lineHeight: 1.5,
            color: 'rgba(36,48,31,0.72)',
            margin: 0,
            maxWidth: 460,
          }}
        >
          Når du følger denne guide.
        </p>
      </header>

      <div className="space-y-8 sm:space-y-10">
        {chapters.map(({ saeson, rules: chapterRules }) => (
          <Kapitel
            key={saeson.id}
            label={saeson.label}
            monthsLabel={saeson.monthsLabel}
            rules={chapterRules}
          />
        ))}
      </div>

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
        Aktiviteterne lægges automatisk i din kalender, når du tilknytter
        guiden til en plante.
      </p>
    </section>
  )
}

function Kapitel({
  label,
  monthsLabel,
  rules,
}: {
  label: string
  monthsLabel: string
  rules: GuideCalendarRule[]
}) {
  return (
    <article className="space-y-3">
      <div className="space-y-1">
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#7F8F6A', // Salvie
            margin: 0,
          }}
        >
          {monthsLabel}
        </p>
        <h3
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(22px, 4vw, 26px)',
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            color: '#2D2A24',
            margin: 0,
          }}
        >
          {label}
        </h3>
      </div>

      <ul
        style={{ margin: 0, padding: 0, listStyle: 'none' }}
        className="space-y-3"
      >
        {rules.map((rule, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3.5"
          >
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#7F8F6A',
                transform: 'translateY(-2px)',
              }}
            />
            <p
              style={{
                fontFamily: serif,
                fontSize: 'clamp(17px, 3vw, 19px)',
                fontWeight: 400,
                lineHeight: 1.45,
                color: '#2D2A24',
                margin: 0,
              }}
            >
              {rule.title}
            </p>
          </li>
        ))}
      </ul>
    </article>
  )
}
