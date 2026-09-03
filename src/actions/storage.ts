'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser } from '@/lib/auth'

const BUCKET = 'media'

/**
 * Mapperne i bucketten. Selve uploaden sker i /api/upload (Route Handler,
 * fordi HEIC-konvertering og filstørrelse ikke passer i en Server Action);
 * her bor kun sletning. Den gamle uploadImage-action havde nul kaldere og
 * blev fjernet i Batch 3 (D4).
 */
export type UploadFolder = 'froebank' | 'planter' | 'log' | 'profil' | 'idetavle' | 'chat' | 'guides'

export async function deleteImage(url: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return { error: 'Ugyldig URL' }
  const path = url.slice(idx + marker.length)

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke slette billedet. Prøv igen.') }
  return { ok: true }
}
