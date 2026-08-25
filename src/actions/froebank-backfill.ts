'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getAllInventoryItems } from '@/actions/froebank'
import {
  foreslaaBackfill,
  backfillOpdatering,
  type BackfillForslag,
} from '@/lib/froebank-backfill'

/**
 * Hvad kan Potalot fylde ud på brugerens eksisterende frøposter?
 *
 * Rent opslag — der skrives intet. Bruges til forhåndsvisningen, så
 * brugeren ser hvor mange poser og felter det handler om, FØR noget sker.
 */
export async function hentBackfillForslag(): Promise<BackfillForslag[]> {
  const user = await getCurrentUser()
  if (!user) return []
  return foreslaaBackfill(await getAllInventoryItems())
}

/**
 * Udfyld de tomme dyrkningsfelter fra Potalots eget bibliotek.
 *
 * To ting gør skrivningen sikker:
 *
 *  1. Forslagene GENBEREGNES her på serveren ud fra friske rækker. Klienten
 *     sender kun et valg af id'er — aldrig værdier. Har brugeren nået at
 *     udfylde et felt i mellemtiden (eller i et andet faneblad), er feltet
 *     ikke længere tomt, og så røres det ikke.
 *  2. Hver opdatering indeholder KUN de felter der faktisk var tomme. Alt
 *     andet på rækken — leverandør, årgang, antal, bedst før, noter, foto —
 *     står uændret.
 *
 * Første version bruger udelukkende Potalots kontrollerede bibliotek.
 * Gamle webshoplinks hentes bevidst ikke.
 */
export async function udfoerBackfill(
  ids?: string[],
): Promise<{ poser: number; felter: number } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const alle = foreslaaBackfill(await getAllInventoryItems())
  const valgte = ids?.length ? alle.filter(f => ids.includes(f.id)) : alle
  if (valgte.length === 0) return { poser: 0, felter: 0 }

  let poser = 0
  let felter = 0
  for (const forslag of valgte) {
    const { error } = await supabase
      .from('inventory_items')
      .update(backfillOpdatering(forslag))
      .eq('id', forslag.id)
      .eq('user_id', userId)
    if (error) {
      // Én pose der fejler må ikke tage resten med sig — brugeren kan
      // køre igen, og allerede udfyldte felter foreslås ikke på ny.
      console.error(`backfill fejlede for ${forslag.id}:`, error)
      continue
    }
    poser++
    felter += forslag.antalFelter
  }

  if (poser === 0) return { error: 'Kunne ikke udfylde felterne. Prøv igen.' }

  revalidatePath('/froebank')
  return { poser, felter }
}
