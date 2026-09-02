/**
 * Task-generation: omsætter en guides calendarRules til konkrete kalender-opgaver
 * baseret på en plantes så-dato.
 *
 * Datosemantikken bor i `beregnRegelDato` nedenfor (afløser den gamle
 * `calculateRuleDate`, som lod `relativeOffsetDays` returnere først og
 * dermed ignorere `recommendedMonths` helt). Vinduerne selv — opslag,
 * clamp og kant-regler — bor i kalender/dyrkningsvindue.ts.
 * Baggrund: Docs/product/kalenderregel-semantik-audit.md
 */

import type { Guide, GuideCalendarRule, CalendarTask, TaskType, TaskPriority } from './types'
import { normaliserOpgavetype, erCanoniskOpgavetype } from './kalender/opgavetype'
import {
  clampTilVindue,
  delDato,
  foersteDatoIVindue,
  idagKbh,
  plusDage,
  resolveVindue,
  type VindueKilde,
} from './kalender/dyrkningsvindue'

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

export interface RegelDatoKontekst {
  rule: GuideCalendarRule
  /** Den NORMALISEREDE opgavetype — den der lander i `calendar_tasks`. */
  opgavetype: TaskType
  /** Plantens så-dato (YYYY-MM-DD). */
  sowDate: string
  /** `plants_v2.name` — opslagsnøglen relevansmotoren senere bruger. */
  plantName: string
  /** `plants_v2.variety`, hvis sorten kendes. */
  variety: string | null
  /** Registreringsdagen (YYYY-MM-DD). Eksplicit, så beregningen er ren. */
  idag: string
}

export type RegelDatoGrund =
  /** Offsetdatoen lå i vinduet og står uændret — dag og det hele. */
  | 'offset_i_vindue'
  /** Offsetdatoen lå før vinduet → første dag i nærmeste gyldige måned. */
  | 'offset_clampet_frem'
  /** Offsetdatoen lå efter vinduet → sidste dag i nærmeste gyldige måned. */
  | 'offset_clampet_tilbage'
  /** Intet vindue nogen steder: offsettet står alene, som før. */
  | 'offset_uden_vindue'
  /** Ingen offset → vinduets åbning fra såningsmåneden. */
  | 'vinduets_aabning'
  /** Datoen lå i fortiden, men vinduet er stadig åbent → registreringsdagen. */
  | 'omdateret_til_idag'
  /** Datoen lå i fortiden og vinduet er lukket → opgaven oprettes ikke. */
  | 'droppet_vindue_lukket'
  /** Fortidsdato uden dokumenteret vindue → droppet, som det gamle filter gjorde. */
  | 'droppet_fortid_uden_vindue'
  /** Hverken vindue eller offset — reglen kan ikke dateres. */
  | 'ingen_dato'

export interface RegelDato {
  /** `null` = opgaven skal IKKE oprettes. */
  dato: string | null
  grund: RegelDatoGrund
  /** Vinduet der afgjorde det — tomt array når intet blev fundet. */
  vindue: number[] | null
  vindueKilde: VindueKilde
  /** Offsettets rå ønskedato, før vinduet fik lov at rette. Til audit. */
  oensket: string | null
}

/**
 * Dato for én kalenderregel.
 *
 * ── Produktreglen (Anna 2/9, audit §8-§9) ────────────────────────────────
 *   Det dokumenterede dyrkningsvindue bestemmer, hvornår en maskinafledt
 *   opgave må ligge. `relativeOffsetDays` placerer den kun INDEN I vinduet.
 *
 * Rækkefølgen er låst:
 *
 *   1. Vinduet slås op canonical (samme resolvers som reminder-relevans).
 *      Har reglen også en `recommendedMonths`, må den INDSNÆVRE canonical,
 *      aldrig udvide det: det effektive vindue er fællesmængden. Er den tom,
 *      vinder canonical, og konflikten logges. Se dyrkningsvindue.ts.
 *   2. Mangler canonical → reglens egen `recommendedMonths` (legacy).
 *   3. Mangler også det → gammel adfærd, uændret.
 *   4. Offsetdatoen beregnes.
 *   5. Ligger den i vinduet → den står.
 *   6. Ligger den udenfor → clamp til nærmeste gyldige kant.
 *   7. Intet offset → vinduets åbning.
 *   8. Dato i fortiden: vinduet stadig åbent → `idag`; ellers ingen opgave.
 *
 * ── Hvorfor `relativeOffsetDays` ikke er en autoritet ────────────────────
 * Feltet står ikke i guidekontrakten. Ingen af de 176 redaktionelle guides
 * bruger det. Alle 54 forekomster stammer fra private AI-guides, som har
 * kopieret ét eksempel i AI-prompten 54 gange — og 41 af de 44 virksomme
 * regler kunne producere en dato uden for deres eget dokumenterede vindue.
 * Læsestøtten bliver stående, fordi dataene findes live; men vinduet
 * bestemmer. Nye guides genererer ikke længere feltet (guides.ts,
 * guides-admin.ts).
 *
 * ── Hvorfor `trigger` stadig gater offsettet ─────────────────────────────
 * Kun `trigger === 'sowingDate'` bruger offsettet, præcis som før. De ti
 * regler med `plantOutDate`/`germinationDate` regner fra en dato,
 * generatoren ikke har — at aktivere dem nu ville være at opfinde et
 * udgangspunkt, ikke at rette en fejl. De dateres på vinduet.
 */
export function beregnRegelDato(k: RegelDatoKontekst): RegelDato {
  const vindue = resolveVindue(
    k.opgavetype, k.plantName, k.variety, k.rule.recommendedMonths,
  )
  const harVindue = vindue.kilde !== 'intet'

  const oensket =
    k.rule.trigger === 'sowingDate' && k.rule.relativeOffsetDays != null
      ? plusDage(k.sowDate, k.rule.relativeOffsetDays)
      : null

  const svar = (dato: string | null, grund: RegelDatoGrund): RegelDato => ({
    dato, grund, vindue: harVindue ? vindue.maaneder : null,
    vindueKilde: vindue.kilde, oensket,
  })

  let dato: string | null
  let grund: RegelDatoGrund

  if (!harVindue) {
    // Ingen dokumentation nogen steder. Bevar adfærden præcis som den var.
    if (!oensket) return svar(null, 'ingen_dato')
    dato = oensket
    grund = 'offset_uden_vindue'
  } else if (oensket) {
    // Så-datoen er gulvet: en opgave afledt af en såning kan ikke ligge før
    // såningen, uanset hvor nær en tidligere vindueskant måtte være.
    const clamp = clampTilVindue(oensket, vindue.maaneder, k.sowDate)
    dato = clamp.dato
    grund = clamp.retning === 'i_vindue'
      ? 'offset_i_vindue'
      : clamp.retning === 'frem' ? 'offset_clampet_frem' : 'offset_clampet_tilbage'
  } else {
    dato = foersteDatoIVindue(vindue.maaneder, k.sowDate)
    if (!dato) return svar(null, 'ingen_dato')
    grund = 'vinduets_aabning'
  }

  // ── Tilbagevirkende registrering (Anna 2/9, punkt B) ───────────────────
  // Det gamle værn var `.filter(t => t.date >= idag)` i mine-planter.ts —
  // et kalender-snit uden faglighed. Det beholdt en udplantning dateret
  // 13/04 (fremtidig, men uden for vinduet) og kasserede en dateret 1/5,
  // som stadig var relevant den 1. juni. Vinduet afgør nu relevansen.
  if (dato < k.idag) {
    if (harVindue && vindue.maaneder.includes(delDato(k.idag).maaned)) {
      return svar(k.idag, 'omdateret_til_idag')
    }
    return svar(null, harVindue ? 'droppet_vindue_lukket' : 'droppet_fortid_uden_vindue')
  }

  return svar(dato, grund)
}

/**
 * Generér alle kalender-opgaver for en plante baseret på guidens regler.
 */
export function generateTasksFromGuide(input: {
  guide: Guide
  sowDate: string
  plantId: string
  inventoryItemId: string
  /**
   * Plantens navn/sort — `plants_v2.name`/`.variety`, altså PRÆCIS de
   * værdier reminder-relevans senere slår op på. Guidens egen identitet er
   * kun fallback: den kan divergere fra frøposen, og så ville opgaven blive
   * dateret efter ét vindue og bedømt mod et andet.
   */
  plantName?: string
  variety?: string | null
  /** Registreringsdagen. Default: i dag i dansk tid, som SQL'ens v_today. */
  idag?: string
}): GeneratedTaskInput[] {
  const tasks: GeneratedTaskInput[] = []
  const plantName = input.plantName ?? input.guide.plantName
  const variety = input.variety !== undefined ? input.variety : (input.guide.variety ?? null)
  const idag = input.idag ?? idagKbh()

  for (const rule of input.guide.calendarRules) {
    // Guiderne i basen bærer stadig gamle/opfundne typer (de 22 private
    // AI-guides er ikke migreret). Normaliseringen ved skrivning dækker kun
    // NYE guides, så vi normaliserer også her — ellers ville en enkelt gammel
    // regel fortsat kunne vælte hele task-batchen. Se opgavetype.ts.
    //
    // Den skal desuden ske FØR datoberegningen: vindue-opslaget sker på den
    // canoniske type, så opgaven dateres efter det vindue, den bagefter
    // bedømmes mod.
    const opgavetype = normaliserOpgavetype(rule.taskType).type

    const { dato, vindueKilde, vindue } = beregnRegelDato({
      rule, opgavetype, sowDate: input.sowDate, plantName, variety, idag,
    })

    // Nul overlap mellem reglens vindue og bibliotekets: de to kilder er
    // uenige om fagligheden, ikke om præcisionen. Canonical vinder, men
    // uenigheden må ikke forsvinde lydløst — det var præcis den slags
    // tavshed, der holdt generatoren ude af drift i §5.
    if (vindueKilde === 'canonical_konflikt') {
      console.warn(
        `[task-generation] vindue-konflikt i guide ${input.guide.id}: "${rule.title}" `
        + `(${opgavetype}) anbefaler ${JSON.stringify(rule.recommendedMonths)}, men `
        + `${plantName}${variety ? ' ' + variety : ''} har canonical `
        + `${JSON.stringify(vindue)}. Canonical bruges.`,
      )
    }

    if (!dato) continue

    tasks.push({
      title: rule.title,
      date: dato,
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
