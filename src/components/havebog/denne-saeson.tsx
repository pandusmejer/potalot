import { Card, CardContent } from '@/components/ui/card'
import type { DenneSaesonFacts } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  facts: DenneSaesonFacts
}

/**
 * "Denne sæson" — 3 FAKTUELLE kort. Ingen heuristik:
 *   - Seneste høst (nyeste log med type='harvest')
 *   - Seneste note (nyeste log med type='note'/'observation'/'reminder')
 *   - Seneste billede (nyeste log med image_urls)
 *
 * Bevidst objektive, ikke fortolkende. "Mest lært" / "Stolteste høst"
 * kan komme senere når der er nok brugerfeedback til at vurdere
 * heuristik-kvalitet.
 */
export function DenneSaeson({ facts }: Props) {
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
        Denne sæson
      </h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <FactCard
          label="Seneste høst"
          plantName={facts.senesteHoest?.plantName}
          variety={facts.senesteHoest?.variety}
          date={facts.senesteHoest?.date}
          body={facts.senesteHoest?.text}
          emptyText="Endnu ingen høst i år"
        />
        <FactCard
          label="Seneste note"
          plantName={facts.senesteNote?.plantName}
          variety={facts.senesteNote?.variety}
          date={facts.senesteNote?.date}
          body={facts.senesteNote?.text}
          emptyText="Ingen note endnu"
        />
        <FactCard
          label="Seneste billede"
          plantName={facts.senesteBillede?.plantName}
          variety={facts.senesteBillede?.variety}
          date={facts.senesteBillede?.date}
          image={facts.senesteBillede?.imageUrl}
          emptyText="Endnu intet billede"
        />
      </div>
    </section>
  )
}

interface FactCardProps {
  label: string
  plantName?: string
  variety?: string
  date?: string
  body?: string
  image?: string
  emptyText: string
}

function FactCard({ label, plantName, variety, date, body, image, emptyText }: FactCardProps) {
  const isEmpty = !plantName && !body && !image
  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-2">
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
          {label}
        </p>
        {isEmpty ? (
          <p
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 14,
              color: 'rgba(36,48,31,0.45)',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {emptyText}
          </p>
        ) : (
          <>
            {image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={image} alt="" className="h-32 w-full rounded-lg object-cover" />
            )}
            {plantName && (
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
                {plantName}
                {variety && (
                  <span
                    className="ml-1.5 font-normal"
                    style={{ color: 'rgba(36,48,31,0.55)' }}
                  >
                    {variety}
                  </span>
                )}
              </p>
            )}
            {body && !image && (
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 13.5,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: 'rgba(36,48,31,0.72)',
                  margin: 0,
                }}
              >
                {body}
              </p>
            )}
            {date && (
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'rgba(36,48,31,0.50)',
                  margin: 0,
                }}
              >
                {formatDate(date)}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = [
    'januar', 'februar', 'marts', 'april', 'maj', 'juni',
    'juli', 'august', 'september', 'oktober', 'november', 'december',
  ]
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`
}
