const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
// Videnskabelig guidefont til titler; Cormorant er ude af kalenderkortet.
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
  /**
   * Åben sektion (artsguide): ingen kort-flade/border/skygge — sektionen står
   * direkte på sidebaggrunden, og kun tidsaksen + dots bærer identiteten.
   * Default = boxed kort (sortguide).
   */
  open?: boolean
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

export function KalenderRytmeKapitel({
  eyebrow = 'RYTME I KALENDEREN',
  title = 'Fra forspiring til høst',
  chapters,
  open = false,
}: KalenderRytmeKapitelProps) {
  if (chapters.length === 0) {
    return null
  }

  return (
    <section
      className={open ? '' : 'rounded-[4px] px-5 py-6'}
      style={
        open
          ? undefined
          : {
              // Boxed (sortguide): varm creme + hø-gule side-striber + sæson-akse.
              background: '#F2F0E3',
              borderTop: '1px solid #D9D6BE',
              borderBottom: '1px solid #D9D6BE',
              borderLeft: '3px solid #C9A94E',
              borderRight: '3px solid #C9A94E',
              boxShadow: '0 4px 14px rgba(36,48,31,0.08)',
            }
      }
    >
      <header className="mb-5">
        <p
          className="m-0 uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            lineHeight: 1.25,
            color: 'rgba(36,48,31,0.56)',
          }}
        >
          {eyebrow}
        </p>
        <h2
          className="mt-1.5"
          style={{
            fontFamily: plex,
            fontSize: 'clamp(23px, 6.5vw, 27px)',
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: '-0.015em',
            color: '#2D2A24',
            margin: '6px 0 0',
          }}
        >
          {title}
        </h2>
      </header>

      {/* ÅBEN (artsguide): skiftevis venstre/højre om en let forskudt akse
          (42%) — en rolig sæsonrytme, ikke et corporate timeline-kort. Faserne
          veksler side; aksen + dots bærer identiteten. */}
      {open ? (
        <div className="relative">
          {/* Akse ved 42% (højre side får lidt mere plads til den længste fase). */}
          <span
            aria-hidden
            className="absolute top-2 bottom-2 w-px"
            style={{
              left: '42%',
              background:
                'linear-gradient(to bottom, rgba(123,139,99,0.28), rgba(123,139,99,0.5) 45%, rgba(123,139,99,0.24))',
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
                  className="absolute h-[8px] w-[8px] rounded-full"
                  style={{
                    left: '42%',
                    top: 5,
                    transform: 'translateX(-50%)',
                    background: '#5F7040',
                  }}
                />
                <div
                  style={{
                    width: onLeft ? '42%' : '58%',
                    marginLeft: onLeft ? 0 : '42%',
                    paddingRight: onLeft ? 18 : 0,
                    paddingLeft: onLeft ? 0 : 18,
                    textAlign: onLeft ? 'right' : 'left',
                  }}
                >
                  <p
                    className="m-0 uppercase"
                    style={{
                      fontFamily: sans,
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      lineHeight: 1.2,
                      color: '#7F8F6A',
                    }}
                  >
                    {chapter.monthRange}
                  </p>
                  <h3
                    className="m-0"
                    style={{
                      fontFamily: plex,
                      fontSize: 'clamp(17px, 4.5vw, 19px)',
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
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        color: 'rgba(45,42,36,0.7)',
                        marginTop: 5,
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
      ) : (
      <div className="relative m-0 list-none pl-[18px]">
        <span
          aria-hidden
          className="absolute left-[3px] top-[11px] bottom-[11px] w-px"
          style={{
            background:
              'linear-gradient(to bottom, rgba(123,139,99,0.28), rgba(123,139,99,0.5) 45%, rgba(123,139,99,0.24))',
          }}
        />
        {chapters.map((chapter, index) => (
          <div
            key={`${chapter.monthRange}-${chapter.title}`}
            className="relative grid grid-cols-[64px_1fr] items-start gap-3"
            style={{
              paddingTop: index === 0 ? 0 : 14,
              paddingBottom: index === chapters.length - 1 ? 0 : 14,
              borderTop: index === 0 ? undefined : '1px solid rgba(90,104,70,0.1)',
            }}
          >
            <span
              aria-hidden
              className="absolute h-[7px] w-[7px] rounded-full"
              style={{
                left: -18,
                top: (index === 0 ? 0 : 14) + 6,
                // Farvemættet oliven — prikkerne skal poppe på den lyse skinne.
                background: '#5F7040',
              }}
            />
            <p
              className="m-0 uppercase"
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.1em',
                lineHeight: 1.2,
                color: '#7F8F6A',
                marginTop: 5,
              }}
            >
              {chapter.monthRange}
            </p>
            <div className="min-w-0">
              <h3
                className="m-0"
                style={{
                  fontFamily: plex,
                  fontSize: 'clamp(18px, 5vw, 20px)',
                  fontWeight: 600,
                  lineHeight: 1.08,
                  letterSpacing: '-0.01em',
                  color: '#2D2A24',
                }}
              >
                {chapter.title}
              </h3>
              {chapter.actions.length > 0 && (
                <p
                  className="m-0"
                  style={{
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: 'rgba(45,42,36,0.7)',
                    marginTop: 5,
                  }}
                >
                  {chapter.actions.slice(0, 3).join(' · ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </section>
  )
}

export function KalenderRytmeKapitelExample() {
  return <KalenderRytmeKapitel chapters={sanMarzanoKalenderRytme} />
}
