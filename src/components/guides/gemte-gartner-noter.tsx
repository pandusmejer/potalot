'use client'

/**
 * "Dine gemte noter · N" — KLIENT-ø på den enkelte guide (spec:
 * Docs/product/gem-fra-gartneren.md). Guide-detaljen er statisk genereret,
 * så brugerens gemte Gartner-svar hentes efter mount (kun med auth-cookie)
 * og toner ind — samme mønster som Din have-sektionen.
 *
 * HÅRD regel: personligt lag, aldrig redaktionel autoritet. Ingen gemte →
 * ingenting renderes; guiden står urørt.
 */

import { useEffect, useState } from 'react'
import { harAuthCookie } from '@/lib/auth-cookie'
import { GemtNoteItem } from '@/components/guides/gemt-note-item'
import { getGemteForGuide, type GartnerGemt } from '@/actions/gartner-gemte'

const sans = 'var(--font-manrope)'

export function GemteGartnerNoter({ guideId }: { guideId: string }) {
  const [noter, setNoter] = useState<GartnerGemt[]>([])
  const [udfoldet, setUdfoldet] = useState(false)

  useEffect(() => {
    if (!harAuthCookie()) return
    let aktiv = true
    getGemteForGuide(guideId)
      .then(n => { if (aktiv) setNoter(n) })
      .catch(() => {})
    return () => { aktiv = false }
  }, [guideId])

  if (noter.length === 0) return null

  return (
    <section aria-label="Dine gemte noter fra Gartneren">
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
        Dine gemte noter · {noter.length} {udfoldet ? '↑' : '↓'}
      </button>

      {udfoldet && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {noter.map(n => (
            <GemtNoteItem
              key={n.id}
              note={n}
              onFjernet={id => setNoter(prev => prev.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}
    </section>
  )
}
