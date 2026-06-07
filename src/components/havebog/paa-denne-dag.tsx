import { Card, CardContent } from '@/components/ui/card'
import type { OnThisDayEntry } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  entries: OnThisDayEntry[]
}

/**
 * "På denne dag" — historiske hændelser fra samme dato tidligere år.
 * Som Facebook Memories eller Timehop, men for haven. Vækker minder
 * frem, peger ikke fremad.
 */
export function PaaDenneDag({ entries }: Props) {
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
        På denne dag
      </h2>

      {entries.length === 0 ? (
        // Ceremoniel tom-tilstand. Bevidst 2 linjer for at give
        // sektionen vægt — uden indhold er sektionen ellers så lille
        // at den læser som en glemt label snarere end et meningsfuldt
        // afsnit i Havebogen. To linjer + større size signalerer at
        // "her sker noget om et år", ikke "her mangler data".
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
            Dette er din første sæson i Havebogen.<br />
            Om et år begynder minderne at dukke op her.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex gap-4">
                  {e.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={e.imageUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                    />
                  )}
                  <div className="flex-1 min-w-0">
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
                      {e.yearsAgo === 1
                        ? 'På denne dag sidste år'
                        : `På denne dag ${e.yearsAgo} år siden`}
                    </p>
                    <p
                      className="mt-1.5"
                      style={{
                        fontFamily: sans,
                        fontSize: 15.5,
                        fontWeight: 700,
                        color: '#24301F',
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {e.plantName}
                      {e.variety && (
                        <span
                          className="ml-1.5 font-normal"
                          style={{ color: 'rgba(36,48,31,0.55)' }}
                        >
                          {e.variety}
                        </span>
                      )}
                    </p>
                    {e.text && (
                      <p
                        className="mt-1.5"
                        style={{
                          fontFamily: sans,
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: 1.5,
                          color: 'rgba(36,48,31,0.68)',
                          margin: 0,
                        }}
                      >
                        {e.text}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
