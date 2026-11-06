import type { Guide } from '@/lib/types'
import { normalizeGuideKey as norm } from '@/lib/guides/normalize-key'
import { kanoniskArtsNavn } from '@/lib/arts-model'

/**
 * Find den bedste guide-rute for en plante, så "Se guide" fører til DEN
 * relevante guide — ikke bare /guides-forsiden.
 *
 * Rækkefølge:
 *   1. Eksplicit guideId (planten er allerede koblet til en guide) — men KUN
 *      hvis guiden findes i `guides` (eller er en brugerguide med UUID-id).
 *      En kobling til en guide, der ikke findes (fx 'stangboenne-neckargold'),
 *      ville ellers give et dødt link; så falder opslaget videre til 2-4.
 *   2. Sorts-guide: samme art OG samme sort (fx Dahlia "Café au Lait").
 *   3. Arts-guide: samme art (species-niveau).
 *   4. En hvilken som helst guide med samme artsnavn.
 *   5. Ingen match → /guides (så linket aldrig dør).
 */
/** Brugerguider (egne/DB) har UUID-id og ligger ikke i det statiske bibliotek. */
const UUID_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function resolvePlantGuideHref(
  plant: { guideId?: string | null; name: string; variety?: string | null },
  guides: Guide[],
): string {
  if (plant.guideId && (guides.some(g => g.id === plant.guideId) || UUID_ID.test(plant.guideId))) {
    return `/guides/${plant.guideId}`
  }

  // Guiderne er navngivet efter ARTEN. Brugerens artsfelt kan være flertal
  // ("Bønner") eller en væksttype ("Stangbønne") — begge peger på artsguiden
  // "Bønne". Oversættelsen ligger ét sted: arts-model.ts. Ukendte navne
  // passerer uændret, så alt andet opfører sig som før.
  const name = norm(kanoniskArtsNavn(plant.name))
  const variety = plant.variety ? norm(plant.variety) : null

  if (variety) {
    const byVariety = guides.find(
      g => norm(kanoniskArtsNavn(g.plantName)) === name && g.variety != null && norm(g.variety) === variety,
    )
    if (byVariety) return `/guides/${byVariety.id}`
  }

  // Accepterer både det statiske vokabular ('species') og DB-mastervokabularet
  // ('art'), så en synket DB-master også genkendes som arts-guide her.
  const bySpecies = guides.find(
    g => norm(kanoniskArtsNavn(g.plantName)) === name && (g.guideLevel === 'species' || (g.guideLevel as string) === 'art'),
  )
  if (bySpecies) return `/guides/${bySpecies.id}`

  const anyMatch = guides.find(g => norm(kanoniskArtsNavn(g.plantName)) === name)
  return anyMatch ? `/guides/${anyMatch.id}` : '/guides'
}
