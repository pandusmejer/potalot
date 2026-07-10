/**
 * Node-test for Spisekammer asset-valg (lib/forvandling-registry.ts).
 * Kør:  npx tsx scripts/test-spisekammer-assets.ts
 */

import { selectSpisekammerAssets, farveForCrop } from '@/lib/forvandling-registry'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}

// Afgrøde-asset når det findes (agurk har frugt-makro).
{
  const v = selectSpisekammerAssets({ harvestedCrops: [{ navn: 'Agurker', antal: '7' }], recipeIdeas: [] })
  tjek('Agurker → afgrøde-foto (frugt foretrukket)', v.fotos[0]?.role === 'fruit' && /agurk/.test(v.fotos[0].path), JSON.stringify(v.fotos))
}

// Fallback: jordbær har intet foto → ingen foto-tile (→ farvetile i UI).
{
  const v = selectSpisekammerAssets({ harvestedCrops: [{ navn: 'Jordbær', antal: '18' }], recipeIdeas: [] })
  tjek('Jordbær uden foto → 0 foto-tiles (falder til farvetile)', v.fotos.length === 0)
  tjek('Jordbær-farve = bærrosa', farveForCrop('Jordbær') === '#C36F7C')
}

// Max 2 fotos + ingen dublet-crop.
{
  const v = selectSpisekammerAssets({
    harvestedCrops: [{ navn: 'Tomater', antal: '4' }, { navn: 'Agurker', antal: '7' }, { navn: 'Chili', antal: '2' }],
    recipeIdeas: [], maxPhotos: 2,
  })
  tjek('Max 2 foto-tiles', v.fotos.length === 2)
  const crops = new Set(v.fotos.map(f => f.cropLabel))
  tjek('Ingen dublet-crop i fotos', crops.size === v.fotos.length)
}

// antalErHoester passes through.
{
  const v = selectSpisekammerAssets({ harvestedCrops: [{ navn: 'Tomat', antal: '3' }], recipeIdeas: [], antalErHoester: true })
  tjek('antalErHoester bevaret (ægte data → skjul tal i UI)', v.antalErHoester === true)
}

// Opskrift-farve fra afgrøde-navn (Tomatsalat → tomat-terracotta).
{
  const v = selectSpisekammerAssets({ harvestedCrops: [], recipeIdeas: ['Tomatsalat', 'Gazpacho'] })
  tjek('Tomatsalat → tomat-farve #B85A3D', v.opskrifter[0].farve === '#B85A3D')
}

// Note skifter med sæson.
{
  const sommer = selectSpisekammerAssets({ harvestedCrops: [], recipeIdeas: [], season: 'summer' })
  const vinter = selectSpisekammerAssets({ harvestedCrops: [], recipeIdeas: [], season: 'winter' })
  tjek('Note er sæson-afhængig', sommer.note.join(' ') !== vinter.note.join(' '))
}

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
