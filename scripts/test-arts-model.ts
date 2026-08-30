/**
 * Permanent test af artsmodellen. Køres af `npm test`.
 *
 * Modellen er en påstand om, hvad der er ÉN plante, og hvad der bare er en
 * stavemåde eller en væksttype. Testen håndhæver de fire ting, der gør
 * påstanden ansvarlig:
 *
 *   1. hver post kan begrundes, og typer/aliasser peger på noget virkeligt
 *   2. et ARTSALIAS siger kun noget om SPROG — aldrig om væksttype
 *   3. en TYPE hæftes kun på, når Potalot ved det (brugerens ord eller en
 *      verificeret sort). Uden viden: ingen typepåstand, ingen billede-gæt
 *   4. modellen virker de fem steder, den er sat ind: frøkort, guideopslag,
 *      Frøbankens gruppering, "Se guide"-linket og importens dubletnøgle
 *
 * Den konkrete anledning (Anna, 30/8 2026): en pose `Bønner · Cobra` fandt
 * hverken guiden eller frøkortet, og `Stangbønne · Cobra` fandt frøkortet,
 * men ikke guiden. Testen holder begge veje åbne for altid.
 */
import {
  ARTS_MODEL,
  SORTS_TYPER,
  slaaArtOp,
  kanoniskArtsNavn,
  kanoniskArtsSlug,
  typeSlugForPose,
  normaliserArtsDel as slug,
} from '@/lib/arts-model'
import { IMAGE_MANIFEST } from '@/data/image-manifest.generated'
import { GUIDE_FACTS } from '@/data/guide-facts-index.generated'
import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import { sortsNoegle } from '@/lib/froebank-grupper'
import { slaaGuiderOp } from '@/lib/froebank-autofill'
import { resolvePlantGuideHref } from '@/lib/plant-detail/resolve-guide-href'
import { findArtsGuide } from '@/lib/guides/find-arts-guide'
import type { Guide, InventoryItem } from '@/lib/types'

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

const guideIds = new Set(GUIDE_FACTS.map(g => g.id))

function pose(name: string, variety: string | null): InventoryItem {
  return { id: 'x', name, variety, primaryCategoryId: 'fro' } as InventoryItem
}

/** Findes der et frøkort på disken for denne slug? */
function harFroekort(s: string): boolean {
  return IMAGE_MANIFEST.has(`/images/frokort/${s}.png`) || IMAGE_MANIFEST.has(`/images/frokort/${s}.jpg`)
}

function main() {
  console.log('\n[Ansvarlighed] hver post skal kunne stå for sig selv')
  {
    tjek('der findes mindst én art i modellen', ARTS_MODEL.length > 0)

    for (const post of ARTS_MODEL) {
      tjek(`${post.art}: artsguiden findes i biblioteket`,
        guideIds.has(slug(post.art)),
        `ingen guide med id '${slug(post.art)}' — en art uden guide hører ikke hjemme i modellen`)
      tjek(`${post.art}: begrundelsen er skrevet ned`, post.begrundelse.trim().length > 20)

      for (const type of post.typer) {
        tjek(`${post.art}/${type.navn}: begrundelsen er skrevet ned`, type.begrundelse.trim().length > 20)
        // En type skal have DÆKNING: Potalot har mindst ét frøkort navngivet
        // efter den. Ellers er typenavnet en hensigt, ikke en oversættelse.
        const typeSlug = slug(type.navn)
        const dækning = [...IMAGE_MANIFEST].some(p => p.startsWith(`/images/frokort/${typeSlug}-`))
        tjek(`${post.art}/${type.navn}: typenavnet bruges faktisk i billedbiblioteket`, dækning,
          `ingen /images/frokort/${typeSlug}-*`)
      }
    }

    for (const s of SORTS_TYPER) {
      const art = ARTS_MODEL.find(a => slug(a.art) === slug(s.art))
      tjek(`${s.art} ${s.sort}: arten findes i modellen`, art != null)
      tjek(`${s.art} ${s.sort}: typen '${s.type}' er en kendt type under arten`,
        art?.typer.some(t => slug(t.navn) === slug(s.type)) ?? false)
      tjek(`${s.art} ${s.sort}: frøkortet '${slug(s.type)}-${slug(s.sort)}' ligger på disken`,
        harFroekort(`${slug(s.type)}-${slug(s.sort)}`),
        'en sorts-type uden frøkort er en påstand uden dækning')
      tjek(`${s.art} ${s.sort}: begrundelsen er skrevet ned`, s.begrundelse.trim().length > 20)
    }
  }

  console.log('\n[Sprog ≠ væksttype] et artsalias må aldrig blive til en typepåstand')
  {
    tjek("'Bønner' er arten Bønne", kanoniskArtsNavn('Bønner') === 'Bønne')
    tjek("'Bønner' får INGEN væksttype", slaaArtOp('Bønner').type === null)
    tjek("'Bønner' uden sort får ingen typeslug — den kunne være en buskbønne",
      typeSlugForPose('Bønner', null) === null)
    tjek("'Bønner' med UKENDT sort får stadig ingen typeslug",
      typeSlugForPose('Bønner', 'Findes Ikke') === null)
    tjek("'Stangbønne' er arten Bønne MED typen Stangbønne",
      slaaArtOp('Stangbønne').art === 'Bønne' && slaaArtOp('Stangbønne').type === 'Stangbønne')
    tjek("'Buskbønne' er arten Bønne MED typen Buskbønne",
      slaaArtOp('Buskbønne').art === 'Bønne' && slaaArtOp('Buskbønne').type === 'Buskbønne')
    tjek('en verificeret sort giver typen: Cobra → stangboenne',
      typeSlugForPose('Bønner', 'Cobra') === 'stangboenne')
    tjek('en verificeret sort giver typen: Provider → buskboenne',
      typeSlugForPose('Bønner', 'Provider') === 'buskboenne')
    tjek('ukendte arter passerer uændret igennem',
      kanoniskArtsNavn('Tomat') === 'Tomat' && kanoniskArtsSlug('Tomat') === 'tomat')
    tjek('tom tekst giver tom slug', kanoniskArtsSlug('') === '' && kanoniskArtsSlug(null) === '')
  }

  console.log('\n[Frøkort] posen finder Potalots kort — uanset hvad der står på den')
  {
    const forventet = '/images/frokort/stangboenne-cobra'
    for (const navn of ['Bønner', 'Bønne', 'Stangbønne', 'Klatrebønne']) {
      const { src, source } = resolveSeedCard({ guideId: null, name: navn, variety: 'Cobra' })
      tjek(`${navn} · Cobra finder stangbønne-frøkortet`,
        src.startsWith(forventet) && source !== 'fallback', src)
    }
    const provider = resolveSeedCard({ guideId: null, name: 'Bønner', variety: 'Provider' })
    tjek('Bønner · Provider finder buskbønne-frøkortet (samme art, anden type)',
      provider.src.startsWith('/images/frokort/buskboenne-provider'), provider.src)

    // Grundreglen: forkert billede er værre end intet billede.
    const ukendt = resolveSeedCard({ guideId: null, name: 'Bønner', variety: 'Findes Ikke' })
    tjek('en ukendt bønnesort får INTET kort — ikke et vilkårligt bønnekort',
      ukendt.source === 'fallback', ukendt.src)
    const artenAlene = resolveSeedCard({ guideId: null, name: 'Bønner', variety: null })
    tjek('arten alene får intet sortskort', artenAlene.source === 'fallback', artenAlene.src)
  }

  console.log('\n[Guideopslag] alle tre stavemåder ender ved bønneguiden')
  {
    for (const navn of ['Bønner', 'Bønne', 'Stangbønne', 'Buskbønne']) {
      const { artsGuide } = slaaGuiderOp(navn, 'Cobra')
      tjek(`${navn} · Cobra finder artsguiden 'boenne'`, artsGuide?.id === 'boenne',
        artsGuide?.id ?? 'ingen guide')
    }
    const uændret = slaaGuiderOp('Tomat', 'Sungold')
    tjek('uændret for arter uden for modellen (Tomat · Sungold)',
      uændret.sortsGuide?.id === 'tomat-sungold' || uændret.artsGuide?.id === 'tomat')
  }

  console.log('\n[Se guide] linket rammer bønneguiden, ikke /guides')
  {
    const guides = [
      { id: 'boenne', plantName: 'Bønne', variety: null, guideLevel: 'species' } as unknown as Guide,
    ]
    for (const navn of ['Bønner', 'Stangbønne']) {
      tjek(`${navn} · Cobra → /guides/boenne`,
        resolvePlantGuideHref({ name: navn, variety: 'Cobra' }, guides) === '/guides/boenne')
    }
  }

  console.log('\n[Frøbankens guide-fald] tom kobling må ikke betyde intet link')
  {
    // Sådan ser Annas faktiske DB ud: master-artsguiden "Bønne" + det
    // AI-udkast, fejlen selv skabte. Udkastet må ALDRIG vinde.
    const dbGuides = [
      { id: 'a3f72f17', plantName: 'Bønne', variety: null, visibility: 'public' },
      { id: '679e2995', plantName: 'Bønner', variety: 'Cobra', visibility: 'private' },
    ] as unknown as Guide[]

    for (const navn of ['Bønner', 'Bønne', 'Stangbønne']) {
      tjek(`${navn} uden kobling falder til master-artsguiden`,
        findArtsGuide(navn, dbGuides)?.id === 'a3f72f17',
        findArtsGuide(navn, dbGuides)?.id ?? 'intet fald')
    }
    tjek('et sorts-udkast bliver ALDRIG artsguide',
      findArtsGuide('Bønner', [dbGuides[1]]) === null)
    tjek('ingen artsguide → intet link (ingen nødløsning)',
      findArtsGuide('Pastinak', dbGuides) === null)
  }

  console.log('\n[Gruppering] samme sort = samme mappe, forskellig type = forskellig mappe')
  {
    tjek("'Bønner Cobra' og 'Stangbønne Cobra' er ÉN sort",
      sortsNoegle(pose('Bønner', 'Cobra')) === sortsNoegle(pose('Stangbønne', 'Cobra')))
    tjek("'Bønne Cobra' hører i samme mappe",
      sortsNoegle(pose('Bønne', 'Cobra')) === sortsNoegle(pose('Stangbønne', 'Cobra')))
    tjek('en fejlskrevet Buskbønne Cobra samles med de andre Cobra-poser — sorten afgør',
      sortsNoegle(pose('Buskbønne', 'Cobra')) === sortsNoegle(pose('Stangbønne', 'Cobra')))
    tjek('Cobra og Blauhilde er to sorter, selvom begge er stangbønner',
      sortsNoegle(pose('Bønner', 'Cobra')) !== sortsNoegle(pose('Bønner', 'Blauhilde')))
    tjek('Cobra og Provider blandes ikke',
      sortsNoegle(pose('Bønner', 'Cobra')) !== sortsNoegle(pose('Bønner', 'Provider')))
    // Uden sort ved vi ikke, om posen er busk eller stang — så er det to mapper.
    tjek("'Bønner' uden sort er IKKE samme mappe som 'Stangbønne' uden sort",
      sortsNoegle(pose('Bønner', null)) !== sortsNoegle(pose('Stangbønne', null)))
    tjek('nøglen for arter uden for modellen er uændret',
      sortsNoegle(pose('Squash', null)) === 'fro|squash|')
  }

  console.log(`\n${bestået} bestået, ${fejlet} fejlet`)
  if (fejlet > 0) process.exit(1)
}

main()
