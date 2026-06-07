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
 * Polaroid-stack-empty-state — V3.3 (Anna's "bord fyldt med minder"-spec).
 *
 * Tre polaroider med forskellig størrelse, rotation og let overlap —
 * som om brugeren har taget tre billeder ud af albummet og lagt dem
 * fri på et bord. Bryder "component-library/polaroid.tsx"-følelsen
 * fra V3.1 hvor en enkelt polaroid sad pænt centreret.
 *
 * Forskellig rotation, forskellig z-index, hver polaroid har sit
 * eget foto. Polaroiderne overlapper let så de føles som en
 * fysisk stak frem for et grid.
 */
function NoterEmpty() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '52% 1fr',
        gap: 8,
        alignItems: 'center',
        paddingBlock: '8px 16px',
      }}
    >
      {/* Polaroid-stak: 3 overlappende polaroider med varierende
          rotation og størrelse. Position relative + nested absolute
          så de kan overlappe naturligt. */}
      <div
        style={{
          position: 'relative',
          height: 220,
        }}
      >
        <Polaroid
          src="/images/makro/agurk-marketmore/blad.jpg"
          rotation={-7.5}
          width={106}
          tapeRotation={4}
          style={{ position: 'absolute', left: 0, top: 12, zIndex: 1 }}
        />
        <Polaroid
          src="/images/makro/dahlia-cafe-au-lait/knop.jpg"
          rotation={4.5}
          width={118}
          tapeRotation={-3}
          style={{ position: 'absolute', left: 58, top: 0, zIndex: 3 }}
        />
        <Polaroid
          src="/images/makro/chili/blomsterknop.jpg"
          rotation={-2}
          width={98}
          tapeRotation={5}
          style={{ position: 'absolute', left: 134, top: 40, zIndex: 2 }}
        />
      </div>

      {/* Tekst — håndskreven-stemning */}
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

/**
 * Enkel polaroid-komponent — genbrugelig i scrapbook-empty-states.
 * Bred hvid kant nederst (klassisk polaroid-format), let roteret,
 * antydet papirtape øverst.
 */
function Polaroid({
  src,
  rotation,
  width,
  tapeRotation,
  style,
}: {
  src: string
  rotation: number
  width: number
  tapeRotation: number
  style?: React.CSSProperties
}) {
  const height = width * 1.18 // standard polaroid-aspect
  return (
    <div
      style={{
        ...style,
        width,
        height,
        transform: `rotate(${rotation}deg)`,
        background: '#FBFAF1',
        padding: '6px 6px 26px 6px',
        boxShadow:
          '0 2px 4px rgba(48,38,18,0.10), 0 10px 22px rgba(48,38,18,0.12)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: 'rgba(36,48,31,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'saturate(0.88) contrast(0.96)',
          }}
        />
      </div>
      {/* Tape øverst */}
      <div
        style={{
          position: 'absolute',
          top: -7,
          left: '50%',
          width: Math.round(width * 0.42),
          height: 12,
          background: 'rgba(245,236,210,0.82)',
          transform: `translateX(-50%) rotate(${tapeRotation}deg)`,
          boxShadow: '0 1px 2px rgba(48,38,18,0.10)',
          border: '1px solid rgba(180,160,120,0.20)',
        }}
      />
    </div>
  )
}
