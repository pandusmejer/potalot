/**
 * Find artsguiden for et plantenavn — READ-ONLY visningsfald.
 *
 * 1:1-reglen (ANNA-LÅST 23/8) siger, at `guide_id` på en pose MED sort kun må
 * pege på en rigtig sortsguide. Findes sortsguiden ikke, står koblingen tom,
 * så posen kan kobles korrekt den dag sortsguiden bliver produceret.
 *
 * Prisen for den regel er, at VISNINGEN selv skal finde arten. Planterne har
 * altid haft det fald (resolvePlantGuideHref); frøposerne havde det ikke, og
 * en pose uden sortsguide stod derfor helt uden guide-link — selvom Potalot
 * har en fin artsguide til den. Det var det, der ramte `Bønner · Cobra`.
 *
 * Opslaget sker på det KANONISKE artsnavn (arts-model.ts), så "Bønner" og
 * "Stangbønne" begge finder "Bønne". Der skrives intet: koblingen forbliver
 * tom, og linket findes på ny ved hver visning.
 *
 * Kun ægte artsguides (variety == null) kommer i betragtning — vi viser
 * ALDRIG en anden sorts guide som om den var denne sorts.
 */

import { normalizeGuideKey } from '@/lib/guides/normalize-key'
import { kanoniskArtsNavn } from '@/lib/arts-model'
import type { Guide } from '@/lib/types'

export function findArtsGuide(
  navn: string | null | undefined,
  guides: Guide[],
): Guide | null {
  const noegle = normalizeGuideKey(kanoniskArtsNavn(navn ?? ''))
  if (!noegle) return null

  const kandidater = guides.filter(
    g =>
      g.variety == null &&
      g.plantName != null &&
      normalizeGuideKey(kanoniskArtsNavn(g.plantName)) === noegle,
  )
  if (kandidater.length === 0) return null

  // Masteren først: brugerens egen private kopi kan være et AI-udkast, mens
  // 'public' er den redaktionelle guide. Ellers første match.
  return kandidater.find(g => g.visibility === 'public') ?? kandidater[0]
}
