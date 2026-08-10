'use client'

/**
 * "Gemte råd · N" — plantesidens indgang til gemte Gartner-svar (Annas
 * kontekst-regel 10/8: plante-svar bor på PLANTEN, aldrig i guide-arkivet).
 * Klient-ø: henter efter mount (kun med auth-cookie) og renderer intet,
 * når der ikke er gemte råd — plantesiden står urørt.
 */

import { useEffect, useState } from 'react'
import { harAuthCookie } from '@/lib/auth-cookie'
import { GemtNoteItem } from '@/components/guides/gemt-note-item'
import { getGemteForPlante, type GartnerGemt } from '@/actions/gartner-gemte'

const sans = 'var(--font-manrope)'

export function GemteRaad({ plantId }: { plantId: string }) {
  const [raad, setRaad] = useState<GartnerGemt[]>([])
  const [udfoldet, setUdfoldet] = useState(false)

  useEffect(() => {
    if (!harAuthCookie()) return
    let aktiv = true
    getGemteForPlante(plantId)
      .then(r => { if (aktiv) setRaad(r) })
      .catch(() => {})
    return () => { aktiv = false }
  }, [plantId])

  if (raad.length === 0) return null

  return (
    <section aria-label="Gemte råd fra Gartneren">
      <button
        type="button"
        onClick={() => setUdfoldet(u => !u)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#4E6138',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async"
          src="/images/glyphs/plante.png" alt="" aria-hidden
          style={{ width: 'auto', height: 14, display: 'block' }}
        />
        Gemte råd · {raad.length} {udfoldet ? '↑' : '↓'}
      </button>

      {udfoldet && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {raad.map(r => (
            <GemtNoteItem
              key={r.id}
              note={r}
              onFjernet={id => setRaad(prev => prev.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}
    </section>
  )
}
