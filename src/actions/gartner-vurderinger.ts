'use server'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Gemte Gartner-vurderinger pr. logpost for én plante (Annas model 8/8:
 * vurderingen er TILKNYTTET INDHOLD til den log der udløste den).
 * Returnerer logId → vurderingstekst; tidslinjen bruger den til at vise
 * vurderingen inde i logposten og skjule CTA'en permanent.
 */
export async function getGartnerVurderinger(
  plantId: string,
): Promise<Record<string, string>> {
  const user = await getCurrentUser()
  if (!user) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_conversations')
    .select('log_id, messages')
    .contains('context_plant_ids', [plantId])
    .not('log_id', 'is', null)

  const ud: Record<string, string> = {}
  for (const row of (data ?? []) as { log_id: string; messages: { role: string; content: string }[] }[]) {
    const svar = row.messages.find(m => m.role === 'assistant')?.content
    if (svar) ud[row.log_id] = svar
  }
  return ud
}
