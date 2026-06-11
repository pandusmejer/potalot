import { Card, CardContent } from '@/components/ui/card'
import type { OnThisDayEntry } from '@/data/havebog-demo'
import { laantErfaring } from '@/lib/havevisdom'
import { aktuelMaaned } from '@/lib/datetime'

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
        // V3.9 (Anna's kompositions-regel): IKKE side-om-side grid.
        // Tidligere 38/1fr split læste som "to-kolonne CMS"-mønstret
        // — samme komposition som 3 andre sektioner. Nu vertikal
        // stack: foto øverst, tekst nedenunder. Som et magasinopslag,
        // ikke et databasekort.
        <div className="flex flex-col" style={{ gap: 24, paddingBlock: '4px 0' }}>
          {/* Foto — bredere end før, fylder ~60% af sektionsbredden
              i en let asymmetri til venstre. Polaroidlignende papir-
              ramme + rotation. */}
          <div
            style={{
              position: 'relative',
              aspectRatio: '1.4 / 1',
              maxWidth: 320,
              transform: 'rotate(-1.4deg)',
              padding: 7,
              background: '#F2EAD3',
              boxShadow:
                '0 1px 2px rgba(48,38,18,0.10), 0 10px 22px rgba(48,38,18,0.10)',
              borderRadius: 2,
              alignSelf: 'flex-start', // bevidst venstre — IKKE centreret
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

          {/* Tekst nedenunder — som en billed-tekst i et magasinopslag.
              V6 (lånt erfaring, niveau 0): i stedet for at konstatere
              tomhed ("Den første side er stadig tom") låner vi
              fællesskabets erfaring — måneds-relevant havevisdom.
              Sandt-men-kedeligt er erstattet af lånt-men-værdifuldt. */}
          <div>
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(19px, 3.4vw, 24px)',
                lineHeight: 1.35,
                color: 'rgba(36,48,31,0.72)',
                margin: 0,
                maxWidth: 340,
              }}
            >
              {laantErfaring(aktuelMaaned()).paaDenneDag}
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
                maxWidth: 340,
              }}
            >
              Dine egne minder samles her, efterhånden som sæsonen skrider frem.
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
