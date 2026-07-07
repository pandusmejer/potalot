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
  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
          paddingLeft: '0.3em', // optisk-centrér trods trailing tracking
        }}
      >
        {weekday}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.16em',
          color: 'rgba(36,48,31,0.66)',
          margin: '5px 0 0',
          paddingLeft: '0.16em',
        }}
      >
        {linje2}
      </p>
    </div>
  )
}
