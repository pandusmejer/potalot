/**
 * Permanent test af backfill af eksisterende frøposter. Køres af `npm test`.
 *
 * Det vigtigste her er hvad backfill IKKE gør. Motoren skriver i brugerens
 * egne rækker, så hver regel om urørlighed skal have sin egen test:
 * poseoplysninger røres aldrig, udfyldte felter røres aldrig, og et
 * eksplicit 0 eller nej er en værdi — ikke et tomt felt.
 */
import {
  foreslaaBackfill,
  backfillOpdatering,
  antalFelterIAlt,
  erTomt,
  BACKFILL_FELTER,
  type BackfillFelt,
} from '@/lib/froebank-backfill'
import type { InventoryItem } from '@/lib/types'

let bestået = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje?: string) {
  if (ok) {
    bestået++
    console.log(`  ✓ ${navn}`)
  } else {
    fejlet++
    console.log(`  ✗ ${navn}${detalje ? ` — ${detalje}` : ''}`)
  }
}

let n = 0
/** Frøpose med alle dyrkningsfelter tomme, med mindre andet er givet. */
function pose(p: Partial<InventoryItem> = {}): InventoryItem {
  n++
  return {
    id: p.id ?? `pose-${n}`,
    userId: 'u1',
    name: 'Tomat',
    variety: null,
    primaryCategoryId: 'fro',
    sowingMonths: [],
    sowingDepthMm: null,
    preCultivation: null,
    plantingOutMonths: [],
    harvestMonths: [],
    light: null,
    water: null,
    soil: null,
    germinationDays: null,
    germinationTemperature: null,
    plantSpacing: null,
    rowSpacing: null,
    status: 'i_froebank',
    isFavorite: false,
    isPinned: false,
    imageIds: [],
    linkedPlantIds: [],
    growingLocations: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...p,
  } as InventoryItem
}

function felterFor(item: InventoryItem): BackfillFelt[] {
  const f = foreslaaBackfill([item])[0]
  return f ? (Object.keys(f.felter) as BackfillFelt[]) : []
}

function main() {
  console.log('\n[Tomhed] 0 og nej er værdier, ikke tomme felter')
  {
    tjek('sådybde 0 er IKKE tomt (sås på overfladen)', !erTomt({ sowingDepthMm: 0 }, 'sowingDepthMm'))
    tjek('sådybde null er tomt', erTomt({ sowingDepthMm: null }, 'sowingDepthMm'))
    tjek('forkultivering false er IKKE tomt', !erTomt({ preCultivation: false }, 'preCultivation'))
    tjek('forkultivering null er tomt', erTomt({ preCultivation: null }, 'preCultivation'))
    tjek('tom månedsliste er tomt', erTomt({ sowingMonths: [] }, 'sowingMonths'))
    tjek('udfyldt månedsliste er ikke tomt', !erTomt({ sowingMonths: [3] }, 'sowingMonths'))
    tjek('tom streng er tomt', erTomt({ soil: '   ' }, 'soil'))
    tjek('udfyldt streng er ikke tomt', !erTomt({ soil: 'Sandet' }, 'soil'))
  }

  console.log('\n[Urørlighed] brugerens egne værdier overlever')
  {
    // Tomat har artsguide. Brugeren har selv sat lys til skygge og sådybde
    // til 0 — begge afviger fra guiden og må ikke overskrives.
    const egne = pose({ light: 'shade', sowingDepthMm: 0, preCultivation: false, soil: 'Min egen jord' })
    const felter = felterFor(egne)
    tjek('lys foreslås ikke', !felter.includes('light'))
    tjek('sådybde 0 foreslås ikke', !felter.includes('sowingDepthMm'))
    tjek('forkultivering nej foreslås ikke', !felter.includes('preCultivation'))
    tjek('egen jord foreslås ikke', !felter.includes('soil'))
    tjek('men de tomme felter foreslås stadig', felter.length > 0)
  }

  console.log('\n[Urørlighed] poseoplysninger står ALDRIG på listen')
  {
    const forbudt = [
      'name', 'variety', 'supplier', 'seedCount', 'quantity', 'purchaseYear',
      'purchaseDate', 'expiryDate', 'purchaseUrl', 'notes', 'primaryImageId',
      'imageIds', 'guideId', 'status', 'isFavorite', 'isPinned', 'subcategoryId',
      'primaryCategoryId', 'latinName', 'growingLocations',
    ]
    const overlap = forbudt.filter(f => (BACKFILL_FELTER as readonly string[]).includes(f))
    tjek('ingen poseoplysning kan backfilles', overlap.length === 0, overlap.join(', '))

    // Og opdateringen indeholder præcis de felter forslaget nævner.
    const f = foreslaaBackfill([pose({ name: 'Squash', variety: 'Eight Ball F1' })])[0]
    const update = backfillOpdatering(f)
    const nøgler = Object.keys(update)
    const LOVLIGE_KOLONNER = [
      'sowing_months', 'sowing_depth_mm', 'pre_cultivation', 'planting_out_months',
      'harvest_months', 'light', 'water', 'soil', 'germination_days',
      'germination_temperature', 'plant_spacing', 'row_spacing',
    ]
    tjek('opdateringen rører kun dyrkningskolonner',
      nøgler.every(k => LOVLIGE_KOLONNER.includes(k)), nøgler.join(', '))
    tjek('opdateringen har lige så mange felter som forslaget',
      nøgler.length === f.antalFelter)
  }

  console.log('\n[Stilhed] ingen guide, intet forslag')
  {
    tjek('ukendt art giver intet forslag',
      foreslaaBackfill([pose({ name: 'Fantasiplante Xyz' })]).length === 0)
    tjek('pose uden navn springes over',
      foreslaaBackfill([pose({ name: '  ' })]).length === 0)

    // En pose der allerede er fuldt udfyldt skal ikke dukke op.
    const fuld = pose({
      name: 'Tomat', sowingMonths: [3], sowingDepthMm: 5, preCultivation: true,
      plantingOutMonths: [5], harvestMonths: [8], light: 'full_sun', water: 'regular',
      soil: 'x', germinationDays: 'x', germinationTemperature: 'x',
      plantSpacing: 'x', rowSpacing: 'x',
    })
    tjek('fuldt udfyldt pose giver intet forslag', foreslaaBackfill([fuld]).length === 0)
  }

  console.log('\n[Kilde] sortsguide før artsguide')
  {
    const medSort = foreslaaBackfill([pose({ name: 'Tomat', variety: 'Sungold' })])[0]
    tjek('kendt sort markeres som sort', medSort?.kilde === 'sort')
    const kunArt = foreslaaBackfill([pose({ name: 'Tomat', variety: 'Findes Ikke 99' })])[0]
    tjek('ukendt sort falder til art', kunArt?.kilde === 'art')
  }

  console.log('\n[Ægte data] de gamle importer fra 20/8')
  {
    // Præcis de to poser der udløste opgaven: importeret før berigelsen
    // fandtes, og derfor helt tomme trods eksisterende guide.
    const squash = foreslaaBackfill([pose({ name: 'Squash', variety: 'Eight Ball F1' })])[0]
    tjek('Squash · Eight Ball F1 kan udfyldes', squash != null && squash.antalFelter >= 10,
      `${squash?.antalFelter ?? 0} felter`)

    const tomat = foreslaaBackfill([pose({ name: 'Tomat', variety: 'Gardener’s Delight' })])[0]
    tjek('Tomat · Gardener’s Delight kan udfyldes', tomat != null && tomat.antalFelter >= 6,
      `${tomat?.antalFelter ?? 0} felter`)

    // Apostroffen må ikke slå sortsopslaget ihjel — den findes i tre former.
    tjek('typografisk apostrof håndteres', tomat != null)

    tjek('samlet felttal summerer forslagene',
      antalFelterIAlt([squash, tomat]) === squash.antalFelter + tomat.antalFelter)
  }

  console.log('\n[Idempotens] anden kørsel har intet at gøre')
  {
    const start = pose({ name: 'Squash', variety: 'Eight Ball F1' })
    const f = foreslaaBackfill([start])[0]
    // Simulér skrivningen: læg de foreslåede værdier ind i posen.
    const efter = { ...start, ...f.felter } as InventoryItem
    tjek('samme pose foreslås ikke igen', foreslaaBackfill([efter]).length === 0)
  }

  console.log(`\n${fejlet === 0 ? '✅' : '❌'}  backfill: ${bestået} bestået, ${fejlet} fejlet\n`)
  if (fejlet > 0) process.exit(1)
}

main()
