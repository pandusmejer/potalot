import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'media'
const MAX_BYTES = 20 * 1024 * 1024
const VALID_FOLDERS = new Set(['froebank', 'planter', 'log', 'profil', 'idetavle'])

/**
 * Simpel upload-endpoint. Tager rå fil → Supabase Storage → returnerer URL.
 * Ingen server-side billedprocessering (HEIC accepteres som-er nu hvor
 * bucket har allowed_mime_types = NULL).
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ugyldig request body' }, { status: 400 })
  }

  const file = formData.get('file')
  const folder = formData.get('folder') as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Ingen fil modtaget' }, { status: 400 })
  }
  if (!folder || !VALID_FOLDERS.has(folder)) {
    return NextResponse.json({ error: 'Ugyldig folder' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Filen er tom' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Billede for stort (max ${MAX_BYTES / 1024 / 1024}MB)` }, { status: 400 })
  }

  // Bestem extension fra filnavn først, så MIME — iPhone HEIC kan have tom MIME.
  const nameLower = file.name.toLowerCase()
  let ext = 'jpg'
  if (nameLower.endsWith('.png')) ext = 'png'
  else if (nameLower.endsWith('.webp')) ext = 'webp'
  else if (nameLower.endsWith('.heic')) ext = 'heic'
  else if (nameLower.endsWith('.heif')) ext = 'heif'
  else if (file.type === 'image/png') ext = 'png'
  else if (file.type === 'image/webp') ext = 'webp'
  else if (file.type === 'image/heic') ext = 'heic'
  else if (file.type === 'image/heif') ext = 'heif'

  const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || `image/${ext}`,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: `Storage: ${error.message}` }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
