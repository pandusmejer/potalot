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
 *
 * V3.1 (Anna's feedback): tom-tilstand har nu et HOVEDOBJEKT —
 * stort foto til venstre + tekst til højre. Tom-tilstande må ikke
 * være tekst alene.
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
        // Hovedobjekt-tom-tilstand: foto + tekst i journal-opslag.
        // Fotoet er beslægtet med "minde" (dahlia hoved) — det er
        // ikke en abstrakt illustration, men et faktisk havefoto
        // der placerer brugeren i den naturhistorie sektionen handler om.
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '38% 1fr',
            gap: 18,
            alignItems: 'start',
            paddingBlock: '4px 0',
          }}
        >
          {/* Foto — let roteret, papir-baggrund som let stikker ud */}
          <div
            style={{
              position: 'relative',
              aspectRatio: '0.78 / 1',
              transform: 'rotate(-1.4deg)',
              padding: 5,
              background: '#F2EAD3',
              boxShadow: '0 1px 2px rgba(48,38,18,0.10), 0 8px 18px rgba(48,38,18,0.08)',
              borderRadius: 2,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/makro/dahlia-cafe-au-lait/hoved.jpg"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'saturate(0.90)',
              }}
            />
          </div>

          <div>
            {/* V3.3 (Anna): dagbogs-sprog frem for software-sprog.
                "Dette er din første sæson i Havebogen" var korrekt
                men intet menneske skriver sådan i en dagbog. */}
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(18px, 3.2vw, 22px)',
                lineHeight: 1.4,
                color: 'rgba(36,48,31,0.68)',
                margin: 0,
                maxWidth: 240,
              }}
            >
              Den første side er stadig tom.
            </p>
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(15px, 2.6vw, 17px)',
                lineHeight: 1.5,
                color: 'rgba(36,48,31,0.50)',
                margin: 0,
                marginTop: 12,
                maxWidth: 240,
              }}
            >
              Om et år vil du kunne bladre tilbage og se hvad der voksede netop nu.
            </p>
          </div>
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
