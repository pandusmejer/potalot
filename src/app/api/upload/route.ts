import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'media'
const MAX_BYTES = 20 * 1024 * 1024
const VALID_FOLDERS = new Set(['froebank', 'planter', 'log', 'profil', 'idetavle'])

/**
 * Upload-endpoint. iPhone HEIC/HEIF konverteres til JPEG via heic-convert
 * (pure JS, virker uden libheif). JPG/PNG/WebP gemmes uændret.
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

  const nameLower = file.name.toLowerCase()
  const isHeic =
    nameLower.endsWith('.heic') ||
    nameLower.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'

  let body: Uint8Array
  let ext = 'jpg'
  let contentType = 'image/jpeg'

  try {
    const arrayBuffer = await file.arrayBuffer()

    if (isHeic) {
      const heicConvert = (await import('heic-convert')).default
      const inputBuffer = Buffer.from(arrayBuffer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jpegBuffer = await (heicConvert as any)({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.88,
      })
      body = new Uint8Array(jpegBuffer)
      ext = 'jpg'
      contentType = 'image/jpeg'
    } else if (nameLower.endsWith('.png') || file.type === 'image/png') {
      body = new Uint8Array(arrayBuffer)
      ext = 'png'
      contentType = 'image/png'
    } else if (nameLower.endsWith('.webp') || file.type === 'image/webp') {
      body = new Uint8Array(arrayBuffer)
      ext = 'webp'
      contentType = 'image/webp'
    } else {
      body = new Uint8Array(arrayBuffer)
      ext = 'jpg'
      contentType = file.type || 'image/jpeg'
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'ukendt fejl'
    return NextResponse.json({ error: `Billedbehandling fejlede: ${msg}` }, { status: 400 })
  }

  const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, {
      contentType,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: `Storage: ${error.message}` }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
