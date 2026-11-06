/**
 * "Dyrk flere" og "Se opgaver" på Mine planter (MVP 1.0).
 * Kør: npx tsx scripts/test-dyrk-flere.ts
 *
 * Statiske kontrakter (komponenterne er React/klient og kan ikke køres her):
 *   • "Dyrk flere" genbruger Så-flowet og opretter ALTID en ny dyrkning
 *   • source_inventory_id bevares; uden frøpose bruges "en plante, du allerede har"
 *   • knapteksten følger MVP-tilstanden; linkmålet er /kalender begge veje
 * Selve mvp-config læses i begge tilstande i hver sin proces.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}
const laes = (sti: string) => readFileSync(join(__dirname, '..', sti), 'utf8')

console.log('\n[MVP-config i begge tilstande]')
function config(mvp: 'on' | 'off') {
  const kode = `import('../src/lib/mvp-config').then(m => console.log(JSON.stringify({ tekst: m.MVP_OPGAVER.knapTekst, dyrkFlere: m.MVP_PLANTER.dyrkFlere })))`
  const env = { ...process.env, NEXT_PUBLIC_MVP_MODE: mvp === 'off' ? 'off' : '' }
  const r = spawnSync('npx', ['tsx', '-e', kode], { cwd: join(__dirname), env, encoding: 'utf8' })
  const linje = r.stdout.trim().split('\n').pop() ?? ''
  try { return JSON.parse(linje) as { tekst: string; dyrkFlere: boolean } } catch { return null }
}
const paa = config('on')
const fra = config('off')
tjek('MVP til: knappen hedder "Se opgaver"', paa?.tekst === 'Se opgaver', JSON.stringify(paa))
tjek('MVP til: "Dyrk flere" er slået til', paa?.dyrkFlere === true)
tjek('MVP fra: knappen hedder stadig "Se kalender"', fra?.tekst === 'Se kalender', JSON.stringify(fra))
tjek('MVP fra: "Dyrk flere" er slået fra', fra?.dyrkFlere === false)

console.log('\n[Se opgaver — samme link]')
const naeste = laes('src/components/mine-planter/plant-naeste.tsx')
tjek('PlantNaeste har kalenderLabel med standard "Se kalender"', /kalenderLabel = 'Se kalender'/.test(naeste))
tjek('linkmålet er stadig /kalender som standard', /kalenderHref = '\/kalender'/.test(naeste))
tjek('teksten i knappen kommer fra kalenderLabel', /\{kalenderLabel\}/.test(naeste) && !/^\s*Se kalender\s*$/m.test(naeste))
const side = laes('src/app/(app)/mine-planter/[id]/page.tsx')
tjek('plantesiden sender MVP-teksten videre', /kalenderLabel=\{MVP_OPGAVER\.knapTekst\}/.test(side))
const froeSide = laes('src/app/(app)/froebank/[id]/page.tsx')
tjek('frøsedelsiden bruger samme tekst', /\{MVP_OPGAVER\.knapTekst\} <ArrowRight/.test(froeSide))
tjek('frøsedelsiden linker stadig til /kalender', /<Link href="\/kalender">\s*\{MVP_OPGAVER\.knapTekst\}/.test(froeSide))
tjek('ingen hårdkodet "Se kalender" tilbage på frøsedelsiden', !/Se kalender/.test(froeSide))

console.log('\n[Dyrk flere — genbrug af eksisterende flow]')
const komp = laes('src/components/mine-planter/dyrk-flere.tsx')
tjek('knappen hedder "Dyrk flere"', />\s*[\s\S]*?Dyrk flere/.test(komp))
tjek('med frøpose: Så-flowet (SowDialog) med den samme frøpose', /<SowDialog[\s\S]*?inventoryItemId=\{sourceInventoryId\}/.test(komp))
tjek('med frøpose: altid ny dyrkning', /altidNyDyrkning/.test(komp))
tjek('uden frøpose: "en plante, du allerede har" med art og sort forudfyldt', /<EgenPlanteDialog[\s\S]*?defaults=\{\{ name, variety \}\}/.test(komp))
tjek('ingen ny action eller datamodel', !/from '@\/actions\//.test(komp))

const sow = laes('src/components/froebank/sow-dialog.tsx')
tjek('SowDialog: altidNyDyrkning sender mergeStrategy "new"', /submit\(altidNyDyrkning \? 'new' : undefined\)/.test(sow))
tjek('SowDialog: uden altidNyDyrkning uændret (default false)', /altidNyDyrkning = false/.test(sow))

const egen = laes('src/components/mine-planter/egen-plante-dialog.tsx')
tjek('EgenPlanteDialog: defaults forudfylder art og sort', /useState\(defaults\?\.name \?\? ''\)/.test(egen) && /useState\(defaults\?\.variety \?\? ''\)/.test(egen))
tjek('EgenPlanteDialog: nulstilling bevarer defaults', /setName\(defaults\?\.name \?\? ''\)/.test(egen))

console.log('\n[Plantesiden]')
tjek('vises kun for logget-ind bruger med MVP til', /MVP_PLANTER\.dyrkFlere && log\.canLog/.test(side))
tjek('source_inventory_id sendes videre som sourceInventoryId', /sourceInventoryId=\{plant\.sourceElementId \?\? null\}/.test(side))
tjek('dyrkningssteder hentes kun uden frøpose', /MVP_PLANTER\.dyrkFlere && !realPlant\.sourceElementId \? getGardenLocations\(\)/.test(side))

console.log('\n[Serveren opretter ny plante, ændrer ikke den gamle]')
const mp = laes('src/actions/mine-planter.ts')
const startIdx = mp.indexOf('export async function saaFroeFraInventory')
const slutIdx = mp.indexOf('// Standalone plante-oprettelse')
const saa = mp.slice(startIdx, slutIdx)
tjek("mergeStrategy 'new' opretter en ny plante (createNewPlantEntry)", /existing && input\.mergeStrategy === 'new'\)\s*\{\s*\/\/[^\n]*\n\s*const \{ data: newPlant/.test(saa))
tjek('ny plante får source_inventory_id fra frøposen', /source_inventory_id: inv\.id/.test(saa))
tjek("'new' kan ikke ende i en sammenlægning med den eksisterende", !/mergeStrategy === 'new'[^}]{0,200}attachToPlantId/.test(saa))

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
process.exit(fejlet > 0 ? 1 : 0)
