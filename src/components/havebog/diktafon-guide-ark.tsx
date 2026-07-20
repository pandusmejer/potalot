'use client'

import { useEffect, useState } from 'react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/** FULD (Havebog): "fortæl dagens historie" — refleksion, længere note. */
const EKSEMPLER = [
  'Jeg høstede de første Sungold i dag.',
  'Der er bladlus på roserne.',
  'Jeg tror squashen mangler vand.',
  'Husk mig på at købe kompost.',
  'Lavendel dufter helt fantastisk.',
  'Peberfrugterne begynder at få farve.',
]

/** KOMPAKT (topbar): "fang en tanke" — lynhurtig note. Færre, kortere. */
const KOMPAKT_EKSEMPLER = [
  'Husk at vande drivhuset.',
  'Jeg høstede de første jordbær.',
  'Der er lus på roserne.',
]

/** Hvad den usynlige AI gør bagefter — dét er den egentlige værdi. */
const HVAD_POTALOT_GOER: { emoji: string; titel: string; tekst: string }[] = [
  { emoji: '🌱', titel: 'Genkender planterne', tekst: '…og kobler noten til de rigtige planter.' },
  { emoji: '📝', titel: 'Gemmer observationer', tekst: '…så du kan finde dem igen måneder senere.' },
  { emoji: '📅', titel: 'Foreslår opgaver', tekst: '…hvis du nævner noget, der kræver handling.' },
  { emoji: '📖', titel: 'Opbygger din Havebog', tekst: '…så årets historie skrives automatisk.' },
  { emoji: '🧠', titel: 'Husker det hele', tekst: '…så du ikke behøver.' },
]

const eyebrow = {
  fontFamily: sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: 'rgba(36,48,31,0.45)',
}

/**
 * "Sådan virker det"-ark — glider op nedefra første gang man trykker mic.
 *
 * To visninger, samme motor:
 *  - `fuld` (Havebog): fuld forklaring + eksempler + hvad Potalot gør bagefter.
 *  - `kompakt` (topbar): lynhurtig note; "Hvordan virker det?" folder den fulde ud.
 */
export function DiktafonGuideArk({
  open,
  startVisning = 'fuld',
  onClose,
  onBegin,
}: {
  open: boolean
  startVisning?: 'fuld' | 'kompakt'
  /** Luk uden at optage (visIkkeIgen = skjul også genvejen fremover). */
  onClose: (visIkkeIgen: boolean) => void
  /** Begynd at optage (visIkkeIgen = skjul genvejen fremover). */
  onBegin: (visIkkeIgen: boolean) => void
}) {
  const [visIkkeIgen, setVisIkkeIgen] = useState(false)
  const [visning, setVisning] = useState<'fuld' | 'kompakt'>(startVisning)

  // Nulstil til startvisning hver gang arket åbnes (kompakt topbar starter kompakt).
  useEffect(() => {
    if (open) setVisning(startVisning)
  }, [open, startVisning])

  // Lås baggrundens scroll mens arket er åbent.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const kompakt = visning === 'kompakt'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sådan virker diktafonen"
      onClick={() => onClose(visIkkeIgen)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(31,45,29,0.38)',
      }}
    >
      <style>{`
        @keyframes ark-op { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .ark-panel { animation: none !important; } }
      `}</style>
      <div
        className="ark-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '86vh',
          overflowY: 'auto',
          background: '#FBF6EA',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          boxShadow: '0 -18px 50px rgba(31,45,29,0.28)',
          padding: '10px 24px 28px',
          animation: 'ark-op 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Greb */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 16 }}>
          <span aria-hidden style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(36,48,31,0.18)' }} />
        </div>

        {kompakt ? (
          /* ─── KOMPAKT (topbar): fang en tanke ─── */
          <>
            <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(24px, 6.6vw, 30px)', color: '#24301F', margin: '0 0 8px', lineHeight: 1.12 }}>
              Hurtig note til din have
            </h2>
            <p style={{ fontFamily: sans, fontSize: 15, lineHeight: 1.5, color: 'rgba(36,48,31,0.75)', margin: 0 }}>
              Fortæl bare, hvad du ser, gør eller kommer i tanke om.
            </p>
            <p style={{ ...eyebrow, margin: '22px 0 10px' }}>Prøv f.eks.</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {KOMPAKT_EKSEMPLER.map(e => (
                <li key={e} style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.3, color: '#2C3A22', background: 'rgba(59,74,47,0.06)', borderRadius: 12, padding: '10px 14px' }}>
                  «{e}»
                </li>
              ))}
            </ul>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 19, color: 'rgba(36,48,31,0.75)', textAlign: 'center', margin: '22px 0 20px' }}>
              Potalot organiserer resten.
            </p>
          </>
        ) : (
          /* ─── FULD (Havebog): fortæl dagens historie ─── */
          <>
            <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(26px, 7vw, 32px)', color: '#24301F', margin: '0 0 10px', lineHeight: 1.1 }}>
              Fortæl frit om din have
            </h2>
            <p style={{ fontFamily: sans, fontSize: 15, lineHeight: 1.5, color: 'rgba(36,48,31,0.75)', margin: 0 }}>
              <strong style={{ color: '#3B4A2F' }}>Det er ikke en chat.</strong> Fortæl bare, hvad du ser, gør eller
              tænker. Du behøver ikke huske plantenavne, datoer eller den rigtige rækkefølge.
            </p>

            <p style={{ ...eyebrow, margin: '26px 0 12px' }}>Prøv for eksempel at sige</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EKSEMPLER.map(e => (
                <li key={e} style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.3, color: '#2C3A22', background: 'rgba(59,74,47,0.06)', borderRadius: 12, padding: '10px 14px' }}>
                  «{e}»
                </li>
              ))}
            </ul>

            <p style={{ ...eyebrow, margin: '28px 0 12px' }}>Når du er færdig, hjælper Potalot med at</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {HVAD_POTALOT_GOER.map(p => (
                <li key={p.titel} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ fontSize: 20, lineHeight: 1.2, flexShrink: 0 }}>{p.emoji}</span>
                  <span>
                    <span style={{ display: 'block', fontFamily: sans, fontSize: 15, fontWeight: 700, color: '#24301F' }}>{p.titel}</span>
                    <span style={{ display: 'block', fontFamily: sans, fontSize: 13.5, color: 'rgba(36,48,31,0.6)', marginTop: 1 }}>{p.tekst}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 20, color: 'rgba(36,48,31,0.75)', textAlign: 'center', margin: '28px 0 20px' }}>
              Fortæl frit. Potalot organiserer resten.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => onBegin(visIkkeIgen)}
          style={{
            width: '100%',
            padding: '15px 24px',
            borderRadius: 999,
            border: 'none',
            background: '#3B4A2F',
            color: '#F4EFDC',
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Begynd at optage
        </button>

        {/* Kompakt: genvej til den fulde forklaring. */}
        {kompakt && (
          <button
            type="button"
            onClick={() => setVisning('fuld')}
            style={{ display: 'block', margin: '14px auto 0', fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#3B4A2F', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Hvordan virker det?
          </button>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: kompakt ? 12 : 16, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={visIkkeIgen}
            onChange={e => setVisIkkeIgen(e.target.checked)}
            style={{ accentColor: '#3B4A2F', width: 15, height: 15 }}
          />
          <span style={{ fontFamily: sans, fontSize: 13, color: 'rgba(36,48,31,0.55)' }}>Vis ikke denne igen</span>
        </label>
      </div>
    </div>
  )
}
