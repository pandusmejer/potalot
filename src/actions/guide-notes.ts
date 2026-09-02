'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Hent den nuværende brugers private note for en guide. Returnerer tom
 * string hvis der ikke er en. Returnerer null hvis ikke logged in.
 */
export async function getMyGuideNote(guideId: string): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_guide_notes')
    .select('note')
    .eq('user_id', user.id)
    .eq('guide_id', guideId)
    .maybeSingle()
  return (data?.note as string | undefined) ?? ''
}

/**
 * Gem brugerens private note. Tom note sletter rækken.
 */
export async function saveMyGuideNote(
  guideId: string,
  note: string
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const trimmed = note.trim()

  if (trimmed.length === 0) {
    const { error } = await supabase
      .from('user_guide_notes')
      .delete()
      .eq('user_id', userId)
      .eq('guide_id', guideId)
    if (error) return { error: dataFejlBesked(error, 'Kunne ikke slette din note. Prøv igen.') }
  } else {
    const { error } = await supabase
      .from('user_guide_notes')
      .upsert({
        user_id: userId,
        guide_id: guideId,
        note: trimmed,
        updated_at: new Date().toISOString(),
      })
    if (error) return { error: dataFejlBesked(error, 'Kunne ikke gemme din note. Prøv igen.') }
  }

  revalidatePath(`/guides/${guideId}`)
  return { ok: true }
}
