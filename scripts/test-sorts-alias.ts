/**
 * Permanent test af de kanoniske sortsaliasser. Køres af `npm test`.
 *
 * Et alias er en PÅSTAND om at to navne betegner samme plante. Testen
 * håndhæver de tre ting der gør påstanden ansvarlig:
 *   1. målet FINDES i Potalots bibliotek — ingen aliasser der peger på intet
 *   2. eksakt stavemåde vinder ALTID før alias
 *   3. der findes ingen generel F1-regel: en sort uden alias forbliver sig selv
 *
 * Og at aliasset virker begge de steder Anna låste det: frøkortet og
 * Frøbankens gruppering.
 */
import {
  SORTS_ALIASER,
  kanoniskSortsSlug,
  harSortsAlias,
  normaliserAliasDel as slug,
} from '@/lib/sorts-alias'
import { POTALOT_IMAGE_SETS_BY_ID } from '@/data/potalot-image-sets'
import { GUIDE_FACTS } from '@/data/guide-facts-index.generated'
import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import { sortsNoegle } from '@/lib/froebank-grupper'
import { findFroebankAutofill } from '@/lib/froebank-autofill'
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

const guideIds = new Set(GUIDE_FACTS.map(g => g.id))

function pose(name: string, variety: string | null): InventoryItem {
  return { id: 'x', name, variety, primaryCategoryId: 'fro' } as InventoryItem
}

function main() {
  console.log('\n[Ansvarlighed] hvert alias skal kunne stå for sig selv')
  {
    tjek('der findes mindst ét alias', SORTS_ALIASER.length > 0)

    for (const a of SORTS_ALIASER) {
      const maal = `${slug(a.art)}-${slug(a.til)}`
      const findes = maal in POTALOT_IMAGE_SETS_BY_ID || guideIds.has(maal)
      tjek(`"${a.art} · ${a.til}" findes i biblioteket`, findes, maal)

      tjek(`"${a.art} · ${a.fra}" har en begrundelse`,
        a.begrundelse.trim().length >= 40, `${a.begrundelse.length} tegn`)

      tjek(`"${a.art} · ${a.fra}" ≠ "${a.til}"`, slug(a.fra) !== slug(a.til))
    }

    // Ingen sort må have to forskellige kanoniske former.
    const nøgler = SORTS_ALIASER.map(a => `${slug(a.art)}|${slug(a.fra)}`)
    tjek('ingen dublet-aliasser', new Set(nøgler).size === nøgler.length)

    // Et alias må ikke selv være mål for et andet (ingen kæder).
    const maal = new Set(SORTS_ALIASER.map(a => `${slug(a.art)}|${slug(a.til)}`))
    tjek('ingen alias-kæder', !nøgler.some(n => maal.has(n)))
  }

  console.log('\n[Opslag] eksakt vinder, alias er kun fallback')
  {
    tjek('kendt alias oversættes',
      kanoniskSortsSlug('Squash', 'Eight Ball F1') === 'eight-ball')
    tjek('den kanoniske form er sig selv',
      kanoniskSortsSlug('Squash', 'Eight Ball') === 'eight-ball')
    tjek('harSortsAlias er sand for aliaset', harSortsAlias('Squash', 'Eight Ball F1'))
    tjek('harSortsAlias er falsk for den kanoniske', !harSortsAlias('Squash', 'Eight Ball'))

    // Store/små bogstaver og mellemrum må ikke afgøre noget.
    tjek('case og mellemrum er ligegyldige',
      kanoniskSortsSlug('  squash ', 'eight  ball  f1') === 'eight-ball')

    // Arten er en del af nøglen: aliaset må ikke smitte af på andre arter.
    tjek('aliaset gælder KUN for sin egen art',
      kanoniskSortsSlug('Agurk', 'Eight Ball F1') === 'eight-ball-f1')
  }

  console.log('\n[Ingen generel F1-regel] botanisk roulette forbliver aflyst')
  {
    // Sorter der IKKE står i listen skal beholde deres F1 — ellers kunne
    // "Sort X F1" arve billede og gruppedata fra en faktisk anden "Sort X".
    const uberoerte: [string, string][] = [
      ['Blomkål', 'Cheddar F1'],
      ['Broccoli', 'Aspabroc F1'],
      ['Grønkål', 'Redbor F1'],
      ['Skoleagurk', 'Snack F1'],
      ['Majs', 'Incredible F1'],
    ]
    for (const [art, sort] of uberoerte) {
      tjek(`"${art} · ${sort}" beholder sit F1`,
        kanoniskSortsSlug(art, sort) === slug(sort))
    }

    // Og de F1-frøkort der FINDES rammes stadig direkte.
    for (const [art, sort] of [['Blomkål', 'Cheddar F1'], ['Broccoli', 'Aspabroc F1']] as [string, string][]) {
      const r = resolveSeedCard({ name: art, variety: sort })
      tjek(`"${art} · ${sort}" rammer sit eget frøkort`, r.source !== 'fallback', r.source)
    }
  }

  console.log('\n[Frøkort] Eight Ball F1 finder squash-eight-ball')
  {
    const medF1 = resolveSeedCard({ name: 'Squash', variety: 'Eight Ball F1' })
    tjek('F1-posen får nu et rigtigt frøkort', medF1.source !== 'fallback', medF1.source)
    tjek('og det er præcis Eight Ball-kortet',
      medF1.src.includes('squash-eight-ball'), medF1.src)

    const uden = resolveSeedCard({ name: 'Squash', variety: 'Eight Ball' })
    tjek('den kanoniske pose er uændret', uden.src === medF1.src)

    // En squash-sort UDEN kort må stadig ikke arve Eight Balls billede.
    const fremmed = resolveSeedCard({ name: 'Squash', variety: 'Findes Ikke 99' })
    tjek('ukendt squash-sort falder stadig til placeholder',
      fremmed.source === 'fallback', fremmed.source)
  }

  console.log('\n[Gruppering] én sort, ikke to mapper')
  {
    tjek('Eight Ball og Eight Ball F1 deler nøgle',
      sortsNoegle(pose('Squash', 'Eight Ball')) === sortsNoegle(pose('Squash', 'Eight Ball F1')))
    tjek('en anden squash-sort holdes adskilt',
      sortsNoegle(pose('Squash', 'Black Beauty')) !== sortsNoegle(pose('Squash', 'Eight Ball')))
    tjek('samme sortsnavn under anden art holdes adskilt',
      sortsNoegle(pose('Agurk', 'Eight Ball F1')) !== sortsNoegle(pose('Squash', 'Eight Ball')))
    tjek('pose uden sort er uændret',
      sortsNoegle(pose('Squash', null)) === 'fro|squash|')
  }

  console.log('\n[Oprettelse] guide-opslaget kender også aliaset')
  {
    // Squash har i dag kun en ARTSguide, så begge former lander samme sted.
    // Det vigtige er at de lander ENS — ellers ville F1-posen få andre
    // dyrkningsfakta end sin tvilling.
    const medF1 = findFroebankAutofill('Squash', 'Eight Ball F1')
    const uden = findFroebankAutofill('Squash', 'Eight Ball')
    tjek('begge former finder en guide', medF1 != null && uden != null)
    tjek('og de finder den SAMME', medF1?.source === uden?.source)
    tjek('samme dyrkningsfakta',
      JSON.stringify(medF1?.facts) === JSON.stringify(uden?.facts))
  }

  console.log(`\n${fejlet === 0 ? '✅' : '❌'}  sorts-alias: ${bestået} bestået, ${fejlet} fejlet\n`)
  if (fejlet > 0) process.exit(1)
}

main()
