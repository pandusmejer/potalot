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
 * Tom-tilstand for arkiverede planter — V3.3 (Anna's "ikke krydderi"-spec).
 *
 * V3.1 brugte chili-froe-2.jpg, men det "ligner krydderi, ikke
 * havebog". Skiftet til dahlia/knolde.jpg — knoldene er præcis
 * efter-sæson-tilstanden for en plante: graves op om efteråret,
 * gemmes i kælderen, ventes på næste sæson. Knolde-fotoet HAR den
 * "afsluttet dyrkning, ventes på næste runde"-stemning som chili-
 * frøet manglede.
 */
function ArkivEmpty() {
  // V3.9 (Anna's kompositions-regel): VENDT layout.
  // Sektionerne over har "foto venstre, tekst højre" eller foto-stak.
  // Her gælder modsat: STOR TEKST dominerer, en lille presset prøve
  // sidder som DETAIL nederst-højre. Det er "tekst-dominerer"-mønstret
  // der bryder rytmen efter SenesteNoter's polaroid-stak.
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 26%',
        gap: 18,
        // Tekst og foto læser ikke som parallelle elementer; teksten
        // strækker sig op, billedet sidder lavt.
        alignItems: 'end',
        paddingBlock: '4px 0',
      }}
    >
      {/* Tekst — bærer sektionen alene. Større typografi end andre
          empty-states, fordi den IKKE deler vægt med fotoet. */}
      <div>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(22px, 4vw, 28px)',
            lineHeight: 1.3,
            color: 'rgba(36,48,31,0.72)',
            margin: 0,
            maxWidth: '18ch',
          }}
        >
          Når en sæson er ovre,<br />
          hører planterne hjemme her.
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
            marginTop: 10,
            maxWidth: '22ch',
          }}
        >
          Din første sæson er endnu ikke slut.
        </p>
      </div>

      {/* Lille presset prøve nederst-højre — som en bagsidefoto i et
          herbarium-album. Mindre og roligere end før (76px).
          Den fortæller "her ligger noget arkiveret" uden at konkurrere
          med teksten. */}
      <div
        style={{
          position: 'relative',
          width: 76,
          aspectRatio: '0.85 / 1',
          justifySelf: 'end',
          transform: 'rotate(2.8deg)',
          padding: 5,
          background: '#F2EAD3',
          boxShadow:
            '0 1px 2px rgba(48,38,18,0.10), 0 6px 14px rgba(48,38,18,0.08)',
          borderRadius: 2,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/makro/dahlia/knolde.jpg"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'saturate(0.78) contrast(0.96) sepia(0.05)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: '50%',
            width: 28,
            height: 10,
            background: 'rgba(245,236,210,0.78)',
            transform: 'translateX(-50%) rotate(-3deg)',
            boxShadow: '0 1px 2px rgba(48,38,18,0.10)',
            border: '1px solid rgba(180,160,120,0.20)',
          }}
        />
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
