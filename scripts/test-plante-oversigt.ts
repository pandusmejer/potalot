/**
 * Mine planters kompakte oversigt + kort dyrkningsguide (MVP 1.0, fase 2).
 * Kør: npx tsx scripts/test-plante-oversigt.ts
 */
import {
  grupperPlanter, naesteOpgavePrPlante, opgaverTilPlante, sammenlignDyrkning,
  erOpgaveForsinket,
} from '../src/lib/plante-oversigt'
import { formatMaaneder, kortGuideForPlante } from '../src/lib/plante-kort-guide'
import type { CalendarTask, Plant } from '../src/lib/types'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean) {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.log(`  ✗ ${navn}`) }
}

let n = 0
function plante(o: Partial<Plant> & { name: string }): Plant {
  n++
  return {
    id: `pl${n}`, userId: 'u', status: 'saaet', quantity: 1, imageIds: [], logIds: [],
    isArchived: false, createdAt: `2026-05-${String(n).padStart(2, '0')}`, updatedAt: '2026-05-01',
    ...o,
  }
}
function opgave(o: Partial<CalendarTask> & { id: string; date: string }): CalendarTask {
  return {
    userId: 'u', title: 'Opgave', taskType: 'custom', priority: 'medium', status: 'open',
    source: 'plant', isRecurring: false, createdAt: '2026-05-01', updatedAt: '2026-05-01',
    ...o,
  } as CalendarTask
}

console.log('\n1. Livscyklus-gruppering')
{
  const g = grupperPlanter([
    plante({ name: 'Tomat', status: 'saaet' }),
    plante({ name: 'Salat', status: 'hoestklar' }),
    plante({ name: 'Basilikum', status: 'planlagt' }),
    plante({ name: 'Radise', status: 'afsluttet' }),
    plante({ name: 'Agurk', status: 'i_vaekst', isArchived: true }),
  ])
  tjek('sået og høstklar er i dyrkning', g.dyrkes.length === 2)
  tjek('planlagt står for sig', g.planlagte.length === 1 && g.planlagte[0].name === 'Basilikum')
  tjek("afsluttet er 'klar til arkiv'", g.klarTilArkiv.length === 1)
  tjek('arkiverede indgår aldrig', ![...g.dyrkes, ...g.planlagte, ...g.klarTilArkiv].some((p) => p.name === 'Agurk'))
}

console.log('\n2. Flere dyrkninger af SAMME sort er separate rækker')
{
  const a = plante({ name: 'Tomat', variety: 'Sungold', sowDate: '2026-03-20', location: 'Vindueskarm', sourceElementId: 'frø-1' })
  const b = plante({ name: 'Tomat', variety: 'Sungold', sowDate: '2026-05-10', location: 'Højbed', sourceElementId: 'frø-1' })
  const c = plante({ name: 'Tomat', variety: 'Sungold', sowDate: null })
  const g = grupperPlanter([a, c, b])
  tjek('alle tre dyrkninger er med (ingen sammenlægning)', g.dyrkes.length === 3)
  tjek('nyeste sådato først, uden dato sidst', g.dyrkes.map((p) => p.id).join() === [b.id, a.id, c.id].join())
  tjek('begge dyrkninger peger stadig på den oprindelige frøpose', g.dyrkes.filter((p) => p.sourceElementId === 'frø-1').length === 2)
  tjek('placeringen skiller dem ad', new Set(g.dyrkes.map((p) => p.location)).size === 3)
}

console.log('\n3. Rækkefølge: art A–Å, sort A–Å (dansk alfabet)')
{
  const liste = [
    plante({ name: 'Tomat', variety: 'Sungold' }),
    plante({ name: 'Agurk', variety: 'Åkirke' }),
    plante({ name: 'Agurk', variety: 'Marketmore' }),
    plante({ name: 'Chili', variety: 'Ærø' }),
  ].sort(sammenlignDyrkning).map((p) => `${p.name} ${p.variety}`)
  tjek('Agurk Marketmore, Agurk Åkirke, Chili Ærø, Tomat Sungold',
    liste.join('|') === 'Agurk Marketmore|Agurk Åkirke|Chili Ærø|Tomat Sungold')
}

console.log('\n4. Næste opgave pr. plante')
{
  const a = plante({ name: 'Tomat' })
  const b = plante({ name: 'Salat' })
  const tasks = [
    opgave({ id: 't1', date: '2026-06-10', linkedPlantId: a.id, title: 'Plant ud' }),
    opgave({ id: 't2', date: '2026-05-20', linkedPlantId: a.id, title: 'Prikl om' }),
    opgave({ id: 't3', date: '2026-05-01', linkedPlantId: a.id, status: 'completed', title: 'Så' }),
    opgave({ id: 't4', date: '2026-05-02', linkedPlantId: a.id, status: 'skipped', title: 'Sprunget over' }),
    opgave({ id: 't5', date: '2026-07-01', linkedPlantId: null, title: 'Uden plante' }),
  ]
  const m = naesteOpgavePrPlante(tasks)
  tjek('tidligste ÅBNE opgave vinder (ikke udført, ikke sprunget over)', m.get(a.id)?.id === 't2')
  tjek('plante uden opgaver er ikke i kortet', !m.has(b.id))
  tjek('opgaver uden plante ignoreres', m.size === 1)
  tjek('en forsinket opgave er stadig næste', naesteOpgavePrPlante([
    opgave({ id: 'f1', date: '2026-04-01', linkedPlantId: a.id }),
    opgave({ id: 'f2', date: '2026-09-01', linkedPlantId: a.id }),
  ]).get(a.id)?.id === 'f1')
  tjek('forsinket = dato før i dag', erOpgaveForsinket({ date: '2026-05-20' }, '2026-06-01') && !erOpgaveForsinket({ date: '2026-06-01' }, '2026-06-01'))
  const p = opgaverTilPlante(tasks.filter((t) => t.linkedPlantId === a.id))
  tjek('detaljeside: åbne tidligst først, udførte tælles men vises ikke',
    p.aabne.map((t) => t.id).join() === 't2,t1' && p.antalAabne === 2 && p.antalUdfoert === 1)
  const mange = Array.from({ length: 8 }, (_, i) => opgave({ id: `m${i}`, date: `2026-06-0${i + 1}`, linkedPlantId: a.id }))
  const lim = opgaverTilPlante(mange, 5)
  tjek('højst 5 vises, men det samlede antal åbne bevares', lim.aabne.length === 5 && lim.antalAabne === 8)
}

console.log('\n5. Måneder')
{
  tjek("sammenhængende → 'maj–jun'", formatMaaneder([5, 6]) === 'maj–jun')
  tjek("hul → liste 'mar, maj'", formatMaaneder([3, 5]) === 'mar, maj')
  tjek("én måned → 'jul'", formatMaaneder([7]) === 'jul')
  tjek('tom liste → tom streng', formatMaaneder([]) === '')
}

console.log('\n6. Kort dyrkningsguide: arv fra artsguide til sortsguide')
{
  const sort = kortGuideForPlante('Ært', 'Sugar Snap')
  tjek('kendt sort giver en guide', sort != null && sort.raekker.length > 0)
  tjek("kilden nævner sorten og arven fra arten", !!sort && sort.kilde.includes('Sugar Snap') && sort.kilde.includes('arv fra ært'))
  tjek('kendt sort har ingen forklarende note', sort?.note === null)
  const art = kortGuideForPlante('Ært', 'Opfundet Sort Der Ikke Findes')
  tjek('ukendt sort falder tilbage til artsguiden', art != null && art.kilde === 'Fra artsguiden for ært')
  tjek('...og siger det ærligt', !!art?.note && art.note.includes('ikke i biblioteket'))
  tjek('...uden sortsspecifikke rækker (de findes kun på sortens egen guide)', art?.sortRaekker.length === 0)
  tjek('ukendt art giver ingen guide (tavshed, ingen gæt)', kortGuideForPlante('Plante Der Ikke Findes') === null)
  tjek("'Bønner' finder artsguiden via artsmodellen", kortGuideForPlante('Bønner') != null)
  const labels = (art?.raekker ?? []).map((r) => r.label)
  tjek('kun kendte felter vises — ingen tomme rækker', (art?.raekker ?? []).every((r) => r.value.trim() !== ''))
  tjek('rækkerne er blandt de aftalte', labels.every((l) => ['Lys', 'Vanding', 'Jord', 'Afstand', 'Såning', 'Udplantning', 'Høst', 'Frost'].includes(l)))
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
