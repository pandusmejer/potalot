import { InspirationFolder } from '@/components/havekalender/inspiration-folder'
import { NextMonthTeaser } from '@/components/havekalender/next-month-teaser'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

export default function CalendarInspirationPreviewPage() {
  return (
    <main
      className="overflow-x-clip"
      style={{
        background: '#EAE6D8',
        minHeight: '100dvh',
        padding: '32px 20px 88px',
      }}
    >
      <div style={{ margin: '0 auto', maxWidth: 760 }}>
        <header style={{ marginBottom: 28 }}>
          <p
            style={{
              color: 'rgba(36,48,31,0.55)',
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: '0.2em',
              lineHeight: 1.25,
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Preview · ikke implementeret
          </p>
          <h1
            style={{
              color: '#24301F',
              fontFamily: serif,
              fontSize: 'clamp(34px, 9vw, 52px)',
              fontWeight: 600,
              letterSpacing: '0',
              lineHeight: 1,
              margin: '10px 0 10px',
            }}
          >
            Kalenderens editorial afslutning
          </h1>
          <p
            style={{
              color: 'rgba(36,48,31,0.64)',
              fontFamily: sans,
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 620,
            }}
          >
            Isoleret overdragelses-preview af Inspiration-folder og Kig mod næste måned.
            Kalenderen bruger stadig de eksisterende live-sektioner.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 26 }}>
          <InspirationFolder />
          <NextMonthTeaser />
        </div>
      </div>
    </main>
  )
}

