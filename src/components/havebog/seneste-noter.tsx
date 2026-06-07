import { Card, CardContent } from '@/components/ui/card'
import type { RecentNote, LogType } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const TYPE_LABEL: Record<LogType, string> = {
  note: 'Note',
  observation: 'Observation',
  reminder: 'Påmindelse',
  harvest: 'Høst',
}

interface Props {
  notes: RecentNote[]
}

/**
 * "Seneste noter" — de 5 seneste journal-entries på tværs af planter.
 * Dette er noter, IKKE opgaver: brugerens egne observationer, læringer,
 * påmindelser, høst-registreringer.
 */
export function SenesteNoter({ notes }: Props) {
  return (
    <section className="space-y-3">
      <h2
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
        Seneste noter
      </h2>

      {notes.length === 0 ? (
        <div style={{ paddingBlock: '4px 0' }}>
          <p
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 19,
              lineHeight: 1.55,
              color: 'rgba(36,48,31,0.55)',
              margin: 0,
              maxWidth: 460,
            }}
          >
            Ingen noter endnu.<br />
            Den første skriver du fra en plantes detalje-side.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {notes.map((n, i) => (
                <li key={i} className="p-4 sm:p-5">
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(36,48,31,0.50)',
                      margin: 0,
                    }}
                  >
                    {TYPE_LABEL[n.type] ?? 'Note'} · {formatDate(n.date)}
                  </p>
                  <p
                    className="mt-1.5"
                    style={{
                      fontFamily: sans,
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: '#24301F',
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {n.plantName}
                    {n.variety && (
                      <span
                        className="ml-1.5 font-normal"
                        style={{ color: 'rgba(36,48,31,0.55)' }}
                      >
                        {n.variety}
                      </span>
                    )}
                  </p>
                  {n.text && (
                    <p
                      className="mt-1.5"
                      style={{
                        fontFamily: sans,
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: 'rgba(36,48,31,0.72)',
                        margin: 0,
                      }}
                    >
                      {n.text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = [
    'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
    'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
  ]
  return `${d.getDate()}. ${months[d.getMonth()]}`
}
