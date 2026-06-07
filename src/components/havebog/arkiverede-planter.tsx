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
            Når en sæson er ovre, hører planterne hjemme her.<br />
            Din første sæson er endnu ikke slut.
          </p>
        </div>
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
