const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

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
      className="rounded-[24px] px-5 py-6"
      style={{
        background: '#F4F0E5',
        border: '1px solid rgba(36,48,31,0.10)',
      }}
    >
      <header className="mb-5">
        <p
          className="m-0 uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            lineHeight: 1.25,
            color: 'rgba(36,48,31,0.56)',
          }}
        >
          {eyebrow}
        </p>
        <h2
          className="mt-1.5"
          style={{
            fontFamily: serif,
            fontSize: 'clamp(24px, 7vw, 28px)',
            fontWeight: 500,
            lineHeight: 1.02,
            letterSpacing: 0,
            color: '#2D2A24',
            margin: '6px 0 0',
          }}
        >
          {title}
        </h2>
      </header>

      {/* Kompakte fase-rækker: måned-kolonne + titel + opgaver på én linje.
          Ingen lang vertikal timeline, ingen store italic-beskrivelser — hele
          sæsonen på ~én skærm. */}
      <div className="m-0 list-none">
        {chapters.map((chapter, index) => (
          <div
            key={`${chapter.monthRange}-${chapter.title}`}
            className="grid grid-cols-[64px_1fr] items-start gap-3"
            style={{
              paddingTop: index === 0 ? 0 : 14,
              paddingBottom: index === chapters.length - 1 ? 0 : 14,
              borderTop: index === 0 ? undefined : '1px solid rgba(36,48,31,0.08)',
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
                marginTop: 5,
              }}
            >
              {chapter.monthRange}
            </p>
            <div className="min-w-0">
              <h3
                className="m-0"
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(19px, 5.2vw, 21px)',
                  fontWeight: 500,
                  lineHeight: 1.05,
                  letterSpacing: 0,
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
    </section>
  )
}

export function KalenderRytmeKapitelExample() {
  return <KalenderRytmeKapitel chapters={sanMarzanoKalenderRytme} />
}
