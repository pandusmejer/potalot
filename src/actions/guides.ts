'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { revalidatePath } from 'next/cache'
import type {
  Guide, GuideQuickFacts, GuideSection, GuideCalendarRule,
  PrimaryCategoryId, Difficulty, GuideStatus, GuideVisibility, GuideReviewStatus, GuideLevel,
} from '@/lib/types'

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
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
      calendar_rules: input.calendarRules ?? [],
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
      calendar_rules: src.calendar_rules ?? [],
      source_links: src.source_links ?? [],
      primary_image_url: src.primary_image_url,
      is_ai_generated: false,
      status: 'published',
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke kopiere guide' }

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

  const { error } = await supabase
    .from('guides')
    .update({
      plant_name: input.plantName.trim(),
      variety: input.variety?.trim() || null,
      latin_name: input.latinName?.trim() || null,
      primary_category_id: input.primaryCategoryId,
      summary: input.summary?.trim() || null,
      difficulty: input.difficulty ?? null,
      tags: input.tags ?? [],
      quick_facts: input.quickFacts ?? {},
      sections: input.sections ?? [],
      calendar_rules: input.calendarRules ?? [],
      source_links: input.sourceLinks ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/guides')
  revalidatePath(`/guides/${id}`)
  return { ok: true }
}

export async function deleteGuide(id: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('guides')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/guides')
  return { ok: true }
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

Skriv på dansk. Vær konkret og realistisk for danske vækstforhold.
Returnér KUN gyldig JSON, ingen markdown, ingen forklaringer.`

export async function generateGuideWithAI(input: {
  plantName: string
  latinName?: string
  variety?: string
  primaryCategoryId?: PrimaryCategoryId
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

  const { data, error } = await supabase
    .from('guides')
    .insert({
      user_id: userId,
      plant_name: plantName,
      variety: typeof parsed.variety === 'string' ? parsed.variety : (input.variety ?? null),
      latin_name: typeof parsed.latinName === 'string' ? parsed.latinName : (input.latinName ?? null),
      guide_level: 'art',
      primary_category_id: primaryCategoryId,
      summary,
      difficulty: typeof parsed.difficulty === 'string' ? parsed.difficulty : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      quick_facts: parsed.quickFacts ?? {},
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      calendar_rules: Array.isArray(parsed.calendarRules) ? parsed.calendarRules : [],
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

  // Find eksisterende guide for samme plantName (case-insensitive)
  const { data: existing } = await supabase
    .from('guides')
    .select('id')
    .ilike('plant_name', plantName)
    .order('created_at', { ascending: true })
    .limit(1)

  if (existing && existing.length > 0) {
    const guideId = existing[0].id as string
    await supabase
      .from('inventory_items')
      .update({ guide_id: guideId, updated_at: new Date().toISOString() })
      .eq('id', inventoryId)
      .eq('user_id', userId)
    revalidatePath(`/froebank/${inventoryId}`)
    return { ok: true, guideId, reused: true, generated: false }
  }

  const gen = await generateGuideWithAI({
    plantName,
    latinName: (item.latin_name as string | null) ?? undefined,
    variety: (item.variety as string | null) ?? undefined,
    primaryCategoryId: item.primary_category_id as PrimaryCategoryId,
  })
  if ('error' in gen) return { error: gen.error }

  await supabase
    .from('inventory_items')
    .update({ guide_id: gen.id, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)
    .eq('user_id', userId)
  revalidatePath(`/froebank/${inventoryId}`)
  return { ok: true, guideId: gen.id, reused: false, generated: true }
}
