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
 * Ny-bruger-tilstandens hovedfortælling — én stor editorial blok.
 *
 * Visuelle spec'er pr. Anna's mockup:
 *   - Varm papir-farve (#F1E9D6 — varmere end sidens creme)
 *   - Asymmetrisk radius (større nederst-venstre, mindre øverst-højre)
 *   - Stor spire-illustration nederst højre — jord, frøskal, lille
 *     plante. SVG inline så vi ikke afventer assets.
 *   - Terracotta eyebrow "DIN FØRSTE SÆSON"
 *   - Cormorant 30px titel + 19px italic kropstekst
 */
function FirstSeasonBlock({ varieties }: { varieties: number }) {
  const titleText = varieties > 0
    ? `Du dyrker ${varieties} ${varieties === 1 ? 'sort' : 'sorter'}.`
    : 'Sæsonen står åben.'
  const bodyText = varieties > 0
    ? 'Om lidt begynder Havebogen at samle minder for dig.'
    : 'Den første sort, du planter, bliver Havebogens første minde.'
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: '#F1E9D6',
        // Asymmetrisk radius — som et papirstykke der ikke er
        // industrielt skåret. Større nederst-venstre.
        borderRadius: '14px 26px 28px 18px',
        boxShadow: '0 1px 2px rgba(48,38,18,0.04), 0 8px 22px rgba(48,38,18,0.06)',
        // Tekstur via subtilt papir-radial. Næsten umærkeligt, men
        // bryder den flade overflade.
        backgroundImage:
          'radial-gradient(at 78% 18%, rgba(220,200,160,0.18) 0%, transparent 55%),' +
          'radial-gradient(at 12% 92%, rgba(220,200,160,0.12) 0%, transparent 65%)',
      }}
    >
      <div
        className="relative z-10"
        style={{ padding: '26px 24px 30px 24px' }}
      >
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            // Terracotta — varm, jord-tone, distinkt fra sidens grøn
            color: '#A55A2B',
            margin: 0,
            marginBottom: 14,
          }}
        >
          Din første sæson
        </p>

        <h2
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(28px, 5.5vw, 38px)',
            lineHeight: 1.1,
            letterSpacing: '-0.015em',
            color: '#3A2B1B',
            margin: 0,
            maxWidth: 320,
          }}
        >
          {titleText}
        </h2>

        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(17px, 3vw, 20px)',
            lineHeight: 1.45,
            color: 'rgba(58,43,27,0.72)',
            margin: 0,
            marginTop: 14,
            maxWidth: 280,
          }}
        >
          {bodyText}
        </p>
      </div>

      {/* Spire-illustration nederst højre. Position absolute så
          den kan stikke lidt ud af klipningen og foroverlejre tekst
          i en organisk overlap. */}
      <SpireIllustration
        className="absolute"
        style={{
          right: -8,
          bottom: -4,
          width: 132,
          height: 124,
          opacity: 0.92,
        }}
      />
    </section>
  )
}

/**
 * Spire der er ved at bryde gennem jord, med frøskal-rest til venstre.
 *
 * Bevidst HAND-DRAWN (ikke geometrisk perfekt). Bløde streger, små
 * organiske skiftevise tykkelser. Ingen kontur — alle linjer er
 * konturløse fyldte former, så det ligner blæk eller akvarel.
 */
function SpireIllustration({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 132 124"
      fill="none"
      aria-hidden
    >
      {/* Jord-fladen — uregelmæssig kurve som en brun horisont */}
      <path
        d="M 0 92 C 18 86, 38 90, 58 88 C 78 86, 96 92, 112 90 C 122 89, 130 92, 132 94 L 132 124 L 0 124 Z"
        fill="#6B4A28"
      />
      {/* Lysere jord-strøg ovenpå — variation, ikke flad farve */}
      <path
        d="M 8 92 C 26 88, 52 90, 78 89 C 100 88, 118 92, 130 91 L 132 96 C 116 98, 88 96, 60 97 C 32 98, 12 96, 0 98 Z"
        fill="#8B6438"
        opacity="0.6"
      />
      {/* Små jord-prikker — granuleret tekstur */}
      <circle cx="22" cy="98" r="1.5" fill="#5A3D20" />
      <circle cx="42" cy="104" r="1" fill="#5A3D20" />
      <circle cx="68" cy="100" r="1.4" fill="#5A3D20" />
      <circle cx="96" cy="106" r="1.2" fill="#5A3D20" />
      <circle cx="116" cy="98" r="1.3" fill="#5A3D20" />

      {/* Frøskal — halvt åben skal til venstre nede */}
      <path
        d="M 20 84 C 18 80, 22 76, 28 76 C 34 76, 38 80, 36 86 C 34 90, 26 90, 22 88 Z"
        fill="#C9A572"
      />
      <path
        d="M 22 86 C 22 84, 26 82, 30 84 C 32 85, 32 87, 30 88 C 26 88, 22 87, 22 86 Z"
        fill="#A0824F"
        opacity="0.5"
      />

      {/* Spirens stilk — let bøjet */}
      <path
        d="M 66 92 C 64 78, 68 64, 66 48 C 65 38, 67 30, 66 22"
        stroke="#4A6B2D"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* To kimblade øverst — hjerteform */}
      <path
        d="M 66 26 C 60 20, 50 18, 44 22 C 42 26, 46 32, 54 32 C 60 32, 66 30, 66 26 Z"
        fill="#7BA050"
      />
      <path
        d="M 66 26 C 72 20, 82 18, 88 22 C 90 26, 86 32, 78 32 C 72 32, 66 30, 66 26 Z"
        fill="#8FB562"
      />

      {/* Midte-knop hvor spiren bryder */}
      <ellipse cx="66" cy="22" rx="2.5" ry="3" fill="#5A8038" />

      {/* Lille ekstra kimblad-detalje — variation */}
      <path
        d="M 54 30 C 56 28, 60 28, 60 30 C 60 31, 56 32, 54 30 Z"
        fill="#5A8038"
        opacity="0.55"
      />
    </svg>
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
