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
        <NoterEmpty />
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

/**
 * Polaroid-empty-state — Anna's spec.
 *
 * Et lille foto i polaroid-rammen (bred hvid kant nederst, smal top),
 * let roteret, med håndskreven-følelse tekst ved siden af.
 *
 * Visuelt: en polaroid lagt skævt på siden med tekst ved siden af,
 * som om en bruger har taget billedet ud af albummet og lagt det
 * fri.
 */
function NoterEmpty() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40% 1fr',
        gap: 22,
        alignItems: 'center',
        paddingBlock: '8px 4px',
      }}
    >
      {/* Polaroid — bred hvid kant nederst (klassisk polaroid-format) */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '0.84 / 1',
          transform: 'rotate(-2.8deg)',
          background: '#FBFAF1',
          padding: '8px 8px 32px 8px',
          boxShadow: '0 2px 4px rgba(48,38,18,0.10), 0 12px 26px rgba(48,38,18,0.10)',
        }}
      >
        {/* Foto inde i polaroid-rammen */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'rgba(36,48,31,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/makro/agurk-marketmore/blad.jpg"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.88) contrast(0.96)',
            }}
          />
        </div>
        {/* Tape-strimmel øverst — antydet, ikke realistisk */}
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            width: 44,
            height: 14,
            background: 'rgba(245,236,210,0.82)',
            transform: 'translateX(-50%) rotate(3deg)',
            boxShadow: '0 1px 2px rgba(48,38,18,0.10)',
            border: '1px solid rgba(180,160,120,0.20)',
          }}
        />
      </div>

      {/* Tekst — håndskreven-stemning. Cormorant italic, lav kontrast,
          som om noten ligger ovenpå en gammel side. */}
      <div>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(18px, 3.2vw, 22px)',
            lineHeight: 1.35,
            color: 'rgba(36,48,31,0.65)',
            margin: 0,
            maxWidth: 230,
          }}
        >
          Ingen noter endnu.
        </p>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(15px, 2.6vw, 17px)',
            lineHeight: 1.45,
            color: 'rgba(36,48,31,0.50)',
            margin: 0,
            marginTop: 10,
            maxWidth: 230,
          }}
        >
          Skriv den første fra en plante.
        </p>
      </div>
    </div>
  )
}
