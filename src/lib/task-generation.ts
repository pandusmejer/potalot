/**
 * Task-generation: omsætter en guides calendarRules til konkrete kalender-opgaver
 * baseret på en plantes så-dato.
 */

import type { Guide, GuideCalendarRule, CalendarTask, TaskType, TaskPriority } from './types'
import { normaliserOpgavetype, erCanoniskOpgavetype } from './kalender/opgavetype'

export interface GeneratedTaskInput {
  title: string
  date: string                  // YYYY-MM-DD
  taskType: TaskType
  priority: TaskPriority
  source: 'guide'
  sourceId: string
  linkedPlantId: string
  linkedInventoryItemId: string
  linkedGuideId: string
  description?: string
}

/**
 * Beregn dato for en kalenderregel baseret på så-dato.
 *
 * To slags regler:
 * 1. trigger='sowingDate' + relativeOffsetDays: dato = sowDate + N dage
 * 2. recommendedMonths: dato = første dag i næste måned i listen ≥ såningsmåned
 */
export function calculateRuleDate(rule: GuideCalendarRule, sowDate: string): string | null {
  // Trigger-baseret (offset fra såning)
  if (rule.trigger === 'sowingDate' && rule.relativeOffsetDays != null) {
    const d = new Date(sowDate + 'T00:00:00')
    d.setDate(d.getDate() + rule.relativeOffsetDays)
    return d.toISOString().split('T')[0]
  }

  // Måneds-baseret
  if (rule.recommendedMonths && rule.recommendedMonths.length > 0) {
    const sowD = new Date(sowDate + 'T00:00:00')
    const sowMonth = sowD.getMonth() + 1            // 1-12
    const sowYear = sowD.getFullYear()

    const sortedMonths = [...rule.recommendedMonths].sort((a, b) => a - b)

    // Find første måned ≥ såningsmåned (samme år)
    let targetMonth = sortedMonths.find(m => m >= sowMonth)
    let targetYear = sowYear

    if (!targetMonth) {
      // Wrap til næste år
      targetMonth = sortedMonths[0]
      targetYear = sowYear + 1
    }

    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
  }

  return null
}

/**
 * Generér alle kalender-opgaver for en plante baseret på guidens regler.
 */
export function generateTasksFromGuide(input: {
  guide: Guide
  sowDate: string
  plantId: string
  inventoryItemId: string
}): GeneratedTaskInput[] {
  const tasks: GeneratedTaskInput[] = []

  for (const rule of input.guide.calendarRules) {
    const date = calculateRuleDate(rule, input.sowDate)
    if (!date) continue

    // Guiderne i basen bærer stadig gamle/opfundne typer (de 22 private
    // AI-guides er ikke migreret). Normaliseringen ved skrivning dækker kun
    // NYE guides, så vi normaliserer også her — ellers ville en enkelt gammel
    // regel fortsat kunne vælte hele task-batchen. Se opgavetype.ts.
    const opgavetype = normaliserOpgavetype(rule.taskType).type

    tasks.push({
      title: rule.title,
      date,
      taskType: opgavetype,
      priority: rule.priority,
      source: 'guide',
      sourceId: input.guide.id,
      linkedPlantId: input.plantId,
      linkedInventoryItemId: input.inventoryItemId,
      linkedGuideId: input.guide.id,
    })
  }

  return tasks
}

/**
 * Find guide for et frøbank-element.
 * - Hvis guide_id er sat: brug den
 * - Ellers fallback til navnematch (case-insensitive på plantName)
 *
 * TODO: Når guides er i Supabase, lav rigtigt opslag.
 *       For nu: matcher kun mod MOCK_GUIDES.
 */
export function resolveGuideForInventory(
  inventoryItem: { guideId?: string | null; name: string },
  allGuides: Guide[]
): Guide | null {
  // 1. Direkte guide_id match
  if (inventoryItem.guideId) {
    const direct = allGuides.find(g => g.id === inventoryItem.guideId)
    if (direct) return direct
  }

  // 2. Navnematch (kun species-niveau)
  const lower = inventoryItem.name.toLowerCase()
  const speciesMatch = allGuides.find(g =>
    g.guideLevel === 'species' &&
    g.plantName.toLowerCase() === lower
  )
  if (speciesMatch) return speciesMatch

  // 3. Vag match (starts with) — fanger fx "Tomat / sorter"
  const partial = allGuides.find(g =>
    g.guideLevel === 'species' &&
    lower.startsWith(g.plantName.toLowerCase())
  )

  return partial ?? null
}

/**
 * Sidste vagt før DB: del opgaverne i dem `calendar_tasks` kan tage imod, og
 * dem den vil afvise.
 *
 * ── Hvorfor den findes ───────────────────────────────────────────────────
 * Indsættelsen er ét batch. Før normaliseringen kunne ÉN regel med en
 * opfunden `taskType` få hele batchen afvist — 19 af 22 private guides bar
 * mindst én, og fejlen blev slugt uden log. Brugeren fik nul opgaver og
 * ingen besked.
 *
 * Efter normaliseringen bør `ugyldige` altid være tom. Vagten bliver stående
 * alligevel: den gør et fremtidigt hul til en log-linje og et delvist
 * resultat i stedet for til en tavs nul-batch.
 */
export function partitionerPaaOpgavetype(tasks: GeneratedTaskInput[]): {
  gyldige: GeneratedTaskInput[]
  ugyldige: GeneratedTaskInput[]
} {
  const gyldige: GeneratedTaskInput[] = []
  const ugyldige: GeneratedTaskInput[] = []
  for (const t of tasks) {
    (erCanoniskOpgavetype(t.taskType) ? gyldige : ugyldige).push(t)
  }
  return { gyldige, ugyldige }
}

/**
 * Filter væk eventuelle 'sowing'/'pre_sow' opgaver — disse skal ikke
 * autogenereres når brugeren netop HAR sået.
 */
export function filterRelevantTasks(tasks: GeneratedTaskInput[]): GeneratedTaskInput[] {
  return tasks.filter(t => t.taskType !== 'sowing' && t.taskType !== 'pre_sow')
}

// Re-export type for convenience
export type { CalendarTask }
