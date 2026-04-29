'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

const BUCKET = 'media'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export type UploadFolder = 'froebank' | 'planter' | 'log' | 'profil' | 'idetavle'

export async function uploadImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const { id: userId } = await requireUser()

  const file = formData.get('file')
  const folder = formData.get('folder') as UploadFolder | null

  if (!(file instanceof File)) return { error: 'Ingen fil' }
  if (!folder) return { error: 'Mangler folder' }
  if (file.size > MAX_BYTES) return { error: 'Billede for stort (max 5MB)' }
  if (!ALLOWED.includes(file.type)) return { error: 'Ugyldig filtype' }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

export async function deleteImage(url: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return { error: 'Ugyldig URL' }
  const path = url.slice(idx + marker.length)

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return { error: error.message }
  return { ok: true }
}
