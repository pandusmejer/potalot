'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { GUIDE_FACTS } from '@/data/guide-facts-index.generated'

/**
 * "Gem fra Gartneren" (Annas design 10/8 + kontekst-regel samme aften, spec:
 * Docs/product/gem-fra-gartneren.md): gemt Gartner-viden skal BEHOLDE den
 * kontekst, den blev skabt i.
 *
 *   Guide-svar   → Guides → Gemt fra Gartneren (plant_id IS NULL)
 *   Plante-svar  → den konkrete plantes side ("Gemte råd")
 *
 * Der gemmes ALTID spørgsmål + svar + kontekst sammen. Brugeren skal altid
 * kunne svare på: "Hvad handlede det her om?" og "Hvorfor ligger det her?"
 * guide_id valideres mod GUIDE_FACTS før insert. Handlingen er idempotent:
 * samme svar i samme kontekst gemmes aldrig to gange.
 */

export interface GartnerGemt {
  id: string
  question: string
  answer: string
  guideId: string | null
  plantId: string | null
  /** Kontekst-label til kortet: guide-titel ("Tomat 'Green Zebra'") eller
   * plante ("Dahlia · Café au Lait") — null kun for helt kontekstløse svar. */
  kontekst: string | null
  createdAt: string
}

interface GemResultat {
  ok: true
  /** Hvor svaret kan findes igen — styrer feedback-copy i klienten. */
  sted: 'guide' | 'plante'
  planteNavn: string | null
  /** true = var allerede gemt (idempotent — ingen dublet oprettet). */
  allerede: boolean
}

const MAX_QUESTION = 1000
const MAX_ANSWER = 10_000

function guideTitel(guideId: string | null): string | null {
  if (!guideId) return null
  const g = GUIDE_FACTS.find(x => x.id === guideId)
  if (!g) return null
  return g.variety ? `${g.plantName ?? ''} '${g.variety}'`.trim() : (g.plantName ?? guideId)
}

function planteLabel(p: { name: string; variety: string | null } | null): string | null {
  if (!p) return null
  return p.variety ? `${p.name} · ${p.variety}` : p.name
}

export async function saveGartnerSvar(input: {
  question: string
  answer: string
  guideId?: string | null
  plantId?: string | null
}): Promise<GemResultat | { error: string }> {
  const { id: userId } = await requireUser()
  const question = input.question.trim().slice(0, MAX_QUESTION)
  const answer = input.answer.trim().slice(0, MAX_ANSWER)
  if (!question || !answer) return { error: 'Der mangler et spørgsmål eller et svar at gemme.' }

  // Kun guide-id'er der faktisk findes i biblioteket bindes — ellers null.
  const guideId =
    input.guideId && GUIDE_FACTS.some(g => g.id === input.guideId)
      ? input.guideId
      : null
  const plantId = input.plantId ?? null

  const supabase = await createClient()

  // Plantens navn — både til feedback-copy ("find det igen på Café au Laits
  // planteside") og som kontrol af, at planten findes og er brugerens (RLS).
  let planteNavn: string | null = null
  if (plantId) {
    const { data: plant } = await supabase
      .from('plants_v2')
      .select('name, variety')
      .eq('id', plantId)
      .maybeSingle()
    planteNavn = planteLabel(plant as { name: string; variety: string | null } | null)
  }
  const sted: GemResultat['sted'] = plantId ? 'plante' : 'guide'

  // Idempotens: samme svar i samme kontekst = allerede gemt, ingen dublet.
  let dubletQuery = supabase
    .from('gartner_saved')
    .select('id')
    .eq('answer', answer)
  dubletQuery = plantId ? dubletQuery.eq('plant_id', plantId) : dubletQuery.is('plant_id', null)
  dubletQuery = guideId ? dubletQuery.eq('guide_id', guideId) : dubletQuery.is('guide_id', null)
  const { data: eksisterende } = await dubletQuery.limit(1)
  if (eksisterende && eksisterende.length > 0) {
    return { ok: true, sted, planteNavn, allerede: true }
  }

  const { error } = await supabase.from('gartner_saved').insert({
    user_id: userId,
    question,
    answer,
    guide_id: guideId,
    plant_id: plantId,
  })
  if (error) return { error: 'Kunne ikke gemme — prøv igen.' }
  return { ok: true, sted, planteNavn, allerede: false }
}

interface Raekke {
  id: string
  question: string
  answer: string
  guide_id: string | null
  plant_id: string | null
  created_at: string
  plants_v2?: { name: string; variety: string | null } | null
}

function tilGemt(r: Raekke): GartnerGemt {
  return {
    id: r.id,
    question: r.question,
    answer: r.answer,
    guideId: r.guide_id,
    plantId: r.plant_id,
    kontekst: planteLabel(r.plants_v2 ?? null) ?? guideTitel(r.guide_id),
    createdAt: r.created_at,
  }
}

/**
 * Guide-arkivet (/guides/gemt): KUN guide-baserede og kontekstløse svar.
 * Plante-specifikke svar bor på den konkrete plante — aldrig her.
 */
export async function getAlleGemte(): Promise<GartnerGemt[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('gartner_saved')
    .select('id, question, answer, guide_id, plant_id, created_at')
    .is('plant_id', null)
    .order('created_at', { ascending: false })
    .limit(200)
  return ((data ?? []) as Raekke[]).map(tilGemt)
}

/** Brugerens gemte svar for én guide — "Dine gemte noter · N". */
export async function getGemteForGuide(guideId: string): Promise<GartnerGemt[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('gartner_saved')
    .select('id, question, answer, guide_id, plant_id, created_at')
    .eq('guide_id', guideId)
    .is('plant_id', null)
    .order('created_at', { ascending: false })
    .limit(50)
  return ((data ?? []) as Raekke[]).map(tilGemt)
}

/** Brugerens gemte råd for én konkret plante — "Gemte råd · N" på plantesiden. */
export async function getGemteForPlante(plantId: string): Promise<GartnerGemt[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('gartner_saved')
    .select('id, question, answer, guide_id, plant_id, created_at, plants_v2(name, variety)')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false })
    .limit(50)
  return ((data ?? []) as unknown as Raekke[]).map(tilGemt)
}

/** Fjern et gemt svar (RLS sikrer ejerskab). */
export async function deleteGartnerGemt(id: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('gartner_saved').delete().eq('id', id)
  if (error) return { error: 'Kunne ikke fjerne — prøv igen.' }
  return { ok: true }
}
