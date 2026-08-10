'use client'

import { useState } from 'react'
import { GemtNoteItem } from '@/components/guides/gemt-note-item'
import type { GartnerGemt } from '@/actions/gartner-gemte'

/** Listen på /guides/gemt — klient-state så "Fjern" opdaterer uden reload. */
export function GemtListe({ initial }: { initial: GartnerGemt[] }) {
  const [noter, setNoter] = useState(initial)

  if (noter.length === 0) {
    return (
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, fontWeight: 500, lineHeight: 1.55, color: 'rgba(36,48,31,0.6)', margin: 0 }}>
        Du har ikke gemt noget endnu. Når Gartneren giver dig et svar, der er
        værd at huske, så tryk Gem til senere under svaret — så ligger det her.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {noter.map(n => (
        <GemtNoteItem
          key={n.id}
          note={n}
          visGuideLink
          onFjernet={id => setNoter(prev => prev.filter(x => x.id !== id))}
        />
      ))}
    </div>
  )
}
