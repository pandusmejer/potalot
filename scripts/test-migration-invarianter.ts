/**
 * Migrations-invarianter — fanger "CREATE OR REPLACE bygget på en gammel kopi".
 *
 * Baggrund: sync_task_reminders har MISTET sin dedup-hærdning to gange
 * (00058 og igen 00066), fordi en ny migration blev skrevet oven på en
 * ældre kopi af funktionen i stedet for den nyeste. Konsekvensen er ikke
 * kosmetisk: uden dedup_key kan cleanup-triggeren ikke fjerne forældede
 * påmindelser, og uden ON CONFLICT er dedup ikke race-sikker. Én bruger
 * stod med 57 ulæste påmindelser for 3 opgaver.
 *
 * Reglen her er derfor: ENHVER migration der redefinerer en vagtet funktion
 * skal indeholde alle funktionens påkrævede fragmenter. Kører i `npm test`.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Vagt {
  /** Funktionsnavn som det står i CREATE OR REPLACE FUNCTION. */
  fn: string
  /** Fragmenter der SKAL være med, hver gang funktionen redefineres. */
  kraever: string[]
  /**
   * Migrations der ALLEREDE er kørt i produktion med bruddet i sig. De kan
   * ikke rettes bagud — de står her navngivet, så historikken er ærlig og
   * testen stadig kan være grøn. Læg ALDRIG en ny fil på denne liste for at
   * få testen til at tie; ret migrationen i stedet.
   */
  kendteBrud: string[]
  hvorfor: string
}

const VAGTER: Vagt[] = [
  {
    fn: 'public.sync_task_reminders',
    kraever: ['dedup_key', 'ON CONFLICT'],
    kendteBrud: ['00058_onboarding_v2.sql', '00066_notifikations_sprog.sql'],
    hvorfor:
      'Uden dedup_key kan cleanup-triggeren (00056) ikke rydde forældede ' +
      'påmindelser, og uden ON CONFLICT er dedup ikke atomisk. Tabt i 00058 ' +
      'og igen i 00066 — se 00068_reminder_dedup_genskabt.sql.',
  },
]

const dir = join(process.cwd(), 'supabase', 'migrations')
const filer = readdirSync(dir).filter(f => f.endsWith('.sql')).sort()

let fejl = 0
let tjekket = 0

for (const vagt of VAGTER) {
  const noegle = `CREATE OR REPLACE FUNCTION ${vagt.fn}`
  const rammer = filer.filter(f => readFileSync(join(dir, f), 'utf8').includes(noegle))
  if (rammer.length === 0) {
    console.error(`✗ ${vagt.fn}: ingen migration definerer funktionen — er den omdøbt?`)
    fejl++
    continue
  }
  // Kun definitioner fra og med den migration der indførte kravet tælles;
  // ældre migrations er historik og må gerne mangle fragmenterne.
  const foersteMedKrav = rammer.find(f =>
    vagt.kraever.every(k => readFileSync(join(dir, f), 'utf8').includes(k))
  )
  if (!foersteMedKrav) {
    console.error(`✗ ${vagt.fn}: ingen migration opfylder kravene overhovedet.`)
    fejl++
    continue
  }
  for (const f of rammer) {
    if (f < foersteMedKrav) continue // historik før hærdningen blev indført
    if (vagt.kendteBrud.includes(f)) {
      console.log(`· ${f}: kendt brud (allerede kørt i produktion, kan ikke rettes bagud)`)
      continue
    }
    tjekket++
    const sql = readFileSync(join(dir, f), 'utf8')
    const mangler = vagt.kraever.filter(k => !sql.includes(k))
    if (mangler.length > 0) {
      console.error(
        `✗ ${f} redefinerer ${vagt.fn} uden: ${mangler.join(', ')}\n  → ${vagt.hvorfor}`
      )
      fejl++
    }
  }
  // Den SIDSTE definition er den der gælder i produktion — den skal holde.
  const sidste = rammer[rammer.length - 1]
  const sidsteSql = readFileSync(join(dir, sidste), 'utf8')
  const sidsteMangler = vagt.kraever.filter(k => !sidsteSql.includes(k))
  if (sidsteMangler.length > 0) {
    console.error(`✗ SENESTE definition (${sidste}) mangler: ${sidsteMangler.join(', ')}`)
    fejl++
  } else {
    console.log(`✓ ${vagt.fn}: seneste definition (${sidste}) har ${vagt.kraever.join(' + ')}`)
  }
}

if (fejl > 0) {
  console.error(`\n${fejl} invariant-brud i migrationerne.`)
  process.exit(1)
}
console.log(`\nAlle migrations-invarianter holder (${tjekket} definitioner tjekket).`)
