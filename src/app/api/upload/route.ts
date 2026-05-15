import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'media'
const MAX_BYTES = 20 * 1024 * 1024
// HEIC-konvertering er CPU-tung. Sæt en lavere grænse for HEIC så vi
// ikke OOM'er Netlify Functions (1024 MB heap).
const MAX_BYTES_HEIC = 12 * 1024 * 1024
const VALID_FOLDERS = new Set(['froebank', 'planter', 'log', 'profil', 'idetavle', 'chat', 'guides'])

/**
 * Upload-endpoint. iPhone HEIC/HEIF konverteres til JPEG via heic-convert
 * (pure JS, virker uden libheif). JPG/PNG/WebP gemmes uændret.
 *
 * Wrapper hele logikken i try/catch så uventede fejl returnerer JSON med
 * besked frem for en bar HTTP 500 fra platformen.
 */
export async function POST(request: NextRequest) {
  try {
    return await handleUpload(request)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const stack = e instanceof Error ? e.stack : undefined
    console.error('[api/upload] uncaught error:', msg, stack)
    return NextResponse.json(
      { error: `Server-fejl ved upload: ${msg}` },
      { status: 500 }
    )
  }
}

async function handleUpload(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (e) {
    console.error('[api/upload] formData parse error:', e)
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

  const nameLower = file.name.toLowerCase()
  const isHeic =
    nameLower.endsWith('.heic') ||
    nameLower.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'

  // Strammere grænse for HEIC pga. memory ved konvertering
  const maxBytes = isHeic ? MAX_BYTES_HEIC : MAX_BYTES
  if (file.size > maxBytes) {
    const limitMB = Math.floor(maxBytes / 1024 / 1024)
    return NextResponse.json(
      {
        error: isHeic
          ? `iPhone-billede for stort (${(file.size / 1024 / 1024).toFixed(1)} MB). Maks ${limitMB} MB for HEIC — prøv at vælge en mindre størrelse i iPhone Kamera-indstillinger eller tag billedet om.`
          : `Billede for stort (${(file.size / 1024 / 1024).toFixed(1)} MB). Maks ${limitMB} MB.`,
      },
      { status: 400 }
    )
  }

  let body: Uint8Array
  let ext = 'jpg'
  let contentType = 'image/jpeg'

  try {
    const arrayBuffer = await file.arrayBuffer()

    if (isHeic) {
      try {
        const heicConvert = (await import('heic-convert')).default
        const inputBuffer = Buffer.from(arrayBuffer)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jpegBuffer = await (heicConvert as any)({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.85,
        })
        body = new Uint8Array(jpegBuffer)
        ext = 'jpg'
        contentType = 'image/jpeg'
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'ukendt'
        console.error('[api/upload] HEIC convert failed:', msg, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
        return NextResponse.json(
          { error: `HEIC-konvertering fejlede: ${msg}. Prøv at vælge billedet i et andet format (Indstillinger → Kamera → Formater → Mest kompatibel) eller tag billedet om.` },
          { status: 400 }
        )
      }
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
    console.error('[api/upload] image processing failed:', msg, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
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
    console.error('[api/upload] storage upload failed:', error)
    return NextResponse.json({ error: `Storage: ${error.message}` }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
