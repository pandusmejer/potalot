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
      className="relative overflow-hidden rounded-[28px] px-6 py-8"
      style={{
        background: '#F4F0E5',
        border: '1px solid rgba(36,48,31,0.10)',
      }}
    >
      <header className="mb-8 max-w-[330px]">
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
          className="mt-3"
          style={{
            fontFamily: serif,
            fontSize: 'clamp(34px, 10vw, 46px)',
            fontWeight: 500,
            lineHeight: 0.98,
            letterSpacing: 0,
            color: '#2D2A24',
            marginBottom: 0,
          }}
        >
          {title}
        </h2>
      </header>

      <ol className="relative m-0 list-none space-y-8 p-0">
        <span
          aria-hidden
          className="absolute left-[5px] top-2 h-[calc(100%-18px)] w-px"
          style={{
            background:
              'linear-gradient(to bottom, rgba(127,143,106,0.24), rgba(127,143,106,0.42) 45%, rgba(127,143,106,0.16))',
          }}
        />

        {chapters.map((chapter, index) => (
          <li key={`${chapter.monthRange}-${chapter.title}`} className="relative pl-8">
            <span
              aria-hidden
              className="absolute left-0 top-[7px] h-[11px] w-[11px] rounded-full"
              style={{
                background: '#F4F0E5',
                border: '1px solid rgba(127,143,106,0.70)',
              }}
            />

            <article>
              <p
                className="m-0 uppercase"
                style={{
                  fontFamily: sans,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  lineHeight: 1.25,
                  color: '#7F8F6A',
                }}
              >
                {chapter.monthRange}
              </p>

              <h3
                className="mt-1"
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(25px, 7vw, 32px)',
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: 0,
                  color: '#2D2A24',
                  marginBottom: 0,
                }}
              >
                {chapter.title}
              </h3>

              {chapter.description && (
                <p
                  className="mt-3 max-w-[29rem]"
                  style={{
                    fontFamily: serif,
                    fontSize: 18,
                    fontStyle: 'italic',
                    lineHeight: 1.45,
                    color: 'rgba(45,42,36,0.72)',
                    marginBottom: 0,
                  }}
                >
                  {chapter.description}
                </p>
              )}

              <ul className="mt-4 m-0 list-none space-y-2 p-0">
                {chapter.actions.slice(0, 3).map((action) => (
                  <li key={action} className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: 'rgba(127,143,106,0.62)', transform: 'translateY(-2px)' }}
                    />
                    <p
                      className="m-0"
                      style={{
                        fontFamily: sans,
                        fontSize: 14,
                        fontWeight: 550,
                        lineHeight: 1.45,
                        color: 'rgba(45,42,36,0.82)',
                      }}
                    >
                      {action}
                    </p>
                  </li>
                ))}
              </ul>
            </article>

            {index < chapters.length - 1 && (
              <span
                aria-hidden
                className="mt-7 block h-px w-20"
                style={{
                  background:
                    'linear-gradient(to right, rgba(127,143,106,0.32), rgba(127,143,106,0))',
                }}
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function KalenderRytmeKapitelExample() {
  return <KalenderRytmeKapitel chapters={sanMarzanoKalenderRytme} />
}
