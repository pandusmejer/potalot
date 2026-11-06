/**
 * 'use server'-filer må ikke re-eksportere en type fra en lokal binding.
 * Kør: npx tsx scripts/test-use-server-eksport.ts
 *
 * Baggrund (MVP accepttest 2+3, 6/11 2026): `export type { ExtractedSeedFields }`
 * i src/actions/seed-packet-extract.ts får Next/Turbopacks server action-
 * transform til at generere en værdi-reference til en type, der ikke findes:
 *   ReferenceError: ExtractedSeedFields is not defined (module evaluation)
 * Modulet kan så ikke indlæses, og HELE sidens action-bundle fejler — også
 * andre actions på samme side: "Scan frøpose" (extractSeedPacketFields) og
 * "Så et frø" (saaFroeFraInventory) gav begge "Noget gik galt". Fejlen sker
 * FØR actionen når requireUser, så der er intet spor i Supabase-loggen.
 *
 * Reglen vagtes statisk: en 'use server'-fil må kun eksportere async
 * funktioner og inline type-/interface-deklarationer. Typer importeres der,
 * hvor de bor (fx '@/lib/seed-packet-fields'), ikke gennem actionen.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}

function filer(dir: string, ud: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn)
    if (statSync(sti).isDirectory()) filer(sti, ud)
    else if (/\.(ts|tsx)$/.test(navn)) ud.push(sti)
  }
  return ud
}

const ROD = join(__dirname, '..', 'src')
const useServer = filer(ROD).filter((f) => {
  const kilde = readFileSync(f, 'utf8')
  return /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*['"]use server['"]/.test(kilde)
})

console.log(`\n['use server'-filer: ${useServer.length}]`)
tjek('mindst én fil fundet (scanningen virker)', useServer.length > 0)

// Forbudt: re-eksport af en lokal binding og værdi-eksporter, der ikke er
// async funktioner. `export type { X } from '…'` er en anden form og tælles
// ikke som overtrædelse her (se advarslen nedenunder).
const FORBUDT: { navn: string; moenster: RegExp }[] = [
  { navn: 'export type { X } uden from', moenster: /^export\s+type\s*\{[^}]*\}\s*(?!from)(?:;|\s*$)/m },
  { navn: 'export { X } uden from', moenster: /^export\s*\{[^}]*\}\s*(?!from)(?:;|\s*$)/m },
  { navn: 'export * from', moenster: /^export\s*\*/m },
  { navn: 'export const/let/var', moenster: /^export\s+(?:const|let|var)\s/m },
  { navn: 'export class/enum', moenster: /^export\s+(?:class|enum)\s/m },
  { navn: 'export default', moenster: /^export\s+default\s/m },
]

console.log('\n[Ingen forbudte eksporter]')
for (const f of useServer) {
  const rel = f.slice(ROD.length + 1)
  const kilde = readFileSync(f, 'utf8')
  const fund = FORBUDT.filter((r) => {
    const m = r.moenster.exec(kilde)
    if (!m) return false
    // `export type { X } from '…'` matcher aldrig de to første, men et
    // multi-line `export {\n a,\n b\n}\nfrom` skal heller ikke give falsk alarm.
    return !/\bfrom\s*['"]/.test(kilde.slice(m.index, m.index + m[0].length + 80).split('\n').slice(0, 3).join('\n'))
  })
  tjek(rel, fund.length === 0, fund.map((r) => r.navn).join(', '))
}

console.log('\n[De to flows fra accepttesten]')
const scan = readFileSync(join(ROD, 'actions/seed-packet-extract.ts'), 'utf8')
tjek('seed-packet-extract.ts re-eksporterer ikke ExtractedSeedFields', !/export\s+type\s*\{\s*ExtractedSeedFields\s*\}/.test(scan))
const flow = readFileSync(join(ROD, 'components/froebank/tilfoej-flow.tsx'), 'utf8')
tjek(
  'tilfoej-flow henter typen dér, hvor den bor (@/lib/seed-packet-fields)',
  /import type \{ ExtractedSeedFields \} from '@\/lib\/seed-packet-fields'/.test(flow),
)
tjek(
  'tilfoej-flow importerer ikke typen gennem actionen',
  !/ExtractedSeedFields[^\n]*from '@\/actions\/seed-packet-extract'/.test(flow),
)

// Advarsel (fejler ikke): type-re-eksport MED from i en 'use server'-fil.
// Ikke observeret som fejl, men samme mønster; findes kun i skjulte sektioner.
const advarsler = useServer.filter((f) => /^export\s+type\s*\{[^}]*\}\s*from\s/m.test(readFileSync(f, 'utf8')))
if (advarsler.length > 0) {
  console.log(`\n[Bemærk — ikke en fejl]\n  'export type { … } from' i: ${advarsler.map((f) => f.slice(ROD.length + 1)).join(', ')}`)
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
process.exit(fejlet > 0 ? 1 : 0)
