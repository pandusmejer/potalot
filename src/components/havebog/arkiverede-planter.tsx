import { Card, CardContent } from '@/components/ui/card'
import type { ArchivedPlant } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  plants: ArchivedPlant[]
}

/**
 * "Arkiverede planter" — afsluttede dyrkninger fra tidligere sæsoner.
 *
 * ⚠️ V1 er rent read-only. INGEN <Link href="/mine-planter/...">.
 *
 * Hvorfor: Planter-universet er bygget til AKTIV dyrkning (vækststadie,
 * næste handling, "i vækst"-bjælke). En arkiveret tomat hører ikke
 * hjemme dér — hele informationsarkitekturen ville kollapse.
 *
 * Dedikeret Havebog-detailside (med read-only billeder, noter, tidslinje
 * og høst-resumé) bygges som separat opgave senere.
 */
export function ArkiverdePlanter({ plants }: Props) {
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
        Arkiverede planter
      </h2>

      {plants.length === 0 ? (
        <ArkivEmpty />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plants.map(p => (
            <ArkivKort key={p.id} plant={p} />
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Tom-tilstand for arkiverede planter — "presset tørret plante"-tilgang
 * pr. Anna's spec. Lille foto af en plante-detalje (chili-frø) som om
 * den var presset og fastgjort i et herbarium-album.
 */
function ArkivEmpty() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40% 1fr',
        gap: 22,
        alignItems: 'center',
        paddingBlock: '4px 0',
      }}
    >
      {/* Presset prøve — let roteret, mat papir-baggrund */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '0.85 / 1',
          transform: 'rotate(1.8deg)',
          padding: 6,
          background: '#F2EAD3',
          boxShadow: '0 1px 2px rgba(48,38,18,0.10), 0 8px 18px rgba(48,38,18,0.08)',
          borderRadius: 2,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/makro/chili/froe-2.jpg"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // Lavere saturation + lidt mat — som en gemt prøve
            filter: 'saturate(0.75) contrast(0.95) sepia(0.08)',
          }}
        />
        {/* Antydet tape */}
        <div
          style={{
            position: 'absolute',
            top: -7,
            left: '50%',
            width: 36,
            height: 12,
            background: 'rgba(245,236,210,0.78)',
            transform: 'translateX(-50%) rotate(-3deg)',
            boxShadow: '0 1px 2px rgba(48,38,18,0.10)',
            border: '1px solid rgba(180,160,120,0.20)',
          }}
        />
      </div>

      <div>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(17px, 3vw, 21px)',
            lineHeight: 1.4,
            color: 'rgba(36,48,31,0.65)',
            margin: 0,
            maxWidth: 240,
          }}
        >
          Når en sæson er ovre, hører planterne hjemme her.
        </p>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(15px, 2.6vw, 17px)',
            lineHeight: 1.5,
            color: 'rgba(36,48,31,0.48)',
            margin: 0,
            marginTop: 8,
            maxWidth: 240,
          }}
        >
          Din første sæson er endnu ikke slut.
        </p>
      </div>
    </div>
  )
}

function ArkivKort({ plant }: { plant: ArchivedPlant }) {
  // Read-only kort. Bevidst INGEN Link, INGEN onClick, INGEN navigation.
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-4">
          {plant.primaryImageId && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={plant.primaryImageId}
              alt=""
              className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
            />
          )}
          <div className="flex-1 min-w-0 space-y-1">
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
              Sæson {plant.archivedYear}
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 15.5,
                fontWeight: 700,
                color: '#24301F',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {plant.name}
            </p>
            {plant.variety && (
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 13.5,
                  fontWeight: 400,
                  color: 'rgba(36,48,31,0.62)',
                  margin: 0,
                }}
              >
                {plant.variety}
              </p>
            )}
            {plant.summary && (
              <p
                className="pt-1"
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: 'rgba(36,48,31,0.55)',
                  margin: 0,
                }}
              >
                {plant.summary}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
