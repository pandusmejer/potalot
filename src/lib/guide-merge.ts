/**
 * Arts/sorts-guide merge-logik.
 *
 * Når en sortsguide vises, fletter vi:
 *  - alle felter fra artsguiden (parent)
 *  - sortsguidens overrides (kun de felter der er udfyldt)
 */

import type { Guide, GuideQuickFacts, GuideSection, GuideCalendarRule } from './types'

export interface MergedGuide {
  /** Den effektive guide som brugeren ser */
  effective: Guide
  /** Hvilke felter kommer fra parent (hvis noget) */
  inheritedFromParent: Set<string>
  /** Reference til parent guide hvis dette er en sortsguide */
  parent: Guide | null
}

export function mergeGuide(guide: Guide, allGuides: Guide[]): MergedGuide {
  if (guide.guideLevel === 'species' || !guide.parentGuideId) {
    return { effective: guide, inheritedFromParent: new Set(), parent: null }
  }

  const parent = allGuides.find(g => g.id === guide.parentGuideId)
  if (!parent) {
    return { effective: guide, inheritedFromParent: new Set(), parent: null }
  }

  // Start med parent-værdier
  const merged: Guide = JSON.parse(JSON.stringify(parent)) as Guide
  const inherited = new Set<string>()

  // Bevar sortsspecifikke ID, navn etc.
  merged.id = guide.id
  merged.plantName = guide.plantName
  merged.variety = guide.variety
  merged.latinName = guide.latinName ?? parent.latinName
  merged.guideLevel = 'variety'
  merged.parentGuideId = parent.id
  merged.summary = guide.summary || parent.summary
  merged.difficulty = guide.difficulty
  merged.tags = guide.tags.length ? guide.tags : parent.tags

  // Quick facts: override per felt
  const mergedQF: GuideQuickFacts = { ...parent.quickFacts }
  ;(Object.keys(guide.quickFacts) as Array<keyof GuideQuickFacts>).forEach((k) => {
    const v = guide.quickFacts[k]
    if (v !== undefined && !(Array.isArray(v) && v.length === 0)) {
      // override
      ;(mergedQF as unknown as Record<string, unknown>)[k] = v
    } else {
      inherited.add(`quickFacts.${k}`)
    }
  })
  merged.quickFacts = mergedQF

  // Sections: sortsguider STÅR PÅ EGNE BEN. Vi inheriter IKKE parent-
  // sektioner — sortsguiden er sin egen narrative og må ikke fyldes
  // med tekst om hele arten. Det matcher den redaktionelle regel
  // "Beskriv planten ud fra dens egne behov, ikke i forhold til en
  // anden plante". Artsguiden tilgås via parent-link-banneret øverst.
  merged.sections = guide.sections

  // primaryImageId: sortsguider skal have eget plantekort (eller intet).
  // Vi inheriter IKKE artsguide-billedet — det ville bryde sortsidentitet.
  merged.primaryImageId = guide.primaryImageId ?? null

  // Calendar rules: union
  const seen = new Set<string>()
  const allRules: GuideCalendarRule[] = []
  for (const r of [...guide.calendarRules, ...parent.calendarRules]) {
    const key = `${r.taskType}|${r.title}`
    if (seen.has(key)) continue
    seen.add(key)
    allRules.push(r)
  }
  merged.calendarRules = allRules

  return { effective: merged, inheritedFromParent: inherited, parent }
}
