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
    case 'inventory': return 'Fra frøbank'
    case 'guide': return 'Fra guide'
    case 'general': return 'Sæson'
    case 'manual': return 'Egen'
    default: return null
  }
}

export function SourceChip({ label }: { label: string }) {
  return (
    <span
      className="shrink-0 rounded-full"
      style={{
        fontFamily: sans,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.01em',
        color: 'rgba(42,51,32,0.5)',
        background: 'rgba(42,51,32,0.06)',
        padding: '2px 8px',
      }}
    >
      {label}
    </span>
  )
}
