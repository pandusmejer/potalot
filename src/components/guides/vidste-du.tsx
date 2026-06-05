/**
 * VidsteDu — V4 §15.9 + Lag 4-eksempel.
 *
 * Note-i-margen-stil. Ingen baggrund. Kun divider over.
 *
 *   VIDSTE DU?
 *
 *   Tomater blev tidligere
 *   anset som giftige.
 *
 * V4 siger: må gerne placeres OVENPÅ et atmosfærisk makrofoto.
 * Brug AtmosfaeriskLag som wrapper når det giver mening:
 *
 *   <AtmosfaeriskLag src="/images/makro/.../blomster.jpg">
 *     <VidsteDu>...</VidsteDu>
 *   </AtmosfaeriskLag>
 *
 * Spec-kilde: Docs/design-system/guides.md §15.9.
 */

import type { ReactNode } from 'react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  children: ReactNode
}

export function VidsteDu({ children }: Props) {
  return (
    <aside
      style={{
        borderTop: '1px solid #D8D1BF',
        paddingTop: 20,
        marginTop: 8,
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7F8F6A', // Salvie
          margin: 0,
          marginBottom: 10,
        }}
      >
        Vidste du?
      </p>
      <div
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontSize: 19,
          fontWeight: 400,
          lineHeight: 1.55,
          color: '#2D2A24',
          maxWidth: '60ch',
        }}
      >
        {children}
      </div>
    </aside>
  )
}
