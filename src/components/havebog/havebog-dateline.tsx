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
  // Begge linjer ens: samme størrelse, font og (mørkere) farve.
  const linje = {
    fontFamily: sans,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.18em',
    color: 'rgba(36,48,31,0.86)',
    margin: 0,
    paddingLeft: '0.18em', // optisk-centrér trods trailing tracking
  } as const
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ ...linje, textTransform: 'uppercase' }}>{weekday}</p>
      <p style={{ ...linje, marginTop: 5 }}>{linje2}</p>
    </div>
  )
}
