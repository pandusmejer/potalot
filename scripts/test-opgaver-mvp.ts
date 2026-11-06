/**
 * Opgaver i MVP'en (fase 3) — reglerne bag Nu / Kommende / Udført.
 * Kør: npx tsx scripts/test-opgaver-mvp.ts
 */
import {
  afledtTilOpgavetype, bygOpgaveOversigt, DEDUP_DAGE, efterfoelgendeMaaned, fjernDubletter,
  NU_DAGE, opgaveTypeLabel, plusDage,
} from '../src/lib/opgaver-mvp'
import type { CalendarTask, GeneralGardenTask, UserGardenTask } from '../src/lib/types'
import type { DagensFokus, FokusHandling } from '../src/lib/kalender/dagens-fokus'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean) {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.log(`  ✗ ${navn}`) }
}

const IDAG = '2026-11-06'
let n = 0
function opgave(o: Partial<CalendarTask> & { date: string }): CalendarTask {
  n++
  return {
    id: `t${n}`, userId: 'u', title: `Opgave ${n}`, taskType: 'custom', priority: 'medium',
    status: 'open', source: 'manual', isRecurring: false,
    createdAt: '2026-10-01T08:00:00Z', updatedAt: '2026-10-01T08:00:00Z',
    ...o,
  } as CalendarTask
}
function handling(o: Partial<FokusHandling> & { taskType: FokusHandling['taskType'] }): FokusHandling {
  n++
  return {
    id: `h${n}`, taskKey: `p1:${o.taskType}:${IDAG}`, lag: 2, titel: `Råd ${n}`, hvorfor: 'Fordi.',
    plantId: 'p1', udfoert: false, href: '/mine-planter/p1', beroerer: 1, guidePrioritet: 0,
    ...o,
  } as FokusHandling
}
function generel(o: Partial<GeneralGardenTask> & { id: string }): GeneralGardenTask {
  return {
    title: `Generel ${o.id}`, description: '', month: 11, category: 'andet', priority: 'medium',
    recurrence: 'yearly', isActive: true, linkedGuideIds: [], isHiddenByMe: false,
    createdAt: '2026-01-01', updatedAt: '2026-01-01', ...o,
  }
}
function eget(o: Partial<UserGardenTask> & { id: string }): UserGardenTask {
  return {
    userId: 'u', title: `Eget ${o.id}`, description: '', month: 11, category: 'andet',
    priority: 'medium', notifyEnabled: false, createdAt: '2026-01-01', updatedAt: '2026-01-01', ...o,
  }
}
function fokus(o: Partial<DagensFokus> = {}): DagensFokus {
  return { trin: 2, fokus: [], flere: [], stilhed: false, rytme: [], ...o }
}
function bygg(over: Partial<Parameters<typeof bygOpgaveOversigt>[0]> = {}) {
  return bygOpgaveOversigt({
    tasks: [], dagensFokus: fokus(), generalTasks: [], userTasks: [],
    today: IDAG, month: 11, year: 2026, ...over,
  })
}

console.log('\n1. Datoer')
{
  tjek('+7 dage', plusDage('2026-11-06', 7) === '2026-11-13')
  tjek('månedsskifte', plusDage('2026-11-28', 5) === '2026-12-03')
  tjek('årsskifte', plusDage('2026-12-30', 3) === '2027-01-02')
  tjek('næste måned', efterfoelgendeMaaned(11, 2026).month === 12)
  tjek('december → januar næste år', JSON.stringify(efterfoelgendeMaaned(12, 2026)) === JSON.stringify({ month: 1, year: 2027 }))
}

console.log('\n2. Nu: forsinkede og aktuelle opgaver')
{
  const forsinket = opgave({ date: '2026-11-01', createdAt: '2026-10-20T08:00:00Z', title: 'Forsinket' })
  const iDag = opgave({ date: IDAG, title: 'I dag' })
  const iMorgen = opgave({ date: '2026-11-07', title: 'I morgen' })
  const om7 = opgave({ date: plusDage(IDAG, NU_DAGE), title: 'Om 7 dage' })
  const om8 = opgave({ date: plusDage(IDAG, NU_DAGE + 1), title: 'Om 8 dage' })
  const o = bygg({ tasks: [om8, iMorgen, iDag, forsinket, om7] })
  const titler = o.nu.dine.map((r) => (r.type === 'opgave' ? r.task.title : r.handling.titel))
  tjek('forsinket først, så dato', titler.join() === 'Forsinket,I dag,I morgen,Om 7 dage')
  tjek('forsinket-flaget sættes på den forsinkede', o.nu.dine[0].type === 'opgave' && (o.nu.dine[0] as { forsinket: boolean }).forsinket)
  tjek('i dag er ikke forsinket', (o.nu.dine[1] as { forsinket: boolean }).forsinket === false)
  tjek('om 7 dage er stadig Nu; om 8 dage er Kommende', o.nu.dine.length === 4 && o.kommende.opgaver.length === 1 && o.kommende.opgaver[0].title === 'Om 8 dage')
  const retro = opgave({ date: '2026-10-05', createdAt: '2026-11-01T08:00:00Z', title: 'Lagt i fortiden af systemet' })
  const r = bygg({ tasks: [retro] })
  tjek('en opgave dateret før oprettelsen er i Nu, men ikke "forsinket"', r.nu.dine.length === 1 && (r.nu.dine[0] as { forsinket: boolean }).forsinket === false)
}

console.log('\n3. Kommende: sorteret efter dato')
{
  const a = opgave({ date: '2026-12-20', title: 'Senere' })
  const b = opgave({ date: '2026-11-25', title: 'Tidligere' })
  const o = bygg({ tasks: [a, b] })
  tjek('tidligste først', o.kommende.opgaver.map((t) => t.title).join() === 'Tidligere,Senere')
}

console.log('\n4. Udført')
{
  const u1 = opgave({ date: '2026-10-01', status: 'completed', completedAt: '2026-10-02T10:00:00Z', title: 'Første' })
  const u2 = opgave({ date: '2026-10-05', status: 'completed', completedAt: '2026-10-09T10:00:00Z', title: 'Seneste' })
  const sprunget = opgave({ date: '2026-10-05', status: 'skipped', title: 'Sprunget over' })
  const o = bygg({ tasks: [u1, u2, sprunget] })
  tjek('seneste udførte først', o.udfoert.opgaver.map((t) => t.title).join() === 'Seneste,Første')
  tjek('sprunget over er hverken udført eller åben', !o.udfoert.opgaver.some((t) => t.title === 'Sprunget over') && o.nu.dine.length === 0)
  const mange = Array.from({ length: 40 }, (_, i) => opgave({ date: '2026-09-01', status: 'completed', completedAt: `2026-09-${String((i % 28) + 1).padStart(2, '0')}T08:00:00Z` }))
  tjek('højst 30 udførte vises', bygg({ tasks: mange }).udfoert.opgaver.length === 30)
}

console.log('\n5. Dubletter — opgave mod opgave')
{
  const a = opgave({ date: IDAG, title: 'Plant ud', taskType: 'plant_out', linkedPlantId: 'p1', createdAt: '2026-10-01T08:00:00Z' })
  const b = opgave({ date: IDAG, title: 'plant  ud', taskType: 'plant_out', linkedPlantId: 'p1', createdAt: '2026-10-02T08:00:00Z' })
  const c = opgave({ date: IDAG, title: 'Plant ud', taskType: 'plant_out', linkedPlantId: 'p2' })
  const r = fjernDubletter([a, b, c])
  tjek('samme plante+type+dato+titel → én (den ældste)', r.length === 2 && r.some((t) => t.id === a.id) && !r.some((t) => t.id === b.id))
  tjek('anden plante er ikke en dublet', r.some((t) => t.id === c.id))
  const udfoertA = { ...a, id: 'x1', status: 'completed' as const }
  const udfoertB = { ...a, id: 'x2', status: 'completed' as const }
  tjek('udførte røres aldrig (historikken skrumper ikke)', fjernDubletter([udfoertA, udfoertB]).length === 2)
  tjek('samme id to gange → én', fjernDubletter([a, a]).length === 1)
}

console.log('\n6. Dubletter — afledt råd mod opgave (samme plante og aktivitet)')
{
  const opg = opgave({ date: '2026-11-10', title: 'Plant ud', taskType: 'plant_out', linkedPlantId: 'p1' })
  const raad = handling({ taskType: 'udplant', plantId: 'p1', titel: 'Plant Tomat ud' })
  const andenPlante = handling({ taskType: 'udplant', plantId: 'p2', titel: 'Plant Chili ud', taskKey: `p2:udplant:${IDAG}` })
  const andenAktivitet = handling({ taskType: 'hoest', plantId: 'p1', titel: 'Pluk Tomat nu', taskKey: `p1:hoest:${IDAG}` })
  const o = bygg({ tasks: [opg], dagensFokus: fokus({ fokus: [raad, andenPlante, andenAktivitet] }) })
  const titler = o.nu.dine.map((r) => (r.type === 'opgave' ? r.task.title : r.handling.titel))
  tjek('rådet skjules, når opgaven dækker samme plante og aktivitet', !titler.includes('Plant Tomat ud'))
  tjek('opgaven bevares', titler.includes('Plant ud'))
  tjek('et råd om en ANDEN plante skjules ikke', titler.includes('Plant Chili ud'))
  tjek('et råd om en anden aktivitet skjules ikke', titler.includes('Pluk Tomat nu'))
  const langtUde = opgave({ date: plusDage(IDAG, DEDUP_DAGE + 5), title: 'Plant ud', taskType: 'plant_out', linkedPlantId: 'p1' })
  const o2 = bygg({ tasks: [langtUde], dagensFokus: fokus({ fokus: [raad] }) })
  tjek('en opgave langt ude dækker ikke dagens råd', o2.nu.dine.some((r) => r.type === 'afledt'))
  const udfoertOpg = opgave({ date: '2026-11-10', status: 'completed', title: 'Plant ud', taskType: 'plant_out', linkedPlantId: 'p1' })
  const o3 = bygg({ tasks: [udfoertOpg], dagensFokus: fokus({ fokus: [raad] }) })
  tjek('en UDFØRT opgave dækker ikke et nyt råd', o3.nu.dine.some((r) => r.type === 'afledt'))
  tjek("'tjek-spiring' og 'daek' har ingen opgavetype (rene råd)", afledtTilOpgavetype('tjek-spiring') === null && afledtTilOpgavetype('daek') === null)
  tjek("'udplant' og 'plant-ud' svarer begge til plant_out", afledtTilOpgavetype('udplant') === 'plant_out' && afledtTilOpgavetype('plant-ud') === 'plant_out')
}

console.log('\n7. Afledte råd: udførte og vedligehold')
{
  const aaben = handling({ taskType: 'hoest', titel: 'Åben' })
  const gjort = handling({ taskType: 'udplant', titel: 'Gjort', udfoert: true, taskKey: `p1:udplant:${IDAG}` })
  const vand = handling({ taskType: 'watering', titel: 'Vand', lag: 5, taskKey: `p1:watering:${IDAG}` })
  const o = bygg({ dagensFokus: fokus({ fokus: [aaben, gjort], rytme: [vand] }) })
  tjek('udført i dag er ikke i Nu', !o.nu.dine.some((r) => r.type === 'afledt' && r.handling.titel === 'Gjort'))
  tjek('udført i dag er blandt de afledte til Udført', o.udfoert.afledte.some((h) => h.titel === 'Gjort'))
  tjek('vedligehold holdes ude af Dine opgaver', o.nu.vedligehold.length === 1 && !o.nu.dine.some((r) => r.type === 'afledt' && r.handling.titel === 'Vand'))
}

console.log('\n8. Forslag: generelle gøremål er forslag, ikke opgaver')
{
  const g1 = generel({ id: 'g1', priority: 'low' })
  const g2 = generel({ id: 'g2', priority: 'high' })
  const gAndenMaaned = generel({ id: 'g3', month: 3 })
  const gSkjult = generel({ id: 'g4', isHiddenByMe: true })
  const gInaktiv = generel({ id: 'g5', isActive: false })
  const o = bygg({ generalTasks: [g1, gAndenMaaned, g2, gSkjult, gInaktiv] })
  const ids = o.nu.forslag.map((f) => (f.type === 'generel' ? f.task.id : '?'))
  tjek('kun aktuel måned, aktive og ikke skjulte; højeste prioritet først', ids.join() === 'g2,g1')
  tjek('forslag tæller ikke med i Dine opgaver', o.nu.dine.length === 0)
  const tilfoejet = opgave({ date: '2026-11-15', source: 'general', sourceId: 'g2', title: 'Generel g2' })
  const o2 = bygg({ tasks: [tilfoejet], generalTasks: [g1, g2] })
  tjek('et allerede tilføjet gøremål er ikke længere et forslag', o2.nu.forslag.map((f) => (f.type === 'generel' ? f.task.id : '?')).join() === 'g1')
  tjek('...men er en opgave med den rigtige type-etiket', opgaveTypeLabel(tilfoejet) === 'Generel haveopgave')
  const udfoertGenerel = opgave({ date: '2026-11-02', status: 'completed', source: 'general', sourceId: 'g1', title: 'Generel g1' })
  const o3 = bygg({ tasks: [udfoertGenerel], generalTasks: [g1] })
  tjek('et UDFØRT generelt gøremål foreslås ikke igen samme år', o3.nu.forslag.length === 0)
  const sidsteAar = opgave({ date: '2025-11-02', status: 'completed', source: 'general', sourceId: 'g1', title: 'Generel g1' })
  const o4 = bygg({ tasks: [sidsteAar], generalTasks: [g1] })
  tjek('...men kommer igen næste år (gentagelse)', o4.nu.forslag.length === 1)
  const medEgenTitel = eget({ id: 'e1', title: 'Generel g1' })
  const o5 = bygg({ generalTasks: [g1], userTasks: [medEgenTitel] })
  tjek('brugerens eget gøremål med samme titel går forud for forslaget', o5.nu.forslag.filter((f) => f.type === 'generel').length === 0 && o5.nu.forslag.some((f) => f.type === 'eget'))
  const medAaben = opgave({ date: '2026-11-20', title: 'Generel g1' })
  const o6 = bygg({ tasks: [medAaben], generalTasks: [g1] })
  tjek('en åben opgave med samme titel gør forslaget overflødigt', o6.nu.forslag.length === 0)
}

console.log('\n9. Kommende forslag = næste måned (også over årsskiftet)')
{
  const dec = generel({ id: 'd1', month: 12 })
  const nov = generel({ id: 'n1', month: 11 })
  const o = bygg({ generalTasks: [dec, nov] })
  tjek('november → december', o.kommende.forslag.length === 1 && o.kommende.forslag[0].type === 'generel' && o.kommende.forslag[0].task.id === 'd1')
  const jan = generel({ id: 'j1', month: 1 })
  const o2 = bygg({ generalTasks: [jan, nov], month: 12, year: 2026, today: '2026-12-10' })
  tjek('december → januar', o2.kommende.forslag.length === 1 && o2.kommende.forslag[0].type === 'generel' && o2.kommende.forslag[0].task.id === 'j1')
  const tilfoejetJan = opgave({ date: '2027-01-05', source: 'general', sourceId: 'j1', title: 'Generel j1' })
  const o3 = bygg({ tasks: [tilfoejetJan], generalTasks: [jan], month: 12, year: 2026, today: '2026-12-10' })
  tjek('tilføjet til januar 2027 foreslås ikke igen', o3.kommende.forslag.length === 0)
}

console.log('\n10. Frøbank: invitationer er forslag — aldrig opgaver')
{
  const inv = handling({ taskType: 'saa', plantId: null, titel: 'Så Salat', taskKey: `inv:salat:${IDAG}`, href: '/froebank' })
  const o = bygg({ dagensFokus: fokus({ fokus: [inv] }) })
  tjek('invitationen er et forslag', o.nu.forslag.some((f) => f.type === 'froebank'))
  tjek('og står ikke i Dine opgaver', o.nu.dine.length === 0)
  tjek('og ingen calendar_tasks oprettes (ingen opgaver i Kommende)', o.kommende.opgaver.length === 0)
}

console.log('\n11. Brugerens egne gøremål')
{
  const e1 = eget({ id: 'e1', month: 11 })
  const e2 = eget({ id: 'e2', month: 3 })
  const o = bygg({ userTasks: [e1, e2] })
  tjek('kun aktuel måned', o.nu.forslag.length === 1 && o.nu.forslag[0].type === 'eget')
  const manuel = opgave({ date: IDAG, source: 'manual', title: 'Egen opgave' })
  tjek("en egen daterede opgave får etiketten 'Din opgave'", opgaveTypeLabel(manuel) === 'Din opgave')
  const plante = opgave({ date: IDAG, source: 'plant', linkedPlantId: 'p1' })
  tjek("en planteopgave får etiketten 'Planteopgave'", opgaveTypeLabel(plante) === 'Planteopgave')
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
