'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { revalidatePath } from 'next/cache'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { resolvePlantGuideHref } from '@/lib/plant-detail/resolve-guide-href'
import { normalizeGuideKey } from '@/lib/guides/normalize-key'
import { kanoniskArtsNavn } from '@/lib/arts-model'
import type { ImportGuideMatch } from '@/lib/guides/import-guide-match'
import type {
  Guide, GuideQuickFacts, GuideSection, GuideCalendarRule,
  PrimaryCategoryId, Difficulty, GuideStatus, GuideVisibility, GuideReviewStatus, GuideLevel,
} from '@/lib/types'
import { normaliserKalenderregler } from '@/lib/kalender/opgavetype'

interface GuideRow {
  id: string
  user_id: string | null
  plant_name: string
  variety: string | null
  latin_name: string | null
  guide_level: string
  parent_guide_id: string | null
  primary_category_id: string
  subcategory_id: string | null
  summary: string | null
  difficulty: string | null
  tags: string[]
  quick_facts: Record<string, unknown>
  sections: unknown[]
  calendar_rules: unknown[]
  primary_image_url: string | null
  source_links: string[]
  status: string
  is_ai_generated: boolean
  flagged_at: string | null
  flagged_reason: string | null
  delete_at: string | null
  created_at: string
  updated_at: string
}

function rowToGuide(row: GuideRow): Guide {
  const qf = (row.quick_facts ?? {}) as Record<string, unknown>
  const quickFacts: GuideQuickFacts = {
    sowingMonths: Array.isArray(qf.sowingMonths) ? qf.sowingMonths as number[] : [],
    directSowingMonths: Array.isArray(qf.directSowingMonths) ? qf.directSowingMonths as number[] : [],
    plantingOutMonths: Array.isArray(qf.plantingOutMonths) ? qf.plantingOutMonths as number[] : [],
    harvestMonths: Array.isArray(qf.harvestMonths) ? qf.harvestMonths as number[] : [],
    preCultivation: typeof qf.preCultivation === 'boolean' ? qf.preCultivation : undefined,
    light: qf.light as GuideQuickFacts['light'],
    water: qf.water as GuideQuickFacts['water'],
    soil: typeof qf.soil === 'string' ? qf.soil : undefined,
    germinationTemperature: typeof qf.germinationTemperature === 'string' ? qf.germinationTemperature : undefined,
    germinationDays: typeof qf.germinationDays === 'string' ? qf.germinationDays : undefined,
    plantSpacing: typeof qf.plantSpacing === 'string' ? qf.plantSpacing : undefined,
    rowSpacing: typeof qf.rowSpacing === 'string' ? qf.rowSpacing : undefined,
    sowingDepthMm: typeof qf.sowingDepthMm === 'number' ? qf.sowingDepthMm : undefined,
    frostSensitive: typeof qf.frostSensitive === 'boolean' ? qf.frostSensitive : undefined,
    minimumTemperature: typeof qf.minimumTemperature === 'string' ? qf.minimumTemperature : undefined,
    growthType: typeof qf.growthType === 'string' ? qf.growthType : undefined,
    height: typeof qf.height === 'string' ? qf.height : undefined,
    maturityDays: typeof qf.maturityDays === 'string' ? qf.maturityDays : undefined,
    primaryUse: typeof qf.primaryUse === 'string' ? qf.primaryUse : undefined,
  }
  return {
    id: row.id,
    plantName: row.plant_name,
    variety: row.variety,
    latinName: row.latin_name,
    guideLevel: row.guide_level as GuideLevel,
    parentGuideId: row.parent_guide_id,
    primaryCategoryId: row.primary_category_id as PrimaryCategoryId,
    subcategoryId: row.subcategory_id,
    summary: row.summary ?? '',
    difficulty: (row.difficulty ?? 'medium') as Difficulty,
    tags: row.tags ?? [],
    quickFacts,
    sections: (row.sections ?? []) as GuideSection[],
    calendarRules: (row.calendar_rules ?? []) as GuideCalendarRule[],
    mediaIds: row.primary_image_url ? [row.primary_image_url] : [],
    primaryImageId: row.primary_image_url,
    sourceLinks: row.source_links ?? [],
    status: row.status as GuideStatus,
    visibility: (row.user_id ? 'private' : 'public') as GuideVisibility,
    reviewStatus: 'approved' as GuideReviewStatus,
    flaggedAt: row.flagged_at ?? null,
    flaggedReason: row.flagged_reason ?? null,
    deleteAt: row.delete_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Find en genbrugelig guide til et navn(+sort) og foretræk masteren.
 *
 * Matcher på den DELTE normaliseringsnøgle (normalizeGuideKey), så apostrof-
 * og whitespace-varianter i sortsnavnet ("Gardener's Delight" vs "Gardeners
 * Delight") stadig kobler til master-guiden — ikke udløser et AI-udkast.
 * Artsnavnet kanoniseres først (arts-model.ts), så "Bønner"/"Stangbønne" og
 * bibliotekets "Bønne" mødes. Afgørelsen sker på den normaliserede nøgle i JS. Master-guides (user_id = NULL) vinder via
 * nullsFirst, dernæst ældste. Har item en SORT → kræv sortsmatch; ellers kun
 * arts-guide (variety IS NULL) — vi kobler ALDRIG en arts-guide til en sort.
 */
async function findReusableGuideId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  plantName: string,
  variety: string | null,
): Promise<string | null> {
  // Artsnavnet går gennem artsmodellen FØR nøglen dannes: guiderne hedder
  // altid arten ("Bønne"), mens posen kan hedde "Bønner" eller "Stangbønne".
  // Uden det genererede vi et nyt AI-udkast oven på en guide, vi allerede
  // havde.
  const artsNavn = kanoniskArtsNavn(plantName)
  const nameKey = normalizeGuideKey(artsNavn)
  const varietyKey = variety ? normalizeGuideKey(variety) : null

  // Ingen ilike-prefilter mere: prefilteret kunne kun kende ÉN stavemåde,
  // og et bruger-styret mønster hører ikke hjemme i et PostgREST-filter.
  // Afgørelsen sker alligevel på den normaliserede nøgle i JS — præcis som
  // i findExistingGuideIdsForImport, der også henter hele listen.
  const { data } = await supabase
    .from('guides')
    .select('id, plant_name, variety, user_id')
    .order('user_id', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })

  if (!data) return null
  const match = data.find(row => {
    if (normalizeGuideKey(kanoniskArtsNavn(row.plant_name as string)) !== nameKey) return false
    if (varietyKey) {
      return row.variety != null && normalizeGuideKey(row.variety as string) === varietyKey
    }
    return row.variety == null
  })
  return match ? (match.id as string) : null
}

/**
 * Slå EKSISTERENDE guides op for et helt batch af (navn, sort)-par.
 *
 * Genererer ALDRIG noget. Bruges af Excel-importen, hvor 100 rækker ikke
 * må udløse 100 AI-guide-genereringer, men hvor importerede poser heller
 * ikke skal være andenrangsborgere i Frøbanken.
 *
 * 1:1-REGLEN (vidensmodellen §"aldrig artsguides til sorter", ANNA-LÅST
 * 23/8): `guide_id` på en pose MED sort må kun pege på en rigtig
 * sortsguide.
 *
 *   pose med sort + sortsguide findes  → guideId = sortsguiden
 *   pose med sort, kun artsguide       → guideId = null, artsGuideId sat
 *   pose uden sort + artsguide findes  → guideId = artsguiden (det ER 1:1)
 *   ingenting                          → begge null
 *
 * Hvorfor det er vigtigt at LADE VÆRE med at gemme artsguiden på en sort:
 * `ensureGuideForInventoryItem` returnerer tidligt, så snart `guide_id` er
 * sat. Gemte vi artsguiden, ville posen aldrig kunne få sin rigtige
 * sortsguide, når den engang bliver produceret — en fælde der først viser
 * sig måneder senere. Visningen mister intet ved det: resolvePlantGuideHref
 * falder allerede tilbage til artsguiden på navn, når guide_id er tom.
 *
 * Ét opslag for hele importen; matchningen sker i hukommelsen. Master-
 * guides (user_id = NULL) foretrækkes frem for private.
 */
export async function findExistingGuideIdsForImport(
  par: { name: string; variety?: string | null }[],
): Promise<ImportGuideMatch[]> {
  await requireUser()
  const tom: ImportGuideMatch = { guideId: null, artsGuideId: null }
  if (par.length === 0) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('guides')
    .select('id, plant_name, variety, user_id')
    .order('user_id', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })

  if (!data) return par.map(() => ({ ...tom }))

  // Første match vinder — rækkefølgen fra queryen sætter master før privat.
  const sortsGuider = new Map<string, string>()
  const artsGuider = new Map<string, string>()
  for (const row of data) {
    const navnKey = normalizeGuideKey(kanoniskArtsNavn(row.plant_name as string))
    if (!navnKey) continue
    const sort = row.variety as string | null
    if (sort) {
      const key = `${navnKey}|${normalizeGuideKey(sort)}`
      if (!sortsGuider.has(key)) sortsGuider.set(key, row.id as string)
    } else if (!artsGuider.has(navnKey)) {
      artsGuider.set(navnKey, row.id as string)
    }
  }

  return par.map(({ name, variety }) => {
    // Samme kanonisering som ved koblingen: importens "Bønner" og
    // bibliotekets "Bønne" er den samme art.
    const navnKey = normalizeGuideKey(kanoniskArtsNavn(name))
    if (!navnKey) return { ...tom }
    const artsGuideId = artsGuider.get(navnKey) ?? null
    const sortKey = variety ? normalizeGuideKey(variety) : null

    if (!sortKey) {
      // Ingen sort → artsguiden ER 1:1-matchet og må gemmes.
      return { guideId: artsGuideId, artsGuideId }
    }
    // Med sort: kun en rigtig sortsguide må gemmes. Findes den ikke,
    // efterlades guide_id tom, så posen kan kobles korrekt senere.
    return { guideId: sortsGuider.get(`${navnKey}|${sortKey}`) ?? null, artsGuideId }
  })
}

export async function getAllGuides(): Promise<Guide[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('plant_name', { ascending: true })
  if (error) {
    console.error('getAllGuides error:', error)
    return []
  }
  return (data as GuideRow[]).map(rowToGuide)
}

export async function getGuide(id: string): Promise<Guide | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return rowToGuide(data as GuideRow)
}

export interface CreateGuideInput {
  plantName: string
  variety?: string | null
  latinName?: string | null
  primaryCategoryId: PrimaryCategoryId
  subcategoryId?: string | null
  summary?: string
  difficulty?: Difficulty
  tags?: string[]
  quickFacts?: GuideQuickFacts
  sections?: GuideSection[]
  calendarRules?: GuideCalendarRule[]
  sourceLinks?: string[]
  isAiGenerated?: boolean
  parentGuideId?: string | null
}

export async function createGuide(input: CreateGuideInput): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guides')
    .insert({
      user_id: userId,
      plant_name: input.plantName,
      variety: input.variety ?? null,
      latin_name: input.latinName ?? null,
      guide_level: input.parentGuideId ? 'sort' : 'art',
      parent_guide_id: input.parentGuideId ?? null,
      primary_category_id: input.primaryCategoryId,
      subcategory_id: input.subcategoryId ?? null,
      summary: input.summary ?? null,
      difficulty: input.difficulty ?? null,
      tags: input.tags ?? [],
      quick_facts: input.quickFacts ?? {},
      sections: input.sections ?? [],
      calendar_rules: normaliserKalenderregler(input.calendarRules ?? []).regler,
      source_links: input.sourceLinks ?? [],
      is_ai_generated: input.isAiGenerated ?? false,
      status: 'published',
    })
    .select('id')
    .single()
  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette guide' }

  revalidatePath('/guides')
  return { id: data.id as string }
}

/**
 * Klon en guide (typisk en master) til en bruger-ejet kopi. Bruges når en
 * bruger vil ændre i en master-guide — kopien bliver privat og kan
 * frit redigeres uden at påvirke originalen.
 */
export async function cloneGuideToOwn(
  sourceId: string
): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: src, error: srcErr } = await supabase
    .from('guides')
    .select('*')
    .eq('id', sourceId)
    .maybeSingle()
  if (srcErr || !src) return { error: 'Kunne ikke hente kilde-guide' }

  const { data, error } = await supabase
    .from('guides')
    .insert({
      user_id: userId,
      plant_name: src.plant_name,
      variety: src.variety,
      latin_name: src.latin_name,
      guide_level: src.guide_level,
      parent_guide_id: src.parent_guide_id,
      primary_category_id: src.primary_category_id,
      subcategory_id: src.subcategory_id,
      summary: src.summary,
      difficulty: src.difficulty,
      tags: src.tags ?? [],
      quick_facts: src.quick_facts ?? {},
      sections: src.sections ?? [],
      calendar_rules: normaliserKalenderregler(src.calendar_rules ?? []).regler,
      source_links: src.source_links ?? [],
      primary_image_url: src.primary_image_url,
      is_ai_generated: false,
      status: 'published',
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke kopiere guide' }

  // master_apprentice-badge: brugeren har klonet en master til personlig version
  const { maybeAwardMasterApprentice } = await import('@/actions/badges')
  maybeAwardMasterApprentice(userId).catch(() => {})

  revalidatePath('/guides')
  return { id: data.id as string }
}

export interface UpdateUserGuideInput {
  plantName: string
  variety?: string | null
  latinName?: string | null
  primaryCategoryId: PrimaryCategoryId
  summary?: string
  difficulty?: Difficulty
  tags?: string[]
  quickFacts?: GuideQuickFacts
  sections?: GuideSection[]
  calendarRules?: GuideCalendarRule[]
  sourceLinks?: string[]
  /** URL til primært billede (Supabase storage). null = fjern. undefined = uændret. */
  primaryImageUrl?: string | null
}

/**
 * Opdatér en bruger-ejet guide. RLS sikrer at kun ejeren kan ændre.
 */
export async function updateUserGuide(
  id: string,
  input: UpdateUserGuideInput
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Byg update-objekt; primary_image_url tilføjes kun hvis explicit angivet
  // (undefined = behold eksisterende, null = ryd, string = sæt)
  const updatePayload: Record<string, unknown> = {
    plant_name: input.plantName.trim(),
    variety: input.variety?.trim() || null,
    latin_name: input.latinName?.trim() || null,
    primary_category_id: input.primaryCategoryId,
    summary: input.summary?.trim() || null,
    difficulty: input.difficulty ?? null,
    tags: input.tags ?? [],
    quick_facts: input.quickFacts ?? {},
    sections: input.sections ?? [],
    calendar_rules: normaliserKalenderregler(input.calendarRules ?? []).regler,
    source_links: input.sourceLinks ?? [],
    updated_at: new Date().toISOString(),
  }
  if (input.primaryImageUrl !== undefined) {
    updatePayload.primary_image_url = input.primaryImageUrl
  }

  const { error } = await supabase
    .from('guides')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/guides')
  revalidatePath(`/guides/${id}`)
  return { ok: true }
}

export interface GuideUsageStats {
  inventoryItems: number
  plants: number
  varieties: number
  affectedUsers: number
  replacementGuideId: string | null
  replacementGuideLabel: string | null
}

export async function getGuideUsageStats(id: string): Promise<GuideUsageStats | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('guide_usage_stats', { p_guide_id: id })
  if (error) return { error: error.message }
  const raw = data as Record<string, unknown> | null
  if (!raw) return { error: 'Ingen data' }
  if (typeof raw.error === 'string') return { error: raw.error }
  return {
    inventoryItems: Number(raw.inventory_items) || 0,
    plants: Number(raw.plants) || 0,
    varieties: Number(raw.varieties) || 0,
    affectedUsers: Number(raw.affected_users) || 0,
    replacementGuideId: (raw.replacement_guide_id as string | null) ?? null,
    replacementGuideLabel: (raw.replacement_guide_label as string | null) ?? null,
  }
}

/**
 * Slet en guide. Hvis options.replacementGuideId angives, re-pointes
 * alle berørte items/planter/sorter til den replacement INDEN sletning
 * (bevarer linket, hvor SET NULL ellers ville have ramt). Hvis
 * options.notifyAffectedUsers er true, sendes notifikationer til alle
 * brugere hvis indhold blev berørt.
 */
export async function deleteGuide(
  id: string,
  options?: { replacementGuideId?: string | null; notifyAffectedUsers?: boolean }
): Promise<{ ok: true; affectedUsers: number; relinked: number } | { error: string }> {
  const { id: actorId } = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('delete_guide_with_relink', {
    p_guide_id: id,
    p_replacement_guide_id: options?.replacementGuideId ?? null,
  })
  if (error) return { error: error.message }
  const result = data as {
    plant_name: string
    affected_user_ids: string[]
    relinked_inventory: number
    relinked_plants: number
    relinked_varieties: number
  } | null
  if (!result) return { error: 'Sletning fejlede' }

  const affectedIds = (result.affected_user_ids ?? []).filter(uid => uid !== actorId)
  const relinked = (result.relinked_inventory ?? 0) + (result.relinked_plants ?? 0) + (result.relinked_varieties ?? 0)

  // Notificér berørte brugere
  if (options?.notifyAffectedUsers && affectedIds.length > 0) {
    const guidanceMsg = relinked > 0
      ? `Dine items er automatisk re-linket til en anden guide for "${result.plant_name}".`
      : `Dine items for "${result.plant_name}" har mistet guide-link. Find dem under "Mangler guide" i frøbanken.`
    await Promise.all(
      affectedIds.map(async uid => {
        try {
          await supabase.rpc('enqueue_notification', {
            p_user_id: uid,
            p_type: 'guide_deleted',
            p_actor_user_id: actorId,
            p_title: `Guiden "${result.plant_name}" er slettet`,
            p_body: guidanceMsg,
            p_link: '/froebank?filter=mangler-guide',
            p_group_id: null,
            p_idea_id: null,
            p_forum_post_id: null,
            p_swap_listing_id: null,
          })
        } catch { /* ignore */ }
      })
    )
  }

  revalidatePath('/guides')
  revalidatePath('/admin/guides')
  revalidatePath(`/guides/${id}`)
  revalidatePath('/froebank')
  revalidatePath('/mine-planter')
  return { ok: true, affectedUsers: affectedIds.length, relinked }
}

/**
 * Sikrer at en PLANTE har en guide tilknyttet — søster til
 * ensureGuideForInventoryItem, men for plants_v2:
 *  1. Hvis allerede tilknyttet → ingen handling
 *  2. Hvis en guide matcher plantens navn(+sort) → genbrug (master foretrækkes)
 *  3. Ellers AI-generér ny guide og tilknyt + notificér om udkastet
 *
 * Tænkt brugt som baggrundsjob via Next.js after() efter opretEgenPlante
 * (standalone + fritekst-onboarding), så "Se guide" på plantesiden fører til
 * en ægte guide i stedet for /guides-forsiden — nøjagtig som i frøbanken.
 */
export async function ensureGuideForPlant(plantId: string): Promise<
  { ok: true; guideId: string; reused: boolean; generated: boolean }
  | { ok: true; alreadyAttached: true }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: plant } = await supabase
    .from('plants_v2')
    .select('id, name, variety, guide_id')
    .eq('id', plantId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!plant) return { error: 'Plant not found' }
  if (plant.guide_id) return { ok: true, alreadyAttached: true }

  const plantName = (plant.name as string).trim()
  const variety = (((plant.variety as string | null) ?? '').trim()) || null

  // Editorial-first: findes der allerede en kurateret MD-guide (art/sort) der
  // matcher plantens navn, foretrækker vi DEN frem for et AI-udkast. Plante-
  // sidens resolver router til den via navn, så vi lader guide_id være null og
  // genererer IKKE en overflødig guide. (Samme matchning som "Se guide"-linket.)
  const editorialHref = resolvePlantGuideHref(
    { guideId: null, name: plantName, variety },
    IMPORTED_GUIDES,
  )
  if (editorialHref !== '/guides') {
    return { ok: true, alreadyAttached: true }
  }

  // 1:1-match (vidensmodel): har planten en SORT → match navn+sort (sorts-
  // guide); ellers navn + ingen sort (arts-guide). Master-guides (user_id =
  // NULL) foretrækkes, og matchning sker på den normaliserede nøgle.
  const guideId = await findReusableGuideId(supabase, plantName, variety)
  if (guideId) {
    await supabase
      .from('plants_v2')
      .update({ guide_id: guideId, updated_at: new Date().toISOString() })
      .eq('id', plantId)
      .eq('user_id', userId)
    revalidatePath(`/mine-planter/${plantId}`)
    return { ok: true, guideId, reused: true, generated: false }
  }

  // Ingen match → generér. For en sort kobles guiden til en evt. MASTER
  // arts-guide som forælder, så sorten hænger korrekt under sin art.
  let parentGuideId: string | null = null
  if (variety) {
    const { data: parent } = await supabase
      .from('guides')
      .select('id')
      .ilike('plant_name', kanoniskArtsNavn(plantName))
      .is('variety', null)
      .is('user_id', null)
      .limit(1)
    parentGuideId = parent && parent.length > 0 ? (parent[0].id as string) : null
  }

  const gen = await generateGuideWithAI({
    plantName,
    variety: variety ?? undefined,
    parentGuideId,
  })
  if ('error' in gen) return { error: gen.error }

  await supabase
    .from('plants_v2')
    .update({ guide_id: gen.id, updated_at: new Date().toISOString() })
    .eq('id', plantId)
    .eq('user_id', userId)
  revalidatePath(`/mine-planter/${plantId}`)

  // Punkt 3 (vidensmodel): fortæl brugeren at der er lavet et privat udkast,
  // så de kan gennemlæse og notere på det. actor = null (systemet).
  const guideNavn = variety ? `${plantName} · ${variety}` : plantName
  try {
    await supabase.rpc('enqueue_notification', {
      p_user_id: userId,
      p_type: 'guide_draft',
      p_actor_user_id: null,
      p_title: 'Vi har lavet et udkast til din guide',
      p_body: `Et udkast til "${guideNavn}" er klar — kig på den og tilføj dine egne noter.`,
      p_link: `/guides/${gen.id}`,
      p_group_id: null,
      p_idea_id: null,
      p_forum_post_id: null,
      p_swap_listing_id: null,
    })
  } catch { /* notifikation er best-effort */ }

  return { ok: true, guideId: gen.id, reused: false, generated: true }
}

export async function attachGuideToInventory(
  inventoryId: string,
  guideId: string | null
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_items')
    .update({ guide_id: guideId, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath(`/froebank/${inventoryId}`)
  revalidatePath('/froebank')
  return { ok: true }
}

// ============================================
// AI-generation
// ============================================

const AI_GUIDE_PROMPT = `Du er en ekspert i dansk havebrug.
Generér en dyrkningsguide som JSON for den angivne plante.

Format (alle felter valgfri undtagen plantName, summary):
{
  "plantName": "Tomat",
  "latinName": "Solanum lycopersicum",
  "variety": "Black Cherry" eller null,
  "primaryCategoryId": "fro",
  "summary": "Kort 1-2 sætningers beskrivelse",
  "difficulty": "easy" | "medium" | "hard",
  "tags": ["drivhus", "varmekrævende"],
  "quickFacts": {
    "preCultivation": true,
    "sowingMonths": [3,4],
    "directSowingMonths": [],
    "plantingOutMonths": [5,6],
    "harvestMonths": [7,8,9],
    "light": "full_sun" | "partial_shade" | "shade",
    "water": "low" | "regular" | "high",
    "soil": "Næringsrig, veldrænet",
    "germinationTemperature": "20-25°C",
    "germinationDays": "7-14 dage",
    "plantSpacing": "40-60 cm",
    "rowSpacing": "60-80 cm",
    "sowingDepthMm": 5,
    "frostSensitive": true,
    "minimumTemperature": "10°C"
  },
  "sections": [
    {"key": "intro", "title": "Introduktion", "body": "Markdown-tekst..."},
    {"key": "sowing", "title": "Såning", "body": "..."},
    {"key": "care", "title": "Pasning", "body": "..."},
    {"key": "harvest", "title": "Høst", "body": "..."},
    {"key": "problems", "title": "Almindelige problemer", "body": "..."}
  ],
  "calendarRules": [
    {"taskType": "pre_sow", "title": "Forspir tomat", "recommendedMonths": [3,4], "trigger": "sowingDate", "priority": "high"},
    {"taskType": "plant_out", "title": "Udplant", "recommendedMonths": [5,6], "trigger": "sowingDate", "relativeOffsetDays": 35, "priority": "high"},
    {"taskType": "harvest", "title": "Høst", "recommendedMonths": [7,8,9], "trigger": "sowingDate", "relativeOffsetDays": 90, "priority": "medium"}
  ]
}

taskType SKAL være én af præcis disse 13 værdier — opfind aldrig nye:
pre_sow, sowing, repot, plant_out, watering, fertilizing, pruning,
pest_check, harvest, weeding, maintenance, planning, custom
Passer handlingen ikke i én af dem, brug "maintenance" (pasning) eller
"custom". Skriv IKKE fx "care", "prick_out", "harden_off" eller "bloom".

Skriv på dansk. Vær konkret og realistisk for danske vækstforhold.
Returnér KUN gyldig JSON, ingen markdown, ingen forklaringer.`

export async function generateGuideWithAI(input: {
  plantName: string
  latinName?: string
  variety?: string
  primaryCategoryId?: PrimaryCategoryId
  /** Master arts-guide en sorts-guide skal hænge under (1:1-regel). */
  parentGuideId?: string | null
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const anthropic = getAnthropicClient()

  const userMessage = `Generér dyrkningsguide for:
- Dansk navn: ${input.plantName}
${input.latinName ? `- Latinsk: ${input.latinName}` : ''}
${input.variety ? `- Sort: ${input.variety}` : ''}
${input.primaryCategoryId ? `- Kategori: ${input.primaryCategoryId}` : ''}`

  let raw: string
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 4096,
      system: AI_GUIDE_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return { error: 'Tom AI-svar' }
    raw = textBlock.text.trim()
  } catch (e: unknown) {
    return { error: `AI-fejl: ${e instanceof Error ? e.message : 'ukendt'}` }
  }

  // Strip evt. markdown
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) raw = fenceMatch[1].trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'AI returnerede ugyldig JSON' }
  }

  const plantName = typeof parsed.plantName === 'string' ? parsed.plantName : input.plantName
  const summary = typeof parsed.summary === 'string' ? parsed.summary : ''
  const primaryCategoryId = (parsed.primaryCategoryId as PrimaryCategoryId) ?? input.primaryCategoryId ?? 'fro'
  const variety = typeof parsed.variety === 'string' ? parsed.variety : (input.variety ?? null)
  // 1:1-regel (vidensmodel): en upload MED sort → sorts-guide, aldrig arts-guide.
  // Sorten hænger under sin art via parent_guide_id når en master-art findes.
  const isSort = Boolean((variety && variety.trim()) || input.parentGuideId)

  // Opgavetype-kontrakten: modellen finder jævnligt på typer, databasen ikke
  // accepterer (`care`, `prick_out`, `bloom` …). De normaliseres FØR skrivning,
  // så en AI-guide aldrig kan lande ugyldig i basen. Se opgavetype.ts.
  const kalender = normaliserKalenderregler(parsed.calendarRules)
  if (kalender.aendringer.length > 0) {
    console.warn(
      `[guide-ai] normaliserede ${kalender.aendringer.length} taskType(r) for "${plantName}":`,
      kalender.aendringer.map(a => `${a.titel}: ${a.fra} → ${a.til} (${a.kilde})`).join(' · '),
    )
  }

  const { data, error } = await supabase
    .from('guides')
    .insert({
      user_id: userId,
      plant_name: plantName,
      variety,
      latin_name: typeof parsed.latinName === 'string' ? parsed.latinName : (input.latinName ?? null),
      guide_level: isSort ? 'sort' : 'art',
      parent_guide_id: input.parentGuideId ?? null,
      primary_category_id: primaryCategoryId,
      summary,
      difficulty: typeof parsed.difficulty === 'string' ? parsed.difficulty : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      quick_facts: parsed.quickFacts ?? {},
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      calendar_rules: kalender.regler,
      is_ai_generated: true,
      status: 'published',
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke gemme guide' }

  revalidatePath('/guides')
  return { id: data.id as string }
}

/**
 * Sikrer at et inventory item har en guide tilknyttet:
 *  1. Hvis allerede tilknyttet → ingen handling
 *  2. Hvis et andet item med samme plantName har en guide → genbrug
 *  3. Ellers AI-generér ny guide og tilknyt
 *
 * Tænkt brugt som baggrundsjob via Next.js after() efter createInventoryItem.
 */
export async function ensureGuideForInventoryItem(inventoryId: string): Promise<
  { ok: true; guideId: string; reused: boolean; generated: boolean }
  | { ok: true; alreadyAttached: true }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('inventory_items')
    .select('id, name, latin_name, variety, primary_category_id, guide_id')
    .eq('id', inventoryId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!item) return { error: 'Item not found' }
  if (item.guide_id) return { ok: true, alreadyAttached: true }

  const plantName = (item.name as string).trim()
  const variety = (((item.variety as string | null) ?? '').trim()) || null

  // 1:1-match (vidensmodel): en guide skal matche PRÆCIS det uploadede.
  // Har item en SORT → match navn+sort (sorts-guide). Ellers navn + ingen sort
  // (arts-guide). Vi attacher ALDRIG en arts-guide til en sort. Master-guides
  // (user_id = NULL) foretrækkes, og matchning sker på den normaliserede nøgle,
  // så en master genbruges frem for at generere et overflødigt AI-udkast.
  const guideId = await findReusableGuideId(supabase, plantName, variety)
  if (guideId) {
    await supabase
      .from('inventory_items')
      .update({ guide_id: guideId, updated_at: new Date().toISOString() })
      .eq('id', inventoryId)
      .eq('user_id', userId)
    revalidatePath(`/froebank/${inventoryId}`)
    return { ok: true, guideId, reused: true, generated: false }
  }

  // Ingen 1:1-match → generér. For en sort kobles guiden til en evt. MASTER
  // arts-guide som forælder, så sorten hænger korrekt under sin art.
  let parentGuideId: string | null = null
  if (variety) {
    const { data: parent } = await supabase
      .from('guides')
      .select('id')
      .ilike('plant_name', kanoniskArtsNavn(plantName))
      .is('variety', null)
      .is('user_id', null)
      .limit(1)
    parentGuideId = parent && parent.length > 0 ? (parent[0].id as string) : null
  }

  const gen = await generateGuideWithAI({
    plantName,
    latinName: (item.latin_name as string | null) ?? undefined,
    variety: variety ?? undefined,
    primaryCategoryId: item.primary_category_id as PrimaryCategoryId,
    parentGuideId,
  })
  if ('error' in gen) return { error: gen.error }

  await supabase
    .from('inventory_items')
    .update({ guide_id: gen.id, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)
    .eq('user_id', userId)
  revalidatePath(`/froebank/${inventoryId}`)

  // Punkt 3 (vidensmodel): brugeren skal vide, at der er lavet et privat
  // udkast til deres guide — så de kan gennemlæse og notere på den. actor =
  // null (systemet), ellers skipper enqueue_notification (afsender=modtager).
  const guideNavn = variety ? `${plantName} · ${variety}` : plantName
  try {
    await supabase.rpc('enqueue_notification', {
      p_user_id: userId,
      p_type: 'guide_draft',
      p_actor_user_id: null,
      p_title: 'Vi har lavet et udkast til din guide',
      p_body: `Et udkast til "${guideNavn}" er klar — kig på den og tilføj dine egne noter.`,
      p_link: `/guides/${gen.id}`,
      p_group_id: null,
      p_idea_id: null,
      p_forum_post_id: null,
      p_swap_listing_id: null,
    })
  } catch { /* notifikation er best-effort */ }

  return { ok: true, guideId: gen.id, reused: false, generated: true }
}
