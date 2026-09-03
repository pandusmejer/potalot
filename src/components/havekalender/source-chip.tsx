/**
 * Diskret kilde-chip til "I haven nu"-modulet. Lader brugeren MÆRKE
 * sammenhængen (hvor en opgave kommer fra) uden at afsløre datamodellen.
 * Bevidst lav-kontrast — den hjælper skanning, dominerer ikke.
 */

import type { TaskSource } from '@/lib/types'

const sans = 'var(--font-manrope)'

/** CalendarTask.source → menneskeligt kilde-ord. */
export function taskSourceLabel(source: TaskSource): string | null {
  switch (source) {
    case 'plant': return 'Fra planter'
    case 'inventory': return 'Fra Frøbanken'
    case 'guide': return 'Fra guide'
    case 'general': return 'Sæson'
    case 'manual': return 'Egen'
    default: return null
  }
}

export function SourceChip({ label }: { label: string }) {
  // Tertiær etikette — ikke en rigtig badge. Ingen pill/baggrund, så den
  // ikke konkurrerer med de grønne handlingschips (handling vs. kilde).
  return (
    <span
      className="shrink-0"
      style={{
        fontFamily: sans,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'rgba(42,51,32,0.38)',
      }}
    >
      {label}
    </span>
  )
}
