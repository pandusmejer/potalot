'use client'

/**
 * "Små ting fra haven" — fritsvævende sensoriske noter der dukker
 * op mellem de strukturerede sektioner.
 *
 * VIGTIGT: Selve teksterne og pick-logikken er flyttet til
 * `src/lib/garden-notes.ts` så de kan bruges fra server-components
 * (fx /froebank/page.tsx). Denne fil indeholder kun JSX-rendering-
 * komponenten + re-eksport så eksisterende imports virker.
 *
 * Designprincip:
 *   • Konkret-kropslig, IKKE poetisk-løsrevet.
 *   • Forankrende, ikke motiverende.
 *   • Visuelt en margen-note, ikke en centered editorial quote.
 */

// Re-eksport så eksisterende `import { pickGardenNote } from
// 'components/havekalender/have-stemning'` stadig virker.
export { pickGardenNote } from '@/lib/garden-notes'

const sans = 'var(--font-manrope)'

/**
 * Fritsvævende sensorisk note — som en lille note i margen.
 * Manrope italic (samme font-familie som UI'et) holder den fra at
 * føles som editorial-quote eller Instagram-poesi. Lav kontrast,
 * mere line-height, og smal maks-bredde gør den til en mikropause
 * snarere end et feature-element.
 */
export function HaveStemning({ text }: { text: string }) {
  return (
    <div
      aria-label="Lille observation fra haven"
      style={{
        paddingInline: 24,
        paddingBlock: 4,
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontStyle: 'italic',
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.55,
          letterSpacing: '0.015em',
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
          maxWidth: 360,
        }}
      >
        {text}
      </p>
    </div>
  )
}
