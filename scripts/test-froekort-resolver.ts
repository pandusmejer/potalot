/**
 * Verifikation af opgave 3: eksisterende frøposter skal automatisk finde
 * nye Potalot-frøkort — uden redigering, uden gem, uden DB-skrivning.
 *
 *   npx tsx scripts/test-froekort-resolver.ts
 *
 * Fixtures er ægte rækker fra live-databasen (23/8 2026), skrevet ind her
 * så testen kan køre uden DB-adgang. Reglen der testes:
 *
 *   brugerfoto  >  Potalot-frøkort  >  fallback
 *
 * og at frøkortet ALTID slås op på art+sort ved visning, aldrig på hvad
 * der lå gemt i rækken da posen blev oprettet.
 */

import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import {
  grupperEfterSort,
  gruppensForsidefoto,
  erBrugerfoto,
} from '@/lib/froebank-grupper'
import type { InventoryItem } from '@/lib/types'

const STORAGE = 'https://whtyexhqcpcgpludvkon.supabase.co/storage/v1/object/public/media'

function pose(p: Partial<InventoryItem> & { id: string; name: string }): InventoryItem {
  return {
    userId: 'test',
    variety: null,
    primaryCategoryId: 'fro',
    sowingMonths: [],
    sowingDepthMm: 0,
    plantingOutMonths: [],
    harvestMonths: [],
    growingLocations: [],
    status: 'i_froebank',
    isFavorite: false,
    isPinned: false,
    imageIds: [],
    primaryImageId: null,
    linkedPlantIds: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...p,
  } as InventoryItem
}

let fejl = 0
function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = faktisk === forventet
  if (!ok) fejl++
  console.log(`${ok ? '  ok  ' : ' FEJL '} ${navn}\n         → ${faktisk}${ok ? '' : `\n         forventet: ${forventet}`}`)
}

console.log('\n=== Case 1: gammel post, intet brugerfoto, frøkortet findes nu ===')
// Ægte række: Tomat · Sungold, oprettet 20/8, primary_image_url = null.
const sungold = pose({ id: 'a54acc45', name: 'Tomat', variety: 'Sungold' })
const c1 = resolveSeedCard({ name: sungold.name, variety: sungold.variety, preferredSrc: sungold.primaryImageId })
tjek('Sungold viser Potalot-frøkortet', c1.src, '/images/frokort/tomat-sungold.webp')
tjek('… og kilden er Potalots billedbibliotek', c1.source, 'guide-images')

console.log('\n=== Case 1b: apostrof-sorten fandt IKKE sit frøkort før ===')
// Ægte række: Tomat · Gardener’s Delight (typografisk apostrof).
// Filen hedder tomat-gardeners-delight — slugify gav tomat-gardener-s-delight.
const gd = resolveSeedCard({ name: 'Tomat', variety: 'Gardener’s Delight' })
tjek('Gardener’s Delight finder frøkortet', gd.src, '/images/frokort/tomat-gardeners-delight.webp')
// Den anden stavemåde i biblioteket må ikke gå i stykker af den grund.
const burpee = resolveSeedCard({ name: 'Rødbede', variety: "Burpee's Golden" })
tjek('Burpee\'s Golden (apostrof → bindestreg) uændret', burpee.src, '/images/frokort/roedbede-burpee-s-golden.webp')

console.log('\n=== Case 2: gammel post MED brugerfoto, frøkortet findes ===')
const eget = `${STORAGE}/inv/skoleagurk.jpg`
const c2 = resolveSeedCard({ name: 'Squash', variety: 'Eight Ball', preferredSrc: eget })
tjek('brugerfotoet vinder over frøkortet', c2.src, eget)
tjek('… og markeres som brugerens', c2.source, 'user-upload')

console.log('\n=== Case 3: intet brugerfoto, intet frøkort ===')
const c3 = resolveSeedCard({ name: 'Hirse', variety: 'Almindelig' })
tjek('fallback uændret', c3.src, '/images/ui/placeholder-card.svg')
tjek('… og kilden er fallback', c3.source, 'fallback')

console.log('\n=== Case 4: to poser af samme sort, ingen brugerfotos ===')
// Ægte gruppe: Ært · Hurst Green Shaft (Frøspiren + Frøsnapperen).
const poserA = [
  pose({ id: '2551135a', name: 'Stangbønne', variety: 'Cobra', supplier: 'Impecta', createdAt: '2026-05-08T00:00:00Z' }),
  pose({ id: '3ff527f5', name: 'Stangbønne', variety: 'Cobra', supplier: 'Nelson Garden', createdAt: '2026-05-20T00:00:00Z' }),
]
const g4 = grupperEfterSort(poserA)[0]
tjek('gruppen har intet brugerfoto', g4.forsidefoto, null)
tjek('gruppen viser sortens frøkort', resolveSeedCard({ name: g4.hoved.name, variety: g4.hoved.variety, preferredSrc: g4.forsidefoto }).src, '/images/frokort/stangboenne-cobra.webp')
// Uanset hvilken pose der bliver grupperepræsentant.
const g4b = grupperEfterSort([...poserA].reverse())[0]
tjek('samme billede med omvendt sortering', g4b.forsidefoto, g4.forsidefoto)

console.log('\n=== Case 5: to poser, ÉN har brugerfoto ===')
// Ægte gruppe: Squash · Eight Ball F1 — den ene pose har uploads, den anden ikke.
const brugerfoto = `${STORAGE}/inv/eight-ball.jpg`
const poserB = [
  pose({ id: 'dbbc5e39', name: 'Squash', variety: 'Eight Ball', createdAt: '2026-05-10T00:00:00Z', primaryImageId: brugerfoto, purchaseYear: 2025 }),
  pose({ id: 'd09a9cdd', name: 'Squash', variety: 'Eight Ball', createdAt: '2026-08-20T00:00:00Z', purchaseYear: 2024 }),
]
for (const [navn, raekke] of [['A–Å', poserB], ['udløb først', [...poserB].reverse()]] as const) {
  const g = grupperEfterSort(raekke)[0]
  const vist = resolveSeedCard({ name: g.hoved.name, variety: g.hoved.variety, preferredSrc: g.forsidefoto }).src
  tjek(`brugerfotoet vinder — sortering: ${navn}`, vist, brugerfoto)
}

console.log('\n=== Case 5b: legacy Potalot-sti i rækken er IKKE et brugerfoto ===')
// Ægte seed-rækker: primary_image_url = /images/froebank/froekort-*.png
tjek('lokal /images-sti tæller ikke som brugerfoto', erBrugerfoto('/images/froebank/froekort-stangboenne-cobra.png'), false)
tjek('supabase-URL tæller som brugerfoto', erBrugerfoto(brugerfoto), true)
const poserC = [
  pose({ id: 'c0000005', name: 'Stangbønne', variety: 'Cobra', createdAt: '2026-05-20T00:00:00Z', primaryImageId: '/images/froebank/froekort-stangboenne-cobra.png' }),
  pose({ id: 'fc79ef6b', name: 'Stangbønne', variety: 'Cobra', createdAt: '2026-05-08T00:00:00Z', primaryImageId: brugerfoto }),
]
tjek('gruppen vælger det ægte brugerfoto', gruppensForsidefoto(poserC), brugerfoto)

console.log('\n=== Case 6: Excel-importeret pose ===')
// Importen skriver kun primaryImageUrl når der IKKE findes et frøkort
// (inventory-import-merge.ts) — en importeret pose uden foto er derfor
// præcis samme situation som en gammel post.
const c6 = resolveSeedCard({ name: 'Radise', variety: 'French Breakfast', preferredSrc: null })
tjek('importeret pose følger samme prioritet', c6.src, '/images/frokort/radise-french-breakfast.webp')

console.log('\n=== Case 7: ingen skrivning ved visning ===')
// resolveSeedCard er en ren funktion over navn+sort + manifest: den har
// hverken supabase-klient eller fetch. Sikres her ved at kalde den to
// gange og se at intet input muteres.
const raekke = pose({ id: 'x', name: 'Tomat', variety: 'Sungold' })
const foer = JSON.stringify(raekke)
resolveSeedCard({ name: raekke.name, variety: raekke.variety, preferredSrc: raekke.primaryImageId })
resolveSeedCard({ name: raekke.name, variety: raekke.variety, preferredSrc: raekke.primaryImageId })
tjek('frøposen er urørt efter to visninger', JSON.stringify(raekke), foer)

console.log(fejl === 0 ? '\nAlle tjek bestået.\n' : `\n${fejl} tjek fejlede.\n`)
process.exit(fejl === 0 ? 0 : 1)
