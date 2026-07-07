// Rytme i kalenderen — mobil editorial timeline (arts + sort deler modul).
const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
// Videnskabelig guidefont til titler; Cormorant er ude af kalenderen.
const plex = 'var(--font-plex-condensed), sans-serif'

interface KalenderRytmeChapter {
  title: string
  monthRange: string
  description?: string
  actions: string[]
}

interface KalenderRytmeKapitelProps {
  eyebrow?: string
  title?: string
  chapters: KalenderRytmeChapter[]
}

export const sanMarzanoKalenderRytme: KalenderRytmeChapter[] = [
  {
    title: 'Start sæsonen',
    monthRange: 'JAN-MAR',
    description: 'Planlæg varme, lys og en rolig start, før planterne får fart på.',
    actions: ['Så indendørs i lun jord', 'Giv ekstra lys ved tidlig såning'],
  },
  {
    title: 'Ud i vækst',
    monthRange: 'APR-JUN',
    description: 'Hærd planterne langsomt og flyt dem først ud, når nætterne er milde.',
    actions: ['Pot om, når rødderne fylder potten', 'Bind hovedstænglen op', 'Plant ud efter frost'],
  },
  {
    title: 'Høst og vedligehold',
    monthRange: 'JUL-OKT',
    description: 'Hold rytmen jævn med vand, opbinding og løbende høst af modne frugter.',
    actions: ['Vand jævnt ved roden', 'Knib sideskud efter behov', 'Høst modne tomater løbende'],
  },
]

// Aksens vandrette position — let mod venstre, så højre side får lidt mere
// plads til den længste fase (APR-JUN).
const AXIS = '44%'

/**
 * "Rytme i kalenderen" — mobil-first editorial timeline (samme modul på arts-
 * OG sortguides). Ikke et kort: en meget svag grønlig toneflade uden border/
 * skygge, en tynd lodret akse, og 3 faser der veksler venstre/højre om aksen.
 * Aksen + dots bærer identiteten. Copy er uændret.
 */
export function KalenderRytmeKapitel({
  eyebrow = 'RYTME I KALENDEREN',
  title = 'Fra forspiring til høst',
  chapters,
}: KalenderRytmeKapitelProps) {
  if (chapters.length === 0) {
    return null
  }

  return (
    <section
      style={{
        // Neutral VARM creme-whisper (ikke grøn) — svag toneflade uden at blive
        // et kort (ingen border/skygge). Tidslinjen bærer identiteten.
        background: 'rgba(255,251,240,0.5)',
        borderRadius: 22,
        padding: '30px 24px 32px',
      }}
    >
      <header style={{ marginBottom: 28 }}>
        <p
          className="m-0 uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            lineHeight: 1.2,
            color: 'rgba(108,103,73,0.9)',
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            fontFamily: plex,
            fontSize: 'clamp(25px, 6.8vw, 29px)',
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: '-0.015em',
            color: '#2D2A24',
            margin: '10px 0 0',
          }}
        >
          {title}
        </h2>
      </header>

      {/* Tidslinje: tynd lodret akse + 3 faser der veksler venstre/højre. */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute top-1 bottom-1"
          style={{
            left: AXIS,
            width: 1.5,
            transform: 'translateX(-50%)',
            // Dæmpet sand/oliven, lav kontrast (ikke frisk grøn).
            background:
              'linear-gradient(to bottom, rgba(118,111,80,0.28), rgba(118,111,80,0.42) 45%, rgba(118,111,80,0.24))',
          }}
        />
        {chapters.map((chapter, index) => {
          const onLeft = index % 2 === 0
          return (
            <div
              key={`${chapter.monthRange}-${chapter.title}`}
              className="relative"
              style={{ marginTop: index === 0 ? 0 : 22 }}
            >
              <span
                aria-hidden
                className="absolute rounded-full"
                style={{
                  left: AXIS,
                  top: 5,
                  transform: 'translateX(-50%)',
                  height: 10,
                  width: 10,
                  // Dæmpet oliven-brun, ikke frisk grøn.
                  background: '#6E6B49',
                }}
              />
              <div
                style={{
                  width: onLeft ? '44%' : '56%',
                  marginLeft: onLeft ? 0 : '44%',
                  paddingRight: onLeft ? 20 : 0,
                  paddingLeft: onLeft ? 0 : 20,
                  textAlign: onLeft ? 'right' : 'left',
                }}
              >
                <p
                  className="m-0 uppercase"
                  style={{
                    fontFamily: sans,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    lineHeight: 1.2,
                    color: '#8A876A',
                  }}
                >
                  {chapter.monthRange}
                </p>
                <h3
                  className="m-0"
                  style={{
                    fontFamily: plex,
                    fontSize: 'clamp(19px, 5.2vw, 21px)',
                    fontWeight: 600,
                    lineHeight: 1.1,
                    letterSpacing: '-0.01em',
                    color: '#2D2A24',
                    marginTop: 4,
                  }}
                >
                  {chapter.title}
                </h3>
                {chapter.actions.length > 0 && (
                  <p
                    className="m-0"
                    style={{
                      fontFamily: sans,
                      fontSize: 15,
                      fontWeight: 400,
                      lineHeight: 1.45,
                      color: 'rgba(45,42,36,0.7)',
                      marginTop: 6,
                    }}
                  >
                    {chapter.actions.slice(0, 3).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function KalenderRytmeKapitelExample() {
  return <KalenderRytmeKapitel chapters={sanMarzanoKalenderRytme} />
}
