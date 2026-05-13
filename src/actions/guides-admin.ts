'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { revalidatePath } from 'next/cache'
import type {
  GuideQuickFacts, GuideSection, GuideCalendarRule,
  PrimaryCategoryId, Difficulty,
} from '@/lib/types'

export interface MasterGuideInput {
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
  primaryImageUrl?: string | null
}

export async function createMasterGuide(
  input: MasterGuideInput
): Promise<{ id: string } | { error: string }> {
  const { id: adminId } = await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('guides')
    .insert({
      user_id: null,
      created_by: adminId,
      plant_name: input.plantName.trim(),
      variety: input.variety?.trim() || null,
      latin_name: input.latinName?.trim() || null,
      guide_level: 'art',
      primary_category_id: input.primaryCategoryId,
      subcategory_id: input.subcategoryId ?? null,
      summary: input.summary?.trim() || null,
      difficulty: input.difficulty ?? null,
      tags: input.tags ?? [],
      quick_facts: input.quickFacts ?? {},
      sections: input.sections ?? [],
      calendar_rules: input.calendarRules ?? [],
      source_links: input.sourceLinks ?? [],
      primary_image_url: input.primaryImageUrl ?? null,
      is_ai_generated: false,
      status: 'published',
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette master-guide' }

  revalidatePath('/admin/guides')
  revalidatePath('/guides')
  return { id: data.id as string }
}

export async function updateMasterGuide(
  id: string,
  input: MasterGuideInput
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('guides')
    .update({
      plant_name: input.plantName.trim(),
      variety: input.variety?.trim() || null,
      latin_name: input.latinName?.trim() || null,
      primary_category_id: input.primaryCategoryId,
      subcategory_id: input.subcategoryId ?? null,
      summary: input.summary?.trim() || null,
      difficulty: input.difficulty ?? null,
      tags: input.tags ?? [],
      quick_facts: input.quickFacts ?? {},
      sections: input.sections ?? [],
      calendar_rules: input.calendarRules ?? [],
      source_links: input.sourceLinks ?? [],
      primary_image_url: input.primaryImageUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('user_id', null)

  if (error) return { error: error.message }

  revalidatePath('/admin/guides')
  revalidatePath('/guides')
  revalidatePath(`/guides/${id}`)
  return { ok: true }
}

/**
 * Promovér en bruger-ejet guide til master ved at sætte user_id = NULL.
 *
 * Tjekker først om en master med samme plant_name + variety allerede
 * eksisterer for at undgå at skabe to konkurrerende masters. Hvis ja:
 * returnér 'conflict' så UI kan tilbyde "erstat eksisterende master"-flow.
 *
 * Med option { replaceExistingMasterId } slettes den gamle master før
 * promovering, så brugerens version overtager rollen.
 */
export async function promoteGuideToMaster(
  guideId: string,
  options?: { replaceExistingMasterId?: string | null }
): Promise<
  | { ok: true }
  | { error: string }
  | { conflict: true; existingMasterId: string; existingMasterLabel: string }
> {
  const { id: adminId } = await requireAdmin()
  const supabase = await createClient()

  const { data: guide, error: guideErr } = await supabase
    .from('guides')
    .select('id, plant_name, variety, user_id')
    .eq('id', guideId)
    .maybeSingle()
  if (guideErr || !guide) return { error: 'Guide ikke fundet' }
  if (guide.user_id === null) return { error: 'Guiden er allerede master' }

  // Tjek for eksisterende master med samme plant_name + variety
  const variety = guide.variety as string | null
  let conflictQuery = supabase
    .from('guides')
    .select('id, plant_name, variety')
    .is('user_id', null)
    .ilike('plant_name', guide.plant_name as string)
    .neq('id', guideId)
  conflictQuery = variety === null
    ? conflictQuery.is('variety', null)
    : conflictQuery.ilike('variety', variety)
  const { data: existing } = await conflictQuery.maybeSingle()

  if (existing && existing.id !== options?.replaceExistingMasterId) {
    const label = existing.variety
      ? `${existing.plant_name} — ${existing.variety}`
      : (existing.plant_name as string)
    return { conflict: true, existingMasterId: existing.id as string, existingMasterLabel: label }
  }

  // Skal vi erstatte? Slet den gamle master først (vha. delete_guide_with_relink
  // som re-pointer items til den nye guide INDEN sletningen).
  if (options?.replaceExistingMasterId && existing) {
    const { error: relinkErr } = await supabase.rpc('delete_guide_with_relink', {
      p_guide_id: options.replaceExistingMasterId,
      p_replacement_guide_id: guideId,
    })
    if (relinkErr) return { error: `Kunne ikke erstatte eksisterende master: ${relinkErr.message}` }
  }

  // Promovér: fjern user_id, marker admin som creator
  const { error: updErr } = await supabase
    .from('guides')
    .update({
      user_id: null,
      created_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', guideId)
  if (updErr) return { error: updErr.message }

  revalidatePath('/admin/guides')
  revalidatePath('/guides')
  revalidatePath(`/guides/${guideId}`)
  return { ok: true }
}

export async function deleteMasterGuide(
  id: string,
  options?: { replacementGuideId?: string | null; notifyAffectedUsers?: boolean }
): Promise<{ ok: true; affectedUsers: number; relinked: number } | { error: string }> {
  await requireAdmin()
  // Delegér til den fælles deleteGuide-action — den håndterer relink,
  // notifikationer og autorisations-tjek via SECURITY DEFINER-RPC.
  const { deleteGuide } = await import('@/actions/guides')
  return deleteGuide(id, options)
}

export interface AdminGuideRow {
  id: string
  plantName: string
  variety: string | null
  latinName: string | null
  primaryCategoryId: PrimaryCategoryId
  summary: string
  difficulty?: Difficulty
  tags: string[]
  quickFacts: GuideQuickFacts
  sections: GuideSection[]
  calendarRules: GuideCalendarRule[]
  sourceLinks: string[]
  isMaster: boolean
  isAiGenerated: boolean
  ownerLabel: string | null
  ownerId: string | null
  flaggedAt: string | null
  flaggedReason: string | null
  deleteAt: string | null
  createdAt: string
  updatedAt: string
}

const COLS = 'id, plant_name, variety, latin_name, primary_category_id, summary, difficulty, tags, quick_facts, sections, calendar_rules, source_links, is_ai_generated, user_id, flagged_at, flagged_reason, delete_at, created_at, updated_at'

interface RawGuideRow {
  id: string
  plant_name: string
  variety: string | null
  latin_name: string | null
  primary_category_id: string
  summary: string | null
  difficulty: string | null
  tags: string[] | null
  quick_facts: Record<string, unknown> | null
  sections: unknown[] | null
  calendar_rules: unknown[] | null
  source_links: string[] | null
  is_ai_generated: boolean | null
  user_id: string | null
  flagged_at: string | null
  flagged_reason: string | null
  delete_at: string | null
  created_at: string
  updated_at: string
}

function normalizeQuickFacts(qf: Record<string, unknown> | null): GuideQuickFacts {
  const o = qf ?? {}
  return {
    sowingMonths: Array.isArray(o.sowingMonths) ? (o.sowingMonths as number[]) : [],
    directSowingMonths: Array.isArray(o.directSowingMonths) ? (o.directSowingMonths as number[]) : [],
    plantingOutMonths: Array.isArray(o.plantingOutMonths) ? (o.plantingOutMonths as number[]) : [],
    harvestMonths: Array.isArray(o.harvestMonths) ? (o.harvestMonths as number[]) : [],
    preCultivation: typeof o.preCultivation === 'boolean' ? o.preCultivation : undefined,
    light: o.light as GuideQuickFacts['light'],
    water: o.water as GuideQuickFacts['water'],
    soil: typeof o.soil === 'string' ? o.soil : undefined,
    germinationTemperature: typeof o.germinationTemperature === 'string' ? o.germinationTemperature : undefined,
    germinationDays: typeof o.germinationDays === 'string' ? o.germinationDays : undefined,
    plantSpacing: typeof o.plantSpacing === 'string' ? o.plantSpacing : undefined,
    rowSpacing: typeof o.rowSpacing === 'string' ? o.rowSpacing : undefined,
    sowingDepthMm: typeof o.sowingDepthMm === 'number' ? o.sowingDepthMm : undefined,
    frostSensitive: typeof o.frostSensitive === 'boolean' ? o.frostSensitive : undefined,
    minimumTemperature: typeof o.minimumTemperature === 'string' ? o.minimumTemperature : undefined,
  }
}

function mapRow(r: RawGuideRow, ownerLabel: string | null): AdminGuideRow {
  return {
    id: r.id,
    plantName: r.plant_name,
    variety: r.variety,
    latinName: r.latin_name,
    primaryCategoryId: r.primary_category_id as PrimaryCategoryId,
    summary: r.summary ?? '',
    difficulty: (r.difficulty as Difficulty | null) ?? undefined,
    tags: r.tags ?? [],
    quickFacts: normalizeQuickFacts(r.quick_facts),
    sections: (r.sections ?? []) as GuideSection[],
    calendarRules: (r.calendar_rules ?? []) as GuideCalendarRule[],
    sourceLinks: r.source_links ?? [],
    isMaster: r.user_id === null,
    isAiGenerated: !!r.is_ai_generated,
    ownerLabel,
    ownerId: r.user_id,
    flaggedAt: r.flagged_at,
    flaggedReason: r.flagged_reason,
    deleteAt: r.delete_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function getMasterGuides(): Promise<AdminGuideRow[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guides')
    .select(COLS)
    .is('user_id', null)
    .order('plant_name', { ascending: true })

  if (error || !data) return []
  return (data as unknown as RawGuideRow[]).map(r => mapRow(r, null))
}

/**
 * Bruger-ejede guides oprettet siden timestamp (default 30 dage). Bruges i
 * admin-oversigten til at se hvilke nye guider brugerne har genereret —
 * særligt AI-auto-genererede via ensureGuideForInventoryItem — så admin
 * kan beslutte om der skal laves en master.
 */
export async function getRecentUserGuides(
  options?: { sinceDays?: number }
): Promise<AdminGuideRow[]> {
  await requireAdmin()
  const supabase = await createClient()
  const sinceDays = options?.sinceDays ?? 30
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('guides')
    .select(COLS)
    .not('user_id', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  const rows = data as unknown as RawGuideRow[]

  // Hent display-name/username for de bruger-ids der optræder
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter((x): x is string => !!x)))
  const labelById = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .in('id', userIds)
    for (const p of (profiles ?? []) as { id: string; display_name: string | null; username: string | null }[]) {
      labelById.set(p.id, p.display_name ?? p.username ?? null)
    }
  }

  return rows.map(r => mapRow(r, labelById.get(r.user_id ?? '') ?? null))
}

/**
 * Flag en bruger-guide. Skjuler den for andre + sætter delete_at = nu+5 dage.
 * Owner ser banner med begrundelse + nedtælling.
 */
export async function flagUserGuide(
  guideId: string,
  reason: string
): Promise<{ ok: true } | { error: string }> {
  const { id: adminId } = await requireAdmin()
  if (!reason.trim()) return { error: 'Begrundelse er påkrævet' }

  const supabase = await createClient()
  const flaggedAt = new Date()
  const deleteAt = new Date(flaggedAt.getTime() + 5 * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('guides')
    .update({
      flagged_at: flaggedAt.toISOString(),
      flagged_reason: reason.trim(),
      flagged_by: adminId,
      delete_at: deleteAt.toISOString(),
    })
    .eq('id', guideId)
  if (error) return { error: error.message }

  revalidatePath('/admin/guides')
  revalidatePath(`/guides/${guideId}`)
  return { ok: true }
}

export async function unflagGuide(guideId: string): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('guides')
    .update({
      flagged_at: null,
      flagged_reason: null,
      flagged_by: null,
      delete_at: null,
    })
    .eq('id', guideId)
  if (error) return { error: error.message }
  revalidatePath('/admin/guides')
  revalidatePath(`/guides/${guideId}`)
  return { ok: true }
}

/**
 * Hent alle flagede guides (bruges i admin-oversigten).
 */
export async function getFlaggedGuides(): Promise<AdminGuideRow[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from('guides')
    .select(COLS)
    .not('flagged_at', 'is', null)
    .order('flagged_at', { ascending: true })

  if (!data || data.length === 0) return []
  const rows = data as unknown as RawGuideRow[]
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter((x): x is string => !!x)))
  const labelById = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .in('id', userIds)
    for (const p of (profiles ?? []) as { id: string; display_name: string | null; username: string | null }[]) {
      labelById.set(p.id, p.display_name ?? p.username ?? null)
    }
  }
  return rows.map(r => mapRow(r, labelById.get(r.user_id ?? '') ?? null))
}

/**
 * Returnér antal bruger-guides oprettet siden timestamp som har et
 * plant_name der IKKE matcher en eksisterende master. Det er dem admin
 * potentielt vil oprette en master til.
 */
export async function countUserGuidesNeedingMaster(
  options?: { sinceDays?: number }
): Promise<number> {
  await requireAdmin()
  const supabase = await createClient()
  const sinceDays = options?.sinceDays ?? 30
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()

  // Hent bruger-guides + master plant_names i ét kald
  const [{ data: userGuides }, { data: masters }] = await Promise.all([
    supabase
      .from('guides')
      .select('plant_name')
      .not('user_id', 'is', null)
      .gte('created_at', since),
    supabase
      .from('guides')
      .select('plant_name')
      .is('user_id', null),
  ])

  const masterNames = new Set(
    (masters ?? []).map(m => (m.plant_name as string).trim().toLowerCase())
  )
  const uniqueMissing = new Set<string>()
  for (const g of userGuides ?? []) {
    const n = (g.plant_name as string).trim().toLowerCase()
    if (!masterNames.has(n)) uniqueMissing.add(n)
  }
  return uniqueMissing.size
}

const AI_DRAFT_PROMPT = `Du er en ekspert i dansk havebrug.
Generér en dyrkningsguide som JSON for den angivne plante.

Format (alle felter valgfri undtagen plantName, summary):
{
  "plantName": "Tomat",
  "latinName": "Solanum lycopersicum",
  "variety": null eller "Black Cherry",
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
    {"taskType": "pre_sow", "title": "Forspir", "recommendedMonths": [3,4], "trigger": "sowingDate", "priority": "high"},
    {"taskType": "plant_out", "title": "Udplant", "recommendedMonths": [5,6], "trigger": "sowingDate", "relativeOffsetDays": 35, "priority": "high"},
    {"taskType": "harvest", "title": "Høst", "recommendedMonths": [7,8,9], "trigger": "sowingDate", "relativeOffsetDays": 90, "priority": "medium"}
  ]
}

Skriv på dansk. Vær konkret og realistisk for danske vækstforhold.
Returnér KUN gyldig JSON, ingen markdown, ingen forklaringer.`

export interface AiDraftFields {
  plantName?: string
  latinName?: string | null
  variety?: string | null
  primaryCategoryId?: PrimaryCategoryId
  summary?: string
  difficulty?: Difficulty
  tags?: string[]
  quickFacts?: GuideQuickFacts
  sections?: GuideSection[]
  calendarRules?: GuideCalendarRule[]
}

/**
 * Genererer et AI-udkast til en master-guide uden at gemme. Returnerer
 * felterne så admin kan inspicere og rette inden Save.
 */
export async function generateMasterDraftWithAI(input: {
  plantName: string
  latinName?: string
  variety?: string
  primaryCategoryId?: PrimaryCategoryId
}): Promise<{ fields: AiDraftFields } | { error: string }> {
  await requireAdmin()
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
      system: AI_DRAFT_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return { error: 'Tomt AI-svar' }
    raw = textBlock.text.trim()
  } catch (e: unknown) {
    return { error: `AI-fejl: ${e instanceof Error ? e.message : 'ukendt'}` }
  }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) raw = fenceMatch[1].trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'AI returnerede ugyldig JSON' }
  }

  const fields: AiDraftFields = {}
  if (typeof parsed.plantName === 'string') fields.plantName = parsed.plantName
  if (typeof parsed.latinName === 'string') fields.latinName = parsed.latinName
  if (typeof parsed.variety === 'string') fields.variety = parsed.variety
  if (typeof parsed.primaryCategoryId === 'string') {
    fields.primaryCategoryId = parsed.primaryCategoryId as PrimaryCategoryId
  }
  if (typeof parsed.summary === 'string') fields.summary = parsed.summary
  if (parsed.difficulty === 'easy' || parsed.difficulty === 'medium' || parsed.difficulty === 'hard') {
    fields.difficulty = parsed.difficulty
  }
  if (Array.isArray(parsed.tags)) {
    fields.tags = parsed.tags.filter((t): t is string => typeof t === 'string')
  }
  if (parsed.quickFacts && typeof parsed.quickFacts === 'object') {
    const qf = parsed.quickFacts as Record<string, unknown>
    fields.quickFacts = {
      sowingMonths: Array.isArray(qf.sowingMonths) ? (qf.sowingMonths as number[]) : [],
      directSowingMonths: Array.isArray(qf.directSowingMonths) ? (qf.directSowingMonths as number[]) : [],
      plantingOutMonths: Array.isArray(qf.plantingOutMonths) ? (qf.plantingOutMonths as number[]) : [],
      harvestMonths: Array.isArray(qf.harvestMonths) ? (qf.harvestMonths as number[]) : [],
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
    }
  }
  if (Array.isArray(parsed.sections)) {
    fields.sections = parsed.sections as GuideSection[]
  }
  if (Array.isArray(parsed.calendarRules)) {
    fields.calendarRules = parsed.calendarRules as GuideCalendarRule[]
  }
  return { fields }
}
