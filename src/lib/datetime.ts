/**
 * Dato/tids-hjælpere. Dansk sprog, rolige formuleringer.
 */

const MAANED_KORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const MAANED_FULD = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']
const DAG_FULD   = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag']

export function parseDate(s: string): Date {
  return new Date(s + (s.includes('T') ? '' : 'T00:00:00'))
}

export function formatDatoKort(date: string | Date): string {
  const d = typeof date === 'string' ? parseDate(date) : date
  return `${d.getDate()}. ${MAANED_KORT[d.getMonth()]}`
}

export function formatDatoMedAar(date: string | Date): string {
  const d = typeof date === 'string' ? parseDate(date) : date
  return `${d.getDate()}. ${MAANED_KORT[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDagMaaned(date: string | Date): string {
  const d = typeof date === 'string' ? parseDate(date) : date
  return `${DAG_FULD[d.getDay()]}, ${d.getDate()}. ${MAANED_FULD[d.getMonth()]}`
}

export function dageSiden(date: string | Date): number {
  const d = typeof date === 'string' ? parseDate(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
}

export function dageTil(date: string | Date): number {
  return -dageSiden(date)
}

/** Venlig formulering: "i dag", "i går", "3 dage siden", "om 2 dage" */
export function venligDato(date: string | Date): string {
  const dage = dageSiden(date)
  if (dage === 0) return 'i dag'
  if (dage === 1) return 'i går'
  if (dage === -1) return 'i morgen'
  if (dage > 1 && dage < 7) return `${dage} dage siden`
  if (dage < -1 && dage > -7) return `om ${-dage} dage`
  if (dage >= 7 && dage < 14) return '1 uge siden'
  if (dage <= -7 && dage > -14) return 'om en uge'
  if (dage >= 14 && dage < 30) return `${Math.floor(dage / 7)} uger siden`
  if (dage <= -14 && dage > -30) return `om ${Math.floor(-dage / 7)} uger`
  if (dage >= 30 && dage < 365) return `${Math.floor(dage / 30)} måneder siden`
  return formatDatoMedAar(date)
}

export function idag(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export function erIDag(date: string): boolean {
  return date.startsWith(idag())
}

export function erForsinket(date: string): boolean {
  return dageSiden(date) > 0
}

/**
 * Er en OPGAVE reelt forsinket? En opgave dateret FØR den blev oprettet kan
 * ikke være noget brugeren har glemt — den er lagt i fortiden af systemet
 * (fx guide-gøremål fra en tilbagevirkende såning). Sådan en markeres ALDRIG
 * som forsinket (Anna 16/7): "Potalot ved ikke, om brugeren allerede har
 * udført dem." Kun opgaver dateret på/efter oprettelsen kan blive forsinkede.
 */
export function erForsinketOpgave(date: string, createdAt: string): boolean {
  if (!erForsinket(date)) return false
  return date >= createdAt.slice(0, 10)
}

export function aktuelMaaned(): number {
  return new Date().getMonth() + 1
}

export function maanedNavn(num: number, kort = false): string {
  return (kort ? MAANED_KORT : MAANED_FULD)[num - 1] ?? ''
}

export function aktuelAar(): number {
  return new Date().getFullYear()
}

/** Returner sæson-label baseret på måned-nummer (1-12). Vinter=12,1,2 osv. */
export function saeson(maaned: number): 'Vinter' | 'Forår' | 'Sommer' | 'Efterår' {
  if (maaned === 12 || maaned <= 2) return 'Vinter'
  if (maaned <= 5) return 'Forår'
  if (maaned <= 8) return 'Sommer'
  return 'Efterår'
}

/** Kalender-label format: "Forår - Apr - (14)". Måned med stort begyndelsesbogstav. */
export function formatPeriodeLabel(maaned: number, antalOpgaver: number): string {
  const kort = MAANED_KORT[maaned - 1] ?? ''
  const maanedLabel = kort.charAt(0).toUpperCase() + kort.slice(1)
  return `${saeson(maaned)} - ${maanedLabel} - (${antalOpgaver})`
}
