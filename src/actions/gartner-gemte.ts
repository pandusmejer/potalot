'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { GUIDE_FACTS } from '@/data/guide-facts-index.generated'

/**
 * "Gem fra Gartneren" (Annas design 10/8, spec: Docs/product/
 * gem-fra-gartneren.md): brugerens personlige videnslag oven på det
 * redaktionelle bibliotek. Der gemmes ALTID spørgsmål + svar + kontekst
 * sammen — aldrig kun svaret. guide_id valideres mod GUIDE_FACTS før
 * insert (AI-kontekst må aldrig kunne plante et guidenavn, der ikke
 * findes). HÅRD regel: gemte svar er personlige noter — de blandes
 * ALDRIG ind i guidens redaktionelle indhold.
 */

export interface GartnerGemt {
  id: string
  question: string
  answer: string
  guideId: string | null
  /** Guide-titel resolvet fra GUIDE_FACTS ("Tomat 'Green Zebra'") — null
   * hvis gemt uden guide-kontekst. */
  guideTitel: string | null
  createdAt: string
}

const MAX_QUESTION = 1000
const MAX_ANSWER = 10_000

function guideTitel(guideId: string | null): string | null {
  if (!guideId) return null
  const g = GUIDE_FACTS.find(x => x.id === guideId)
  if (!g) return null
  return g.variety ? `${g.plantName ?? ''} '${g.variety}'`.trim() : (g.plantName ?? guideId)
}

export async function saveGartnerSvar(input: {
  question: string
  answer: string
  guideId?: string | null
  plantId?: string | null
}): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const question = input.question.trim().slice(0, MAX_QUESTION)
  const answer = input.answer.trim().slice(0, MAX_ANSWER)
  if (!question || !answer) return { error: 'Der mangler et spørgsmål eller et svar at gemme.' }

  // Kun guide-id'er der faktisk findes i biblioteket bindes — ellers null.
  const guideId =
    input.guideId && GUIDE_FACTS.some(g => g.id === input.guideId)
      ? input.guideId
      : null

  const supabase = await createClient()
  const { error } = await supabase.from('gartner_saved').insert({
    user_id: userId,
    question,
    answer,
    guide_id: guideId,
    plant_id: input.plantId ?? null,
  })
  if (error) return { error: 'Kunne ikke gemme — prøv igen.' }
  return { ok: true }
}

interface Raekke {
  id: string
  question: string
  answer: string
  guide_id: string | null
  created_at: string
}

function tilGemt(r: Raekke): GartnerGemt {
  return {
    id: r.id,
    question: r.question,
    answer: r.answer,
    guideId: r.guide_id,
    guideTitel: guideTitel(r.guide_id),
    createdAt: r.created_at,
  }
}

/** Alle brugerens gemte svar, nyeste først — "Gemt fra Gartneren"-listen. */
export async function getAlleGemte(): Promise<GartnerGemt[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('gartner_saved')
    .select('id, question, answer, guide_id, created_at')
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
    .select('id, question, answer, guide_id, created_at')
    .eq('guide_id', guideId)
    .order('created_at', { ascending: false })
    .limit(50)
  return ((data ?? []) as Raekke[]).map(tilGemt)
}

/** Fjern et gemt svar (RLS sikrer ejerskab). */
export async function deleteGartnerGemt(id: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('gartner_saved').delete().eq('id', id)
  if (error) return { error: 'Kunne ikke fjerne — prøv igen.' }
  return { ok: true }
}
