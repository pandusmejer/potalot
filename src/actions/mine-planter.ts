'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import {
  generateTasksFromGuide, resolveGuideForInventory, filterRelevantTasks,
  partitionerPaaOpgavetype,
} from '@/lib/task-generation'
import { getAllGuides, ensureGuideForPlant } from '@/actions/guides'
import { deleteImage as deleteImageFromStorage } from '@/actions/storage'
import {
  maybeAwardFirstSowing, maybeAwardFirstHarvest, maybeAwardSeasonFinisher,
} from '@/actions/badges'
import { resolveOrCreateGardenLocation } from '@/actions/garden-locations'
import type { Plant, PlantImageSource, PlantLog, PlantStatus, PlantLogType } from '@/lib/types'
import { PLANT_STATUS_META } from '@/lib/constants'
import { PLANT_LOG_LABEL } from '@/lib/plant-log-meta'

// ============================================
// Mappers
// ============================================

interface PlantRow {
  id: string
  user_id: string
  source_inventory_id: string | null
  name: string
  variety: string | null
  status: string
  location: string | null
  garden_location_id: string | null
  sow_date: string | null
  planting_out_date: string | null
  first_harvest_date: string | null
  quantity: number
  image_urls: string[]
  primary_image_url: string | null
  image_source: string | null
  guide_id: string | null
  is_archived: boolean
  archived_at: string | null
  archived_year: number | null
  created_at: string
  updated_at: string
}

interface PlantLogRow {
  id: string
  plant_id: string
  user_id: string
  date: string
  type: string
  title: string | null
  note: string | null
  image_urls: string[]
  value_numeric: number | null
  value_text: string | null
  linked_task_id: string | null
  created_at: string
  updated_at: string
}

function rowToPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    userId: row.user_id,
    sourceElementId: row.source_inventory_id,
    name: row.name,
    variety: row.variety,
    status: row.status as PlantStatus,
    location: row.location,
    gardenLocationId: row.garden_location_id ?? null,
    sowDate: row.sow_date,
    plantingOutDate: row.planting_out_date,
    firstHarvestDate: row.first_harvest_date,
    quantity: row.quantity,
    imageIds: row.image_urls ?? [],
    primaryImageId: row.primary_image_url,
    imageSource: row.image_source as PlantImageSource,
    logIds: [],                  // populated separately
    guideId: row.guide_id,
    isArchived: row.is_archived,
    archivedAt: row.archived_at,
    archivedYear: row.archived_year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToLog(row: PlantLogRow): PlantLog {
  return {
    id: row.id,
    plantId: row.plant_id,
    userId: row.user_id,
    date: row.date,
    type: row.type as PlantLogType,
    title: row.title,
    note: row.note,
    imageIds: row.image_urls ?? [],
    valueNumeric: row.value_numeric,
    valueText: row.value_text,
    linkedTaskId: row.linked_task_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// Read
// ============================================

export async function getAllPlants(): Promise<Plant[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plants_v2')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAllPlants error:', error)
    return []
  }
  return (data as PlantRow[]).map(rowToPlant)
}

export async function getPlant(id: string): Promise<Plant | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plants_v2')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return rowToPlant(data as PlantRow)
}

export async function getPlantLogs(plantId: string): Promise<PlantLog[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plant_logs_v2')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) return []
  return (data as PlantLogRow[]).map(rowToLog)
}

// ============================================
// Mutations
// ============================================

export interface SaaFroeInput {
  inventoryItemId: string
  date: string                      // YYYY-MM-DD
  quantity: number
  containerType?: string
  location?: string
  note?: string
  /** Hvis sat: tilføj til denne eksisterende plante. Hvis udeladt og en findes for år+inventory, tilbydes valg via mergeStrategy. */
  attachToPlantId?: string
  /** 'merge' = tilføj til eksisterende plante for samme år, 'new' = opret nyt hold */
  mergeStrategy?: 'merge' | 'new'
}

/**
 * Sår fra et frøbank-element. Per spec sektion 13:
 * - Find eksisterende plante med samme inventory_item + growing_year
 * - Hvis findes og mergeStrategy != 'new': tilføj sowing_event til eksisterende plante
 * - Hvis ikke: opret ny plante + sowing_event
 * Returnerer mergeOption hvis valg skal tages.
 */
export async function saaFroeFraInventory(input: SaaFroeInput): Promise<
  | { id: string; tasksCreated: number; mergedIntoExisting: boolean }
  | { needsMergeChoice: true; existingPlantId: string }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Hent inventory item
  const { data: invItem, error: invErr } = await supabase
    .from('inventory_items')
    .select('id, name, variety, guide_id, status')
    .eq('id', input.inventoryItemId)
    .eq('user_id', userId)
    .single()

  if (invErr || !invItem) return { error: 'Frøposten blev ikke fundet.' }
  const inv = invItem as { id: string; name: string; variety: string | null; guide_id: string | null; status: string }
  let guideImageUrl: string | null = null
  if (inv.guide_id) {
    const { data: guide } = await supabase
      .from('guides')
      .select('primary_image_url')
      .eq('id', inv.guide_id)
      .maybeSingle()
    guideImageUrl = (guide?.primary_image_url as string | null | undefined) ?? null
  }

  const growingYear = parseInt(input.date.split('-')[0], 10)

  // Find eksisterende plante for samme år
  const { data: existing } = await supabase
    .from('plants_v2')
    .select('id')
    .eq('user_id', userId)
    .eq('source_inventory_id', inv.id)
    .eq('growing_year', growingYear)
    .eq('is_archived', false)
    .limit(1)
    .maybeSingle()

  // Beslut: merge til eksisterende eller opret ny
  let plantId: string
  let mergedIntoExisting = false

  if (input.attachToPlantId) {
    plantId = input.attachToPlantId
    mergedIntoExisting = true
  } else if (existing && input.mergeStrategy === 'new') {
    // Brugeren har valgt "opret nyt hold"
    const { data: newPlant, error: plantErr } = await createNewPlantEntry()
    if (plantErr || !newPlant) {
      console.error('opret plante fejlede:', plantErr)
      return { error: 'Kunne ikke oprette planten. Prøv igen.' }
    }
    plantId = newPlant.id
  } else if (existing && !input.mergeStrategy) {
    // Eksisterer og brugeren har ikke valgt — bed UI om valg
    return { needsMergeChoice: true, existingPlantId: existing.id }
  } else if (existing && input.mergeStrategy === 'merge') {
    plantId = existing.id
    mergedIntoExisting = true
  } else {
    // Ingen eksisterende — opret ny
    const { data: newPlant, error: plantErr } = await createNewPlantEntry()
    if (plantErr || !newPlant) {
      console.error('opret plante fejlede:', plantErr)
      return { error: 'Kunne ikke oprette planten. Prøv igen.' }
    }
    plantId = newPlant.id
  }

  // Opret sowing_event uanset
  await supabase
    .from('sowing_events')
    .insert({
      user_id: userId,
      plant_id: plantId,
      inventory_item_id: inv.id,
      sown_count: input.quantity,
      sowing_date: input.date,
      container_type: input.containerType || null,
      location: input.location || null,
      notes: input.note || null,
    })

  // Opdater plantens samlede quantity
  const { data: total } = await supabase
    .from('sowing_events')
    .select('sown_count')
    .eq('plant_id', plantId)
  const totalQty = (total ?? []).reduce((sum, r) => sum + (r as { sown_count: number }).sown_count, 0)
  await supabase
    .from('plants_v2')
    .update({ quantity: totalQty, updated_at: new Date().toISOString() })
    .eq('id', plantId)

  // Opdater inventory status hvis 'i_froebank'
  if (inv.status === 'i_froebank') {
    await supabase
      .from('inventory_items')
      .update({ status: 'saaet', updated_at: new Date().toISOString() })
      .eq('id', inv.id)
  }

  // Tasks: kun for nye planter (eksisterende har dem allerede)
  let tasksCreated = 0
  if (!mergedIntoExisting) {
    const allGuides = await getAllGuides()
    const guide = resolveGuideForInventory(
      { guideId: inv.guide_id, name: inv.name },
      allGuides
    )
    if (guide) {
      // Ved en TILBAGEVIRKENDE såning (sådato i fortiden) ville guidens gøremål
      // lande i fortiden og oversvømme kalenderen som "forsinket". Dem opretter
      // vi ikke — Potalot ved ikke om brugeren allerede har gjort dem (Anna
      // 16/7). Kun gøremål på/efter i dag lægges i kalenderen; historiske
      // milepæle kan indhentes manuelt (HistorikIndhent).
      const idagStr = new Date().toISOString().slice(0, 10)
      const generated = filterRelevantTasks(generateTasksFromGuide({
        guide,
        sowDate: input.date,
        plantId,
        inventoryItemId: inv.id as string,
      })).filter(t => t.date >= idagStr)
      // Isoleret validering FØR insert. Indsættelsen er ét batch, så en
      // enkelt række med en `task_type` uden for CHECK-constrainten afviste
      // tidligere ALLE gyldige opgaver i samme guide — lydløst. Nu frasorteres
      // den, resten oprettes, og afvigelsen logges. Se opgavetype.ts.
      const { gyldige, ugyldige } = partitionerPaaOpgavetype(generated)
      if (ugyldige.length > 0) {
        console.error(
          `[task-generation] ${ugyldige.length} opgave(r) fra guide ${guide.id} har en task_type `
          + `uden for kontrakten og springes over:`,
          ugyldige.map(t => `${t.title} (${t.taskType})`).join(' · '),
        )
      }
      if (gyldige.length > 0) {
        const taskRows = gyldige.map(t => ({
          user_id: userId,
          title: t.title,
          date: t.date,
          task_type: t.taskType,
          priority: t.priority,
          status: 'open',
          source: t.source,
          source_id: t.sourceId,
          linked_plant_id: t.linkedPlantId,
          linked_inventory_item_id: t.linkedInventoryItemId,
          linked_guide_id: null,
          is_recurring: false,
        }))
        const { error: taskErr } = await supabase.from('calendar_tasks').insert(taskRows)
        if (taskErr) {
          // Må ALDRIG forsvinde igen: det var den slugte fejl her, der gjorde
          // generatoren tavst virkningsløs for 19 af 22 private guides.
          console.error(
            `[task-generation] kunne ikke oprette ${taskRows.length} opgave(r) for plante ${plantId}:`,
            taskErr,
          )
        } else {
          tasksCreated = taskRows.length
        }
      }
    }
  }

  // first_sowing-badge — såningen er en lifecycle-event
  maybeAwardFirstSowing(userId).catch(() => {})

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${inv.id}`)
  revalidatePath('/mine-planter')
  revalidatePath(`/mine-planter/${plantId}`)
  revalidatePath('/kalender')
  revalidatePath('/')

  return { id: plantId, tasksCreated, mergedIntoExisting }

  async function createNewPlantEntry(): Promise<{ data: { id: string } | null; error: string | null }> {
    // Gør placeringen til et rigtigt dyrkningssted, så planten kobles via
    // garden_location_id (location-teksten bevares som fallback). Sti b i
    // persistens-sprinten: et sted skrevet ved såning bliver en GardenLocation.
    const gardenLocationId = input.location
      ? await resolveOrCreateGardenLocation(input.location)
      : null
    const { data, error } = await supabase
      .from('plants_v2')
      .insert({
        user_id: userId,
        source_inventory_id: inv.id,
        name: inv.name,
        variety: inv.variety,
        status: 'saaet',
        location: input.location || null,
        garden_location_id: gardenLocationId,
        sow_date: input.date,
        quantity: 0, // bliver opdateret efter sowing_event er sat
        growing_year: growingYear,
        guide_id: inv.guide_id,
        primary_image_url: guideImageUrl,
        image_source: guideImageUrl ? 'guide_reference' : null,
        is_archived: false,
      })
      .select('id')
      .single()
    return { data: data as { id: string } | null, error: error?.message ?? null }
  }
}

// ============================================
// Standalone plante-oprettelse (V1A — launch onboarding/data-rescue)
// ============================================

export interface EgenPlanteInput {
  /** Art (påkrævet), fx "Tomat". */
  name: string
  /** Sort ELLER type (fx "San Marzano" / "Cherrytomat"). null = ukendt sort. */
  variety?: string | null
  /** Antal planter i haven (mindst 1). */
  quantity?: number
  /** Dyrkningssted (bliver til en GardenLocation via resolver). */
  location?: string
  /** Startdato (ISO). Cirka-dato sendes som måned-01 (dagen er udfyldning). */
  sowDate?: string | null
  /**
   * Præcisionen af sowDate — så en omtrentlig måned aldrig fremstår præcis:
   *   'exact'   = brugeren angav en præcis dato
   *   'approx'  = måned-niveau (dagen i sowDate er udfyldning)
   *   'unknown' = brugeren ved det ikke (sowDate er null)
   * Persisteres i plants_v2.sow_date_precision (migration 00054).
   */
  sowDatePrecision?: 'exact' | 'approx' | 'unknown' | null
  /** Plantens nuværende stadie. Default: i_vaekst (den står allerede i haven). */
  status?: PlantStatus
  /** Valgfrit bruger-uploadet billede (URL). */
  imageUrl?: string | null
  /** Valgfri kort observation → gemmes som note-log. */
  observation?: string
}

/**
 * Opret en plante brugeren ALLEREDE har i haven — uden at gå gennem frøbanken.
 *
 * Fjerner launch-barrieren: `plants_v2.source_inventory_id` er allerede nullable,
 * så en manuelt oprettet plante repræsenteres eksplicit (feltet = null), ingen
 * falske placeholder-poster, ingen parallel model. Genbruger nøjagtig samme
 * felt-mapping og garden-location-resolver som `saaFroeFraInventory`; quantity
 * sættes direkte (ingen sowing_events, da der ikke er sået fra et frøbank-element).
 */
export async function opretEgenPlante(
  input: EgenPlanteInput,
): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const name = input.name.trim()
  if (!name) return { error: 'Angiv mindst en art.' }

  const variety = input.variety?.trim() || null
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1))
  const sowDate = input.sowDate || null
  const growingYear = sowDate ? parseInt(sowDate.split('-')[0], 10) : new Date().getFullYear()
  const status: PlantStatus = input.status ?? 'i_vaekst'
  const imageUrl = input.imageUrl?.trim() || null

  const gardenLocationId = input.location
    ? await resolveOrCreateGardenLocation(input.location)
    : null

  const { data: plant, error } = await supabase
    .from('plants_v2')
    .insert({
      user_id: userId,
      source_inventory_id: null, // standalone — eksplicit, ingen placeholder
      name,
      variety,
      status,
      location: input.location || null,
      garden_location_id: gardenLocationId,
      sow_date: sowDate,
      quantity,
      growing_year: growingYear,
      guide_id: null,
      primary_image_url: imageUrl,
      image_source: imageUrl ? 'user_upload' : null,
      sow_date_precision: input.sowDatePrecision ?? null,
      is_archived: false,
    })
    .select('id')
    .single()

  if (error || !plant) {
    return { error: error?.message ?? 'Kunne ikke oprette plante.' }
  }
  const plantId = (plant as { id: string }).id

  // Valgfri kort observation → note-log (dateret til startdato, ellers i dag).
  const obs = input.observation?.trim()
  if (obs) {
    await createPlantLog({
      plantId,
      date: sowDate ?? new Date().toISOString().slice(0, 10),
      type: 'note',
      note: obs,
    })
  }

  maybeAwardFirstSowing(userId).catch(() => {})

  // Baggrund: giv planten en guide (genbrug eksisterende eller AI-generér),
  // så "Se guide" på plantesiden fører til en ægte guide — som i frøbanken.
  // Køres efter response, så brugeren ikke venter på AI-kaldet.
  after(async () => {
    try {
      await ensureGuideForPlant(plantId)
    } catch (e) {
      console.error('[ensureGuideForPlant] fejl:', e)
    }
  })

  revalidatePath('/mine-planter')
  revalidatePath(`/mine-planter/${plantId}`)
  revalidatePath('/kalender')
  revalidatePath('/')

  return { id: plantId }
}

/**
 * Map en log-type til det stadie planten BØR være i efter eventet.
 * Returnerer null hvis loggen ikke afspejler en stadie-overgang.
 *
 * Reglen: vi rykker KUN fremad, aldrig tilbage. En 'watering'-log skal
 * fx ikke flytte en plante fra 'udplantet' tilbage til 'spirer'.
 */
const LOG_TO_STAGE: Partial<Record<PlantLogType, PlantStatus>> = {
  sowing: 'saaet',
  germination: 'spirer',
  planting_out: 'udplantet',
  harvest: 'hoestklar',
  // watering, fertilizing, pruning, pest_disease, repotting, note → null (intet skifte)
}

const STAGE_RANK: Record<PlantStatus, number> = {
  planlagt: 0,
  saaet: 1,
  spirer: 2,
  i_vaekst: 3,
  klar_til_udplantning: 4,
  udplantet: 5,
  hoestklar: 6,
  afsluttet: 7,
}

export async function createPlantLog(input: {
  plantId: string
  date: string
  type: PlantLogType
  title?: string
  note?: string
  imageUrls?: string[]
  /** Måleværdi (fx højde i cm) — kun for målings-typer. */
  valueNumeric?: number | null
  /** Enum-tilstand (fx trivsel 'good'|'okay'|'attention'). */
  valueText?: string | null
}): Promise<{ id: string; stageAdvancedTo?: PlantStatus } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const { data, error } = await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: input.plantId,
      user_id: userId,
      date: input.date,
      type: input.type,
      title: input.title || null,
      note: input.note || null,
      image_urls: input.imageUrls && input.imageUrls.length > 0 ? input.imageUrls : [],
      value_numeric: input.valueNumeric ?? null,
      value_text: input.valueText ?? null,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('createPlantLog fejlede:', error)
    return { error: 'Kunne ikke gemme loggen. Prøv igen.' }
  }

  // Auto-stage-advance: hvis loggen afspejler en livscyklus-event,
  // ryk plantens status frem (men aldrig tilbage)
  let stageAdvancedTo: PlantStatus | undefined
  const targetStage = LOG_TO_STAGE[input.type]
  if (targetStage) {
    const { data: plantRow } = await supabase
      .from('plants_v2')
      .select('status')
      .eq('id', input.plantId)
      .eq('user_id', userId)
      .maybeSingle()
    const currentStatus = plantRow?.status as PlantStatus | undefined
    if (currentStatus && STAGE_RANK[targetStage] > STAGE_RANK[currentStatus]) {
      await supabase
        .from('plants_v2')
        .update({ status: targetStage, updated_at: new Date().toISOString() })
        .eq('id', input.plantId)
        .eq('user_id', userId)
      // Tilføj ekstra status_change-log så historikken er sporet
      await supabase.from('plant_logs_v2').insert({
        plant_id: input.plantId,
        user_id: userId,
        date: input.date,
        type: 'status_change',
        note: `Status ændret automatisk til "${PLANT_STATUS_META[targetStage].label}" efter loggen "${PLANT_LOG_LABEL[input.type]}"`,
      })
      stageAdvancedTo = targetStage
    }
  }

  // Badge-checks (fire-and-forget, ignorér fejl)
  if (input.type === 'sowing' || input.type === 'germination') {
    maybeAwardFirstSowing(userId).catch(() => {})
  }
  if (input.type === 'harvest') {
    maybeAwardFirstHarvest(userId).catch(() => {})
  }

  revalidatePath(`/mine-planter/${input.plantId}`)
  return { id: data.id as string, stageAdvancedTo }
}

export async function updatePlantLog(input: {
  logId: string
  date: string
  type: PlantLogType
  title?: string
  note?: string
  imageUrls?: string[]
  valueNumeric?: number | null
  valueText?: string | null
}): Promise<{ ok: true; plantId: string } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const { data, error } = await supabase
    .from('plant_logs_v2')
    .update({
      date: input.date,
      type: input.type,
      title: input.title || null,
      note: input.note || null,
      image_urls: input.imageUrls && input.imageUrls.length > 0 ? input.imageUrls : [],
      value_numeric: input.valueNumeric ?? null,
      value_text: input.valueText ?? null,
    })
    .eq('id', input.logId)
    .eq('user_id', userId)
    .select('plant_id')
    .maybeSingle()

  if (error) {
    console.error('updatePlantLog fejlede:', error)
    return { error: 'Kunne ikke gemme ændringerne. Prøv igen.' }
  }
  if (!data) return { error: 'Loggen blev ikke fundet, eller du har ikke adgang til den.' }

  const plantId = data.plant_id as string
  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true, plantId }
}

export async function deletePlantLog(
  logId: string
): Promise<{ ok: true; plantId: string } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  // Hent plant_id først så vi kan revalidate korrekt path
  const { data: row, error: fetchErr } = await supabase
    .from('plant_logs_v2')
    .select('plant_id, image_urls')
    .eq('id', logId)
    .eq('user_id', userId)
    .maybeSingle()
  if (fetchErr) {
    console.error('deletePlantLog opslag fejlede:', fetchErr)
    return { error: 'Kunne ikke slette loggen. Prøv igen.' }
  }
  if (!row) return { error: 'Loggen blev ikke fundet.' }

  const { error: delErr } = await supabase
    .from('plant_logs_v2')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId)
  if (delErr) return { error: delErr.message }

  // Ryd op i Storage — best effort, ignorér fejl
  const urls = (row.image_urls as string[] | null) ?? []
  await Promise.all(urls.map(url => (async () => {
    try { await deleteImageFromStorage(url) } catch { /* ignore */ }
  })()))

  const plantId = row.plant_id as string
  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true, plantId }
}

export async function updatePlantStatus(
  plantId: string,
  status: PlantStatus,
  /** Faktisk dato hvor stadie-skiftet skete (default: i dag). YYYY-MM-DD. */
  effectiveDate?: string
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const logDate = effectiveDate ?? new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('plants_v2')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) {
    console.error('updatePlantStatus fejlede:', error)
    return { error: 'Kunne ikke ændre status. Prøv igen.' }
  }

  // Skriv også en log-entry så historikken er sporet — brug effective-date
  // så 'X dage i dette stadie' regnes korrekt selv hvis brugeren logger
  // skiftet senere
  await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: plantId,
      user_id: userId,
      date: logDate,
      type: 'status_change',
      note: `Status ændret til "${PLANT_STATUS_META[status].label}"`,
    })

  // Badge-checks baseret på det nye stadie
  if (status !== 'planlagt') {
    maybeAwardFirstSowing(userId).catch(() => {})
  }
  if (status === 'hoestklar' || status === 'afsluttet') {
    maybeAwardFirstHarvest(userId).catch(() => {})
  }
  if (status === 'afsluttet') {
    maybeAwardSeasonFinisher(userId).catch(() => {})
  }

  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true }
}

export async function archivePlant(plantId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()
  const now = new Date()

  const { error } = await supabase
    .from('plants_v2')
    .update({
      is_archived: true,
      archived_at: now.toISOString(),
      archived_year: now.getFullYear(),
      status: 'afsluttet',
      updated_at: now.toISOString(),
    })
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) {
    console.error('archivePlant fejlede:', error)
    return { error: 'Kunne ikke arkivere planten. Prøv igen.' }
  }

  await supabase.from('plant_logs_v2').insert({
    plant_id: plantId,
    user_id: userId,
    date: now.toISOString().split('T')[0],
    type: 'archive',
    title: 'Arkiveret',
    note: `Sæson afsluttet ${now.getFullYear()}`,
  })

  // season_finisher-badge
  maybeAwardSeasonFinisher(userId).catch(() => {})

  revalidatePath('/mine-planter')
  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true }
}

/**
 * Fortryd arkivering — hent en plante tilbage til de aktive. Rydder arkiv-
 * felterne og sætter status tilbage til 'i vækst', så den dukker op i haven igen.
 */
export async function restorePlant(plantId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const { error } = await supabase
    .from('plants_v2')
    .update({
      is_archived: false,
      archived_at: null,
      archived_year: null,
      status: 'i_vaekst',
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) {
    console.error('restorePlant fejlede:', error)
    return { error: 'Kunne ikke gendanne planten. Prøv igen.' }
  }

  revalidatePath('/mine-planter')
  revalidatePath('/mine-planter/arkiv')
  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true }
}

export interface UpdatePlantInput {
  name: string
  variety: string | null
  location: string | null
}

/**
 * Redigér en plantes kerne-info: navn, sort og sted. (Statusskift håndteres af
 * updatePlantStatus, log-events af updatePlantLog.) Anna 15/7: plante-siden er
 * ikke længere kun til at læse — en bruger skal kunne rette en tastefejl.
 */
export async function updatePlant(
  plantId: string,
  input: UpdatePlantInput,
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const name = input.name.trim()
  if (!name) return { error: 'Angiv mindst en art.' }
  const variety = input.variety?.trim() || null
  const location = input.location?.trim() || null
  const gardenLocationId = location ? await resolveOrCreateGardenLocation(location) : null

  const { error } = await supabase
    .from('plants_v2')
    .update({
      name,
      variety,
      location,
      garden_location_id: gardenLocationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) {
    console.error('updatePlant fejlede:', error)
    return { error: 'Kunne ikke gemme ændringerne. Prøv igen.' }
  }

  revalidatePath(`/mine-planter/${plantId}`)
  revalidatePath('/mine-planter')
  return { ok: true }
}

/**
 * Tilføj/skift plantens EGNE billeder — efter oprettelsen.
 *
 * Fyldte hullet (Anna 16/7): kun manuelt oprettede planter havde et foto-felt
 * ved oprettelsen. Planter oprettet via så-et-frø (frøbank) eller fritekst-
 * onboarding kunne aldrig få et rigtigt plantefoto SENERE — plantesidens
 * eneste virkende foto-indgang hang fotos på en log-hændelse, ikke på planten.
 *
 * Skriver til nøjagtig samme felter som `opretEgenPlante`/`saaFroeFraInventory`
 * (image_urls + primary_image_url + image_source), så det primære foto slår
 * igennem på plantekort-heroen. Tomt sæt → nulstil til afledt/guide-billede.
 */
export async function updatePlantPhotos(
  plantId: string,
  input: { imageUrls: string[]; primaryImageUrl: string | null },
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const urls = input.imageUrls.filter(Boolean)
  const primary =
    input.primaryImageUrl && urls.includes(input.primaryImageUrl)
      ? input.primaryImageUrl
      : (urls[0] ?? null)

  const { error } = await supabase
    .from('plants_v2')
    .update({
      image_urls: urls,
      primary_image_url: primary,
      // Egne fotos = 'user_upload'. Uden fotos falder heroen tilbage til det
      // guide-/afledte billede (image_source null → resolver vælger).
      image_source: primary ? 'user_upload' : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) {
    console.error('updatePlantPhotos fejlede:', error)
    return { error: 'Kunne ikke gemme fotos. Prøv igen.' }
  }

  revalidatePath(`/mine-planter/${plantId}`)
  revalidatePath('/mine-planter')
  revalidatePath('/')
  return { ok: true }
}

/**
 * Slet en plante HELT (modsat arkivér). Rydder også relateret data, så en
 * slettet plante ikke efterlader forældede log-events eller opgave-påmindelser.
 */
export async function deletePlant(plantId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  // Ryd afledt data først (scoped til ejeren).
  await supabase.from('plant_logs_v2').delete().eq('plant_id', plantId).eq('user_id', userId)
  await supabase.from('calendar_tasks').delete().eq('linked_plant_id', plantId).eq('user_id', userId)

  const { error } = await supabase
    .from('plants_v2')
    .delete()
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) {
    console.error('deletePlant fejlede:', error)
    return { error: 'Kunne ikke slette planten. Prøv igen.' }
  }

  revalidatePath('/mine-planter')
  return { ok: true }
}
