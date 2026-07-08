/**
 * Havebog-dateline — bogens "adresse": ugedag + dato lige under hero-bølgen,
 * som datolinjen øverst i et brev eller et magasinopslag. Afløser den gamle
 * dato-kolofon der lå oven på fotoet.
 *
 * Server-komponent (ingen 'use client') → datoen render'es statisk på
 * serveren; ingen hydration-mismatch af new Date().
 */

const sans = 'var(--font-manrope)'

const WEEKDAYS = [
  'SØNDAG', 'MANDAG', 'TIRSDAG', 'ONSDAG', 'TORSDAG', 'FREDAG', 'LØRDAG',
]
const MONTHS = [
  'JANUAR', 'FEBRUAR', 'MARTS', 'APRIL', 'MAJ', 'JUNI',
  'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER',
]

export function HavebogDateline({ date = new Date() }: { date?: Date }) {
  const weekday = WEEKDAYS[date.getDay()]
  const linje2 = `${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  // Rolig overgang efter bølgen. Støvet salvie-grøn/grå (#8F9282).
  return (
    <div style={{ textAlign: 'center', color: '#8F9282' }}>
      <p
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          margin: 0,
          paddingLeft: '0.24em', // optisk-centrér trods trailing tracking
        }}
      >
        {weekday}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '0.22em',
          margin: '6px 0 0',
          paddingLeft: '0.22em',
        }}
      >
        {linje2}
      </p>
    </div>
  )
}
