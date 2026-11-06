'use client'

import { useState, useTransition } from 'react'
import { setAiSamtykke, type AiSamtykkeStatus } from '@/actions/ai-samtykke'
import { SAMTYKKE_TEKST, SAMTYKKE_TITEL } from '@/lib/gartner-kontekst'

const sans = 'var(--font-manrope)'

/**
 * Samtykket til personlige råd — ét kort på Spørg Potalot (MVP 1.0, fase 4).
 *
 * Standard FRA, kan slås fra igen når som helst, og virker først, når
 * serveren har gemt valget. Vises kun for indloggede, og kun når valget kan
 * gemmes (status 'ja'/'nej'). Selve håndhævelsen sker på serveren.
 */
export function AiSamtykkeKort({ status }: { status: AiSamtykkeStatus }) {
  const [til, setTil] = useState(status === 'ja')
  const [fejl, setFejl] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (status !== 'ja' && status !== 'nej') return null

  function skift() {
    const naeste = !til
    setFejl(null)
    startTransition(async () => {
      const res = await setAiSamtykke(naeste)
      if ('error' in res) { setFejl(res.error); return }
      setTil(naeste)
    })
  }

  return (
    <section
      aria-labelledby="ai-samtykke-titel"
      style={{
        background: '#FBF8EF',
        border: '1px solid rgba(36,48,31,0.12)',
        borderRadius: 22,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <h2
          id="ai-samtykke-titel"
          style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: '#24301F', margin: 0 }}
        >
          {SAMTYKKE_TITEL}
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={til}
          aria-labelledby="ai-samtykke-titel"
          onClick={skift}
          disabled={pending}
          style={{
            flexShrink: 0,
            width: 46, height: 28, borderRadius: 999, border: 'none', padding: 3,
            background: til ? '#4E6138' : 'rgba(36,48,31,0.22)',
            cursor: pending ? 'default' : 'pointer',
            opacity: pending ? 0.7 : 1,
            transition: 'background 120ms',
            display: 'flex', alignItems: 'center',
            justifyContent: til ? 'flex-end' : 'flex-start',
          }}
        >
          <span aria-hidden style={{ width: 22, height: 22, borderRadius: 999, background: '#FFFFFF', display: 'block' }} />
        </button>
      </div>
      <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.5, color: '#6A665C', margin: '8px 0 0' }}>
        {SAMTYKKE_TEKST}
      </p>
      {fejl && (
        <p role="alert" style={{ fontFamily: sans, fontSize: 13, color: '#9A3B2E', margin: '8px 0 0' }}>{fejl}</p>
      )}
    </section>
  )
}
