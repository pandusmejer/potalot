/**
 * Hero-integritet: alle 12 måneder skal stemme PARVIST på tværs af de
 * uafhængige kilder, der tilsammen tegner månedsheroen.
 *
 * Fælden: MONTHS_DA (navnet), heroens private MAANED_SLUG (fotostien),
 * teaserens EGEN slug-udledning, MAANEDS_STEMNING (tagline/brødtekst),
 * MONTHLY_GARDEN_COPY (plannerens manchet) og saeson() er seks separate
 * lister på samme akse. Skrider én af dem én plads, får man "September"
 * oven på et augustfoto — den slags opdager mennesker med det samme, og
 * ingen typecheck fanger det.
 */

import { existsSync } from 'node:fs'
import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import { MONTHLY_GARDEN_COPY } from '@/lib/kalender/maaneds-copy'
import { saeson } from '@/lib/datetime'

// Samme liste som heroens private MAANED_SLUG (kopieret hertil for at kunne
// sammenligne den PARVIST med MONTHS_DA — det er selve pointen med testen).
const MAANED_SLUG = ['januar','februar','marts','april','maj','juni','juli','august','september','oktober','november','december']
const FORVENTET_SAESON = ['Vinter','Vinter','Forår','Forår','Forår','Sommer','Sommer','Sommer','Efterår','Efterår','Efterår','Vinter']

let fejl = 0
const F = (m: number, s: string) => { fejl++; console.error(`  ✗ ${String(m).padStart(2)}: ${s}`) }

console.log('måned | MONTHS_DA | slug (hero) | slug (teaser) | foto | stemning | planner-copy | sæson')
for (let m = 1; m <= 12; m++) {
  const navn = MONTHS_DA[m - 1]?.full
  const heroSlug = MAANED_SLUG[m - 1]
  const teaserSlug = navn?.toLowerCase()          // teaseren udleder sin egen sti
  const foto = `public/images/heroes-maaneder/hero-${heroSlug}-foto.webp`
  const harFoto = existsSync(foto)
  const st = MAANEDS_STEMNING[m]
  const copy = MONTHLY_GARDEN_COPY[m]
  const sa = saeson(m)

  if (!navn) F(m, 'MONTHS_DA mangler')
  if (heroSlug !== navn?.toLowerCase()) F(m, `slug "${heroSlug}" ≠ månedsnavn "${navn?.toLowerCase()}" → forkert foto under rigtigt navn`)
  if (teaserSlug !== heroSlug) F(m, `teaserens slug "${teaserSlug}" ≠ heroens "${heroSlug}"`)
  if (!harFoto) F(m, `foto mangler: ${foto}`)
  if (!st?.tagline) F(m, 'MAANEDS_STEMNING.tagline mangler')
  if (!st?.description) F(m, 'MAANEDS_STEMNING.description mangler')
  if (!copy?.shortText) F(m, 'MONTHLY_GARDEN_COPY.shortText mangler')
  if (!copy?.longText) F(m, 'MONTHLY_GARDEN_COPY.longText mangler')
  if (sa !== FORVENTET_SAESON[m - 1]) F(m, `sæson "${sa}" ≠ forventet "${FORVENTET_SAESON[m-1]}"`)

  // Nævner månedens egen copy en ANDEN måned ved navn? (September over augustfoto-fælden)
  const andre = MAANED_SLUG.filter((s, i) => i !== m - 1)
  const tekst = `${st?.tagline ?? ''} ${st?.description ?? ''} ${copy?.shortText ?? ''}`.toLowerCase()
  const fremmed = andre.filter(s => new RegExp(`\\b${s}\\b`).test(tekst))
  if (fremmed.length) console.log(`  · ${navn}: copy nævner også ${fremmed.join(', ')} (kan være bevidst)`)

  console.log(`${String(m).padStart(5)} | ${(navn??'?').padEnd(9)} | ${heroSlug.padEnd(11)} | ${(teaserSlug??'?').padEnd(13)} | ${harFoto?'ok  ':'MANGL'} | ${st?.tagline?'ok      ':'MANGLER '} | ${copy?.shortText?'ok          ':'MANGLER     '} | ${sa}`)
}
console.log(`\n${fejl===0?'✅':'❌'}  hero-integritet: ${fejl} fejl`)
if (fejl) process.exit(1)
