'use server'

import { getCurrentUser, requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { harSamtykke } from '@/lib/gartner-kontekst'

/**
 * Gartnerens samtykke til personlig kontekst (MVP 1.0, fase 4).
 *
 * Valget ligger på brugerens egen profilrække (`profiles.ai_personlig_kontekst`,
 * standard FRA — migration B, se Docs/product/fase4-migrationer/B-ai-samtykke.md).
 * Handlingen skriver KUN den ene kolonne på den indloggede brugers egen række;
 * tidsstemplet sættes af databasen (trigger), aldrig herfra.
 *
 * Kører koden, før migrationen er kørt, er funktionen skjult for brugeren
 * ('utilgaengelig') og samtykke er fra: Gartneren sender intet personligt.
 */

export type AiSamtykkeStatus = 'ja' | 'nej' | 'utilgaengelig' | 'ikke_logget_ind'

export async function getAiSamtykke(): Promise<AiSamtykkeStatus> {
  const user = await getCurrentUser()
  if (!user) return 'ikke_logget_ind'
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('ai_personlig_kontekst')
      .eq('id', user.id)
      .maybeSingle()
    // Kolonnen findes ikke (migration ikke kørt), eller rækken kan ikke læses.
    if (error || !data) return 'utilgaengelig'
    return harSamtykke(data) ? 'ja' : 'nej'
  } catch {
    return 'utilgaengelig'
  }
}

export async function setAiSamtykke(til: boolean): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  try {
    // .select() så en række, der ikke blev ændret (RLS/ingen række), opdages.
    const { data, error } = await supabase
      .from('profiles')
      .update({ ai_personlig_kontekst: til === true })
      .eq('id', userId)
      .select('ai_personlig_kontekst')
    if (error) {
      console.error('setAiSamtykke fejlede:', error)
      return { error: 'Kunne ikke gemme dit valg lige nu. Prøv igen om lidt.' }
    }
    if (!data || data.length !== 1) {
      return { error: 'Kunne ikke gemme dit valg lige nu. Prøv igen om lidt.' }
    }
    return { ok: true }
  } catch (err) {
    console.error('setAiSamtykke fejlede:', err)
    return { error: 'Kunne ikke gemme dit valg lige nu. Prøv igen om lidt.' }
  }
}
