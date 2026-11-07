/**
 * Opgaver: gruppering efter dyrkning (plante-id), dyrkningssted fra såningerne
 * og de aftalte forslag. Kør: npx tsx scripts/test-opgaver-grupper.ts
 *
 * Baggrund (accepttest 4, 7/11 2026): Engelsk spinat sået samme dag i to
 * dyrkninger — drivhus og friland — gav to ens lister. "Drivhus"/"Direkte friland"
 * står i sowing_events.container_type ("Sået i"), ikke i plants_v2.location.
 * Fixturerne herunder er de to rigtige dyrkninger (id'er forkortet).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { byggDyrkninger, dyrkningsSted } from '../src/lib/dyrkning-info'
import {
  bygListeElementer, bygOpgaveOversigt, fjernDubletter, grupperEfterPlante, opdelForsinkede, raekkeDato,
  type DineRaekke,
} from '../src/lib/opgaver-mvp'
import type { CalendarTask } from '../src/lib/types'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}
const laes = (sti: string) => readFileSync(join(__dirname, '..', sti), 'utf8')

// ── De to rigtige spinatdyrkninger ────────────────────────────────────────
const DRIVHUS = '9da2ffb4'
const FRILAND = '8b792915'
const planter = [
  { id: DRIVHUS, name: 'Spinat', variety: 'Engelsk spinat', location: 'Vandingskasse', sowDate: '2026-11-06' },
  { id: FRILAND, name: 'Spinat', variety: 'Engelsk spinat', location: null, sowDate: '2026-11-06' },
]
const saaninger = [
  { plantId: DRIVHUS, containerType: 'Drivhus', location: 'Vandingskasse', sowingDate: '2026-11-06', createdAt: '2026-11-06T20:38:12Z' },
  { plantId: FRILAND, containerType: 'Direkte friland', location: null, sowingDate: '2026-11-06', createdAt: '2026-11-06T20:38:56Z' },
]

console.log('\n[De to spinatdyrkninger — hvor står stedet?]')
const d = byggDyrkninger(planter, saaninger)
tjek('drivhus-dyrkningen: "Sået i" = Drivhus', d[DRIVHUS].container === 'Drivhus')
tjek('drivhus-dyrkningen: placering = Vandingskasse', d[DRIVHUS].sted === 'Vandingskasse')
tjek('friland-dyrkningen: "Sået i" = Direkte friland', d[FRILAND].container === 'Direkte friland')
tjek('friland-dyrkningen har INGEN placering (plants_v2.location er tom)', d[FRILAND].sted === null)
tjek('sådato findes på begge', d[DRIVHUS].saadato === '2026-11-06' && d[FRILAND].saadato === '2026-11-06')
tjek('stedet skiller de to: "Drivhus · Vandingskasse" mod "Direkte friland"', dyrkningsSted(d[DRIVHUS]) === 'Drivhus · Vandingskasse' && dyrkningsSted(d[FRILAND]) === 'Direkte friland')
tjek('hvis kun plants_v2.location blev læst, ville friland intet vise (rodårsagen)', planter[1].location === null)

console.log('\n[Såninger knyttes entydigt til plante-id]')
const flere = byggDyrkninger(
  [{ id: 'p1', name: 'Tomat' }, { id: 'p2', name: 'Tomat' }],
  [
    { plantId: 'p1', containerType: 'Potte', sowingDate: '2026-03-10', createdAt: '2026-03-10T08:00:00Z' },
    { plantId: 'p1', containerType: 'drivhus', sowingDate: '2026-04-01', createdAt: '2026-04-01T08:00:00Z' },
    { plantId: 'p1', containerType: 'Drivhus', sowingDate: '2026-04-02', createdAt: '2026-04-02T08:00:00Z' },
    { plantId: 'p2', containerType: 'Højbed', sowingDate: '2026-04-05', createdAt: '2026-04-05T08:00:00Z' },
    { plantId: 'ukendt', containerType: 'Bakke', sowingDate: '2026-04-05', createdAt: '2026-04-05T08:00:00Z' },
  ],
)
tjek('en såning hører kun til planten med samme id', flere.p2.container === 'Højbed' && !flere.p1.container?.includes('Højbed'))
tjek('flere såninger: forskellige værdier i rækkefølge, hver kun én gang (uanset store/små bogstaver)', flere.p1.container === 'Potte / drivhus')
tjek('såning for ukendt plante ignoreres', !('ukendt' in flere))
tjek('ældste såning bestemmer sådatoen, når planten ingen har', flere.p1.saadato === '2026-03-10')
const rakkefoelge = byggDyrkninger(
  [{ id: 'p', name: 'X' }],
  [
    { plantId: 'p', containerType: 'B', sowingDate: '2026-05-01', createdAt: '2026-05-02T00:00:00Z' },
    { plantId: 'p', containerType: 'A', sowingDate: '2026-05-01', createdAt: '2026-05-01T00:00:00Z' },
  ],
)
tjek('samme dato: oprettelsestidspunktet afgør rækkefølgen (entydigt)', rakkefoelge.p.container === 'A / B')
const ingen = byggDyrkninger([{ id: 'z', name: 'Kartoffel', variety: '  ', location: '  ' }], [])
tjek('uden såninger og placering: tomme felter bliver null, ikke tomme strenge', ingen.z.container === null && ingen.z.sted === null && ingen.z.variety === null && ingen.z.saadato === null)
const eventSted = byggDyrkninger([{ id: 'q', name: 'Y' }], [{ plantId: 'q', containerType: null, location: ' Højbed 2 ', sowingDate: '2026-05-01' }])
tjek('placering falder tilbage til såningens, når planten ingen har', eventSted.q.sted === 'Højbed 2')
tjek('sted og "sået i" ens → vises kun én gang', dyrkningsSted({ container: 'Drivhus', sted: 'drivhus' }) === 'Drivhus')
tjek('intet sted → null', dyrkningsSted({ container: null, sted: null }) === null && dyrkningsSted(null) === null)

console.log('\n[Gruppering: aldrig på sort, sted eller dato — kun plante-id]')
type R = { id: string; plant: string | null; titel: string; dato: string; sort: string; sted: string }
const r = (id: string, plant: string | null, titel = 'Vanding af spinat', dato = '2027-03-01'): R =>
  ({ id, plant, titel, dato, sort: 'Engelsk spinat', sted: 'x' })
const a = grupperEfterPlante([r('1', 'A'), r('2', 'B'), r('3', 'A'), r('4', 'B')], (x) => x.plant)
tjek('to dyrkninger med samme titel, sort og dato giver to grupper', a.length === 2 && a.every((g) => g.type === 'gruppe'))
tjek('hver gruppe har kun sin egen plantes rækker', a.every((g) => g.type === 'gruppe' && g.items.every((i) => i.plant === g.plantId)))
tjek('en række alene står som enkeltstående række', grupperEfterPlante([r('1', 'A'), r('2', 'A'), r('3', 'B')], (x) => x.plant).map((g) => g.type).join() === 'gruppe,enkelt')
tjek('rækker uden plante (egne opgaver) grupperes aldrig', grupperEfterPlante([r('1', null), r('2', null)], (x) => x.plant).every((g) => g.type === 'enkelt'))
const orden = grupperEfterPlante([r('1', 'A'), r('2', null), r('3', 'B'), r('4', 'A'), r('5', 'B')], (x) => x.plant)
tjek('en gruppe står, hvor dens første række stod', orden.map((g) => (g.type === 'gruppe' ? `G:${g.plantId}` : `E:${g.item.id}`)).join() === 'G:A,E:2,G:B')
tjek('rækkefølgen i gruppen er inputtets (kronologiske)', orden[0].type === 'gruppe' && orden[0].items.map((i) => i.id).join() === '1,4')
tjek('ingen række forsvinder eller dubleres', grupperEfterPlante([r('1', 'A'), r('2', 'B'), r('3', 'A'), r('4', null)], (x) => x.plant)
  .flatMap((g) => (g.type === 'gruppe' ? g.items : [g.item])).map((i) => i.id).sort().join() === '1,2,3,4')
tjek('tom liste giver tom liste', grupperEfterPlante<R>([], (x) => x.plant).length === 0)

console.log('\n[De rigtige opgaver: 6 + 6 med ens titler og datoer]')
const titler: [string, string, string][] = [
  ['Vanding af spinat', '2027-03-01', 'watering'], ['Gødning af spinat', '2027-03-01', 'fertilizing'],
  ['Ukrudtsbekæmpelse', '2027-03-01', 'weeding'], ['Kontrol for skadedyr', '2027-04-01', 'pest_check'],
  ['Høst forårs-spinat', '2027-05-01', 'harvest'], ['Høst efterårs-spinat', '2027-09-01', 'harvest'],
]
let n = 0
const opg = (plant: string, [title, date, type]: [string, string, string]): CalendarTask => {
  n++
  return {
    id: `t${n}`, userId: 'u', title, date, taskType: type, priority: 'medium', status: 'open', source: 'plant',
    isRecurring: false, linkedPlantId: plant, createdAt: '2026-11-06T20:39:00Z', updatedAt: '2026-11-06T20:39:00Z',
  } as unknown as CalendarTask
}
const alle = [...titler.map((t) => opg(DRIVHUS, t)), ...titler.map((t) => opg(FRILAND, t))]
const o = bygOpgaveOversigt({
  tasks: alle, dagensFokus: { trin: 2, fokus: [], flere: [], stilhed: false, rytme: [] },
  generalTasks: [], userTasks: [], today: '2026-11-07', month: 11, year: 2026,
})
tjek('alle 12 opgaver er Kommende — ingen forsvinder som "dubletter"', fjernDubletter(alle).length === 12 && o.kommende.opgaver.length === 12)
const grupper = grupperEfterPlante(o.kommende.opgaver, (t) => t.linkedPlantId)
tjek('de 12 opgaver bliver to grupper', grupper.length === 2 && grupper.every((g) => g.type === 'gruppe'))
tjek('hver gruppe har sine 6 opgaver, hver med eget id og egen dato', grupper.every((g) => g.type === 'gruppe' && g.items.length === 6 && new Set(g.items.map((i) => i.id)).size === 6))
tjek('opgaver i en gruppe forbliver kronologiske', grupper.every((g) => g.type === 'gruppe' && g.items.map((i) => i.date).join() === [...g.items.map((i) => i.date)].sort().join()))

console.log('\n[Rækkefølge: det, der skal gøres først, står først]')
{
  type T = { id: string; plant: string | null; dato: string }
  const t = (id: string, plant: string | null, dato: string): T => ({ id, plant, dato })
  const dato = (x: T) => x.dato
  const pid = (x: T) => x.plant

  const g1 = grupperEfterPlante([t('1', 'A', '2027-03-01'), t('2', 'B', '2026-12-01'), t('3', 'A', '2026-11-20')], pid, dato)
  tjek('grupper står efter deres tidligste dato (A har 20. nov og kommer før B)', g1.map((g) => (g.type === 'gruppe' ? `G${g.plantId}` : `E${g.item.plant}`)).join() === 'GA,EB')
  tjek('rækkerne i en gruppe står kronologisk', g1[0].type === 'gruppe' && g1[0].items.map((i) => i.id).join() === '3,1')
  const g2 = grupperEfterPlante([t('1', 'A', '2026-12-10'), t('2', 'A', '2026-12-12'), t('3', null, '2026-11-25'), t('4', 'B', '2026-11-20'), t('5', 'B', '2027-01-01')], pid, dato)
  tjek('enkeltstående rækker indgår i den kronologiske rækkefølge', g2.map((g) => (g.type === 'gruppe' ? `G${g.plantId}` : `E${g.item.id}`)).join() === 'GB,E3,GA')
  const g3 = grupperEfterPlante([t('hoej', 'A', '2026-11-10'), t('lav', 'B', '2026-11-10'), t('b2', 'B', '2026-11-12'), t('a2', 'A', '2026-11-12')], pid, dato)
  tjek('lige dato: inputtets rækkefølge (prioritet) gælder', g3.map((g) => (g.type === 'gruppe' ? g.plantId : '?')).join() === 'A,B')
  const uden = grupperEfterPlante([t('1', 'A', '2027-03-01'), t('2', 'B', '2026-12-01'), t('3', 'A', '2026-11-20')], pid)
  tjek('uden datoOf (Udført) bevares rækkefølgen: gruppen står, hvor første række stod', uden.map((g) => (g.type === 'gruppe' ? `G${g.plantId}` : `E${g.item.plant}`)).join() === 'GA,EB' && uden[0].type === 'gruppe' && uden[0].items.map((i) => i.id).join() === '1,3')
  const stabil = grupperEfterPlante([t('1', 'A', '2026-11-10'), t('2', 'A', '2026-11-10'), t('3', 'A', '2026-11-10')], pid, dato)
  tjek('samme dato i en gruppe: inputtets rækkefølge bevares (stabil)', stabil[0].type === 'gruppe' && stabil[0].items.map((i) => i.id).join() === '1,2,3')

  // Tilfældige lister (fast frø): intet forsvinder, intet dubleres, rækkefølgen er kronologisk.
  let frø = 12345
  const tilfaeldig = (maks: number) => { frø = (frø * 1103515245 + 12345) % 2147483648; return frø % maks }
  let brudt = ''
  for (let k = 0; k < 300 && !brudt; k++) {
    const antalRaekker = tilfaeldig(25)
    const liste = Array.from({ length: antalRaekker }, (_, i) => {
      const p = tilfaeldig(6)
      return t(`r${i}`, p === 5 ? null : `P${p}`, `2026-${String(1 + tilfaeldig(12)).padStart(2, '0')}-${String(1 + tilfaeldig(28)).padStart(2, '0')}`)
    })
    const els = bygListeElementer(liste, pid, dato)
    const flade = els.flatMap((e) => e.items)
    if (flade.length !== liste.length) brudt = `antal ${flade.length} ≠ ${liste.length}`
    else if (new Set(flade.map((i) => i.id)).size !== liste.length) brudt = 'dublet eller manglende række'
    else if (els.some((e) => e.art === 'gruppe' && (e.items.length < 2 || e.items.some((i) => i.plant !== e.plantId)))) brudt = 'gruppe med <2 rækker eller forkert plante-id'
    else if (els.some((e) => e.art === 'gruppe' && e.items.some((i, j, a) => j > 0 && a[j - 1].dato > i.dato))) brudt = 'gruppe ikke kronologisk'
    else {
      const bl = grupperEfterPlante(liste, pid, dato)
      const nogler = bl.map((b) => (b.type === 'gruppe' ? b.items[0].dato : b.item.dato))
      if (nogler.some((n, j) => j > 0 && nogler[j - 1] > n)) brudt = 'blokke ikke efter tidligste dato'
      const plantMedFlere = new Set(liste.map(pid).filter((p, _, a) => p && a.filter((x) => x === p).length >= 2))
      if (!brudt && els.filter((e) => e.art === 'gruppe').length !== plantMedFlere.size) brudt = 'forkert antal grupper'
    }
  }
  tjek('300 tilfældige lister: intet skjules, intet dubleres, grupper og rækker er kronologiske', brudt === '', brudt)

  // Nu: forsinkede opgaver under "Kræver handling" med rigtige regler.
  const IDAG = '2026-11-07'
  let m = 0
  const o2 = (plant: string | null, date: string, priority: 'low' | 'medium' | 'high' = 'medium', created = '2026-01-01'): CalendarTask => {
    m++
    return {
      id: `n${m}`, userId: 'u', title: `Opgave ${m}`, date, taskType: 'custom', priority, status: 'open', source: 'plant',
      isRecurring: false, linkedPlantId: plant, createdAt: `${created}T08:00:00Z`, updatedAt: `${created}T08:00:00Z`,
    } as unknown as CalendarTask
  }
  const opgaver = [
    o2('A', '2026-09-01'), o2('A', '2026-06-01'), o2('B', '2026-08-01', 'high'), o2('C', '2026-05-01', 'low'),
    o2('C', '2026-10-10', 'low'), o2('A', IDAG), o2('B', '2026-11-09'), o2(null, '2026-11-08'),
  ]
  const raad = { id: 'h1', taskKey: 'B:hoest:x', lag: 2, taskType: 'hoest', titel: 'Pluk B', hvorfor: 'x', plantId: 'B', udfoert: false, href: '/mine-planter/B', beroerer: 1, guidePrioritet: 0 }
  const ov = bygOpgaveOversigt({
    tasks: opgaver, dagensFokus: { trin: 2, fokus: [raad as never], flere: [], stilhed: false, rytme: [] },
    generalTasks: [], userTasks: [], today: IDAG, month: 11, year: 2026,
  })
  const { forsinkede, nu } = opdelForsinkede(ov.nu.dine)
  const dineDato = (r: DineRaekke) => raekkeDato(r, IDAG)
  const pidR = (r: DineRaekke) => (r.type === 'afledt' ? r.handling.plantId : r.task.linkedPlantId ?? null)
  const fe = bygListeElementer(forsinkede, pidR, dineDato)
  const ne = bygListeElementer(nu, pidR, dineDato)
  tjek('forsinkede er kun forsinkede; resten står under Nu — ingen forsvinder', forsinkede.every((r) => r.type === 'opgave' && r.forsinket) && forsinkede.length + nu.length === ov.nu.dine.length)
  tjek('forsinkede grupper og rækker står efter den ægte dato (mest forsinkede først)', fe.map((e) => (e.art === 'gruppe' ? `G${e.plantId}` : `E${(e.items[0] as { task: CalendarTask }).task.linkedPlantId}`)).join() === 'GC,GA,EB', fe.map((e) => e.art + e.items.length).join())
  tjek('gruppen C: 1. maj før 10. okt', fe[0].art === 'gruppe' && (fe[0].items as { task: CalendarTask }[]).map((r) => r.task.date).join() === '2026-05-01,2026-10-10')
  tjek('gruppen A: 1. jun før 1. sep (ikke i indsættelsesrækkefølge)', fe[1].art === 'gruppe' && (fe[1].items as { task: CalendarTask }[]).map((r) => r.task.date).join() === '2026-06-01,2026-09-01')
  tjek('højt prioriteret forsinket (B, 1. aug) overhaler ikke en ældre forsinket gruppe', fe[fe.length - 1].items.length === 1 && (fe[fe.length - 1].items[0] as { task: CalendarTask }).task.priority === 'high')
  tjek('forsinkede ligger altid før Nu-rækkerne i den samlede liste', [...forsinkede, ...nu].map((r) => r.type === 'opgave' && r.forsinket).join().indexOf('false,true') === -1)
  tjek('Nu: dagens opgave (A) og gruppen med dagens råd (B) kommer før den enkelte opgave 8. nov', ne.map((e) => e.art).join() === 'enkelte,gruppe,enkelte' && ne[1].art === 'gruppe' && ne[1].plantId === 'B')
  tjek('Nu: i gruppe B står dagens råd før opgaven 9. nov', ne[1].art === 'gruppe' && (ne[1].items as DineRaekke[]).map((r) => r.type).join() === 'afledt,opgave')
  tjek('hver række har stadig sit eget plante-id', [...fe, ...ne].every((e) => e.art !== 'gruppe' || e.items.every((r) => pidR(r as DineRaekke) === e.plantId)))
  tjek('antallet i Nu er uændret af grupperingen', fe.flatMap((e) => e.items).length + ne.flatMap((e) => e.items).length === ov.nu.dine.length)
  const kom = bygOpgaveOversigt({ tasks: [o2('A', '2027-03-01'), o2('B', '2026-12-01'), o2('A', '2026-12-20'), o2('B', '2027-01-05')], dagensFokus: { trin: 2, fokus: [], flere: [], stilhed: false, rytme: [] }, generalTasks: [], userTasks: [], today: IDAG, month: 11, year: 2026 }).kommende.opgaver
  const ke = bygListeElementer(kom, (x) => x.linkedPlantId, (x) => x.date)
  tjek('Kommende: gruppen med den tidligste dato (B, 1. dec) står først', ke[0].art === 'gruppe' && ke[0].plantId === 'B')
  tjek('Kommende: antallet er uændret', ke.flatMap((e) => e.items).length === kom.length && kom.length === 4)
  const afsluttet = (id: string, plant: string, klokken: string): CalendarTask => ({ ...o2(plant, '2026-10-01'), id, status: 'completed', completedAt: klokken } as CalendarTask)
  const ud = bygOpgaveOversigt({ tasks: [afsluttet('x1', 'A', '2026-11-01T10:00:00Z'), afsluttet('x2', 'B', '2026-11-05T10:00:00Z'), afsluttet('x3', 'A', '2026-11-06T10:00:00Z'), afsluttet('x4', 'B', '2026-11-02T10:00:00Z')], dagensFokus: { trin: 2, fokus: [], flere: [], stilhed: false, rytme: [] }, generalTasks: [], userTasks: [], today: IDAG, month: 11, year: 2026 }).udfoert.opgaver
  const ue = bygListeElementer(ud, (x) => x.linkedPlantId)
  tjek('Udført: senest afsluttet øverst, også for grupper', ue[0].art === 'gruppe' && ue[0].plantId === 'A' && ue[0].items.map((x) => x.id).join() === 'x3,x1')
  tjek('Udført: antallet er uændret', ue.flatMap((e) => e.items).length === ud.length && ud.length === 4)
}

console.log('\n[Komponent og dataflow]')
const op = laes('src/components/havekalender/opgaver-mvp.tsx')
tjek('Nu, Kommende og Udført bruger samme gruppering', (op.match(/<Raekkeliste /g) ?? []).length >= 5 && /bygListeElementer\(rows, plantIdAf, datoOf\)/.test(op))
tjek('gruppen bygges på plante-id, ikke på titel/sort', /plantIdAf\(r: Raekke\)[\s\S]{0,200}linkedPlantId/.test(op) && !/grupperEfterPlante\([^)]*(variety|title|date)/.test(op))
tjek('gruppeoverskriften viser art/sort, sted og sådato', /Sået \$\{formatDatoKort\(d\.saadato\)\}/.test(op) && /dyrkningsSted\(d\)/.test(op))
tjek('hver række beholder sin egen dato og afkrydsning (OpgaveRaekke/UdfoertRaekke/AfledtRaekke)', /completeTask\(task\.id\)/.test(op) && /uncompleteTask\(task\.id\)/.test(op) && /onToggle=\{\(\) => ctx\.toggle\(row\.handling\)\}/.test(op))
tjek('forsinkede datoer er diskret terracotta', /const TERRACOTTA = '#A3563A'/.test(op) && /color: forsinket \? TERRACOTTA/.test(op))
tjek('datoer i andre år vises med årstal', /formatDatoMedAar/.test(op) && /date\.slice\(0, 4\) === today\.slice\(0, 4\)/.test(op))
const page = laes('src/app/(app)/kalender/page.tsx')
tjek('siden henter såningerne kun i MVP-visningen', /MVP_OPGAVER\.enkelVisning \? getSowingEventsForUser\(\) : Promise\.resolve\(\[\]\)/.test(page))
tjek('siden bygger dyrkningerne af eksisterende planter + såninger', /dyrkninger=\{byggDyrkninger\(plants, saaninger\)\}/.test(page))
const se = laes('src/actions/sowing-events.ts')
const fn = se.slice(se.indexOf('export async function getSowingEventsForUser'), se.indexOf('export async function getSowingEventsForPlant'))
tjek('opslaget er læsende og afgrænset til brugeren', /\.select\('plant_id, container_type, location, sowing_date, created_at'\)/.test(fn) && /\.eq\('user_id', user\.id\)/.test(fn) && !/\.(insert|update|delete|upsert)\(/.test(fn))

console.log('\n[Månedens forslag]')
tjek('den gentagne linje "Generel haveopgave · måned" er væk', !/Generel haveopgave/i.test(op) && !/GENEREL HAVEOPGAVE/.test(op))
tjek('hele den praktiske forklaring vises (ingen line-clamp)', /\{g\.description && \(\s*<p className="mt-1 text-\[13px\] leading-snug text-muted-foreground">\{g\.description\}<\/p>/.test(op) && !/line-clamp-2/.test(op))
tjek('kompakt "+ Tilføj"-handling', /<Plus className="h-3\.5 w-3\.5" \/> Tilføj/.test(op))
tjek('"Ikke relevant" er bevaret som diskret sekundær handling', />\s*Ikke relevant\s*</.test(op) && /text-\[12\.5px\] text-muted-foreground\/80/.test(op))
tjek('ingen stiplet ramme om forslagene', !/border-dashed border-border bg-card\/60/.test(op) && /divide-y divide-border\/50/.test(op))
tjek('overskriften forklarer, at forslagene er valgfrie', /Valgfrie forslag til \$\{maanedNavn\.toLowerCase\(\)\}/.test(op) && /Valgfrie forslag til \$\{naesteNavn\.toLowerCase\(\)\}/.test(op))

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
process.exit(fejlet > 0 ? 1 : 0)
