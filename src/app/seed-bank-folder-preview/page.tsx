import { SeedBankFolderPanel } from '@/components/froebank/seed-bank-folder-panel'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

export default function SeedBankFolderPreviewPage() {
  return (
    <main
      className="overflow-x-clip"
      style={{
        background:
          'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.62), transparent 38%), #ece8dc',
        minHeight: '100dvh',
        padding: '28px 14px 96px',
      }}
    >
      <div style={{ margin: '0 auto', maxWidth: 760 }}>
        <header style={{ margin: '0 8px 24px' }}>
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
            Frøbank arkivmappe
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
            Isoleret overdragelses-preview af SeedBankFolderPanel. Frøbank-siden
            bruger stadig den eksisterende hero og browser.
          </p>
        </header>

        <SeedBankFolderPanel />

        <div
          aria-hidden
          style={{
            height: 170,
            margin: '-18px 24px 0',
            borderRadius: 26,
            background: '#eee7d8',
            boxShadow: '0 12px 26px rgba(36,48,31,0.13)',
          }}
        />
      </div>
    </main>
  )
}
