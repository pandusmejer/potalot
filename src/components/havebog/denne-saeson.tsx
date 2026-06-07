import { Card, CardContent } from '@/components/ui/card'
import type { DenneSaesonFacts, HeroStats } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  facts: DenneSaesonFacts
  /** Bruges til ny-bruger-fortællingen: "Du dyrker N sorter" */
  varieties?: number
}

/**
 * "Denne sæson" — V3 (juni 2026, Anna's arkitektur-ordre).
 *
 * To FORSKELLIGE rendrings-tilstande:
 *
 * Ny bruger (alle facts er null): ÉN STOR EDITORIAL BLOK med
 * "Din første sæson"-narrativ + spire-illustration. Asymmetrisk
 * papir-card. Ingen 3-grid. Det er sidens forsidehistorie, ikke
 * en data-status-rapport.
 *
 * Erfaren bruger (mindst én fact): 3 fact-kort som hidtil.
 * Seneste høst / note / billede er stadig den korrekte måde at
 * besvare "hvordan går det" for én der HAR data.
 *
 * V3-anti-regel: Ny bruger må aldrig se "Den første høst venter /
 * Den første note venter / Det første billede venter" på 3 rad —
 * det er nøjagtig den fragmenterede "tom database"-følelse Anna
 * diagnosticerede. Editorial blok erstatter den med ÉN åben sætning.
 */
export function DenneSaeson({ facts, varieties = 0 }: Props) {
  const isNewUser =
    !facts.senesteHoest && !facts.senesteNote && !facts.senesteBillede

  if (isNewUser) {
    return <FirstSeasonBlock varieties={varieties} />
  }

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
          emptyText="Den første høst venter."
        />
        <FactCard
          label="Seneste note"
          plantName={facts.senesteNote?.plantName}
          variety={facts.senesteNote?.variety}
          date={facts.senesteNote?.date}
          body={facts.senesteNote?.text}
          emptyText="Den første note venter."
        />
        <FactCard
          label="Seneste billede"
          plantName={facts.senesteBillede?.plantName}
          variety={facts.senesteBillede?.variety}
          date={facts.senesteBillede?.date}
          image={facts.senesteBillede?.imageUrl}
          emptyText="Det første billede venter."
        />
      </div>
    </section>
  )
}

/**
 * Ny-bruger-tilstandens hovedfortælling — editorial opslag med
 * makrofoto som hovedperson.
 *
 * V3.1 (Anna's spire-feedback): SVG-illustrationen virkede børnebogs-
 * agtig. Erstattet med ægte makrofoto (dahlia/skud_1.jpg — et skud
 * der vokser frem). Fotoet ER hovedobjektet; teksten følger ved
 * siden af.
 *
 * Layout: venstre = makrofoto i smal vertikal kolonne (37%),
 * højre = tekst (eyebrow + titel + body). Fotoet stikker en lille
 * smule ud af card'en øverst (-6px) for scrapbook-følelse.
 *
 * Visuelle spec'er:
 *   - Varm papir-farve #F1E9D6 (varmere end sidens creme)
 *   - Asymmetrisk radius (14/26/28/18)
 *   - Foto: makro/dahlia/skud_1.jpg, beskåret som høj kolonne
 *   - Terracotta eyebrow "DIN FØRSTE SÆSON"
 *   - Cormorant titel + italic body
 */
function FirstSeasonBlock({ varieties }: { varieties: number }) {
  // V3.5 (Anna's reference-opslag-feedback): tallet er nu hovedpersonen,
  // ikke embedded i en sætning. "Du dyrker 8 sorter." læste som
  // brødtekst. "8" som Cormorant 80px læser som magasin.
  const hasVarieties = varieties > 0
  return (
    <section
      className="relative"
      style={{
        background: '#F1E9D6',
        borderRadius: '14px 26px 28px 18px',
        boxShadow: '0 1px 2px rgba(48,38,18,0.04), 0 8px 22px rgba(48,38,18,0.06)',
        backgroundImage:
          'radial-gradient(at 78% 18%, rgba(220,200,160,0.18) 0%, transparent 55%),' +
          'radial-gradient(at 12% 92%, rgba(220,200,160,0.12) 0%, transparent 65%)',
      }}
    >
      <div
        className="relative"
        style={{
          padding: '24px 22px 28px 22px',
          display: 'grid',
          gridTemplateColumns: '47% 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Foto-kolonne — makrofoto af dahlia-skud */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '0.78 / 1',
            marginTop: -6,
            borderRadius: '6px 10px 8px 12px',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(48,38,18,0.12), 0 12px 24px rgba(48,38,18,0.08)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/makro/dahlia/skud_1.jpg"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%',
              filter: 'saturate(0.92)',
            }}
          />
        </div>

        {/* Tekst-kolonne — big-number-hierarki */}
        <div>
          <p
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#A55A2B',
              margin: 0,
              marginBottom: 8,
            }}
          >
            Din første sæson
          </p>

          {hasVarieties ? (
            <>
              {/* Niveau 1: det store tal — V3.7 (Annas præcise spec).
                  Samme typografi-skala som NaturenLigeNu's "14°".
                  Forskellig komposition (denne her er delt med foto)
                  sikrer at de ikke føles som to mini-dashboards. */}
              <p
                style={{
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: 'clamp(72px, 20vw, 124px)',
                  lineHeight: 0.82,
                  letterSpacing: '-0.025em',
                  color: '#3A2B1B',
                  margin: 0,
                }}
              >
                {varieties}
              </p>

              {/* Niveau 3: caps-label under tallet — V3.7 spec:
                  margin-top: -2px (signatur under tallet)
                  letter-spacing: 0.22em (bredere tracking) */}
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(58,43,27,0.55)',
                  margin: 0,
                  marginTop: -2,
                }}
              >
                {varieties === 1 ? 'Sort i haven' : 'Sorter i haven'}
              </p>

              {/* Niveau 2: editorial body — V3.7 spec:
                  line-height: 1.2 (strammere som magasin-pull-quote) */}
              <p
                style={{
                  fontFamily: serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(15px, 2.6vw, 17px)',
                  lineHeight: 1.2,
                  color: 'rgba(58,43,27,0.65)',
                  margin: 0,
                  marginTop: 14,
                  maxWidth: '15ch',
                }}
              >
                Om lidt begynder Havebogen at samle minder for dig.
              </p>
            </>
          ) : (
            // Edge-case: ingen sorter endnu (frøbank tom). Vis editorial
            // sætning i niveau-2-typografi uden big-number-stunt.
            <>
              <h2
                style={{
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: 'clamp(24px, 5vw, 32px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.015em',
                  color: '#3A2B1B',
                  margin: 0,
                }}
              >
                Sæsonen står åben.
              </h2>
              <p
                style={{
                  fontFamily: serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(15px, 2.6vw, 17px)',
                  lineHeight: 1.45,
                  color: 'rgba(58,43,27,0.65)',
                  margin: 0,
                  marginTop: 14,
                }}
              >
                Den første sort, du planter, bliver Havebogens første minde.
              </p>
            </>
          )}
        </div>
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
