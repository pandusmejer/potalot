import { NextResponse, type NextRequest } from 'next/server'
import { dataFejlBesked, fangetFejlBesked } from '@/lib/data-fejl'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { billedeForStortBesked, erHeic } from '@/lib/upload-graenser'

export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'media'
// Størrelsesgrænserne bor i src/lib/upload-graenser.ts (10 MB = bucketten,
// 12 MB HEIC = konverterings-hukommelse) og deles med klienten.
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
      { error: fangetFejlBesked(e, 'Billedet kunne ikke uploades. Prøv igen.') },
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
    return NextResponse.json({ error: 'Vi kunne ikke læse det, du sendte. Prøv igen.' }, { status: 400 })
  }

  const file = formData.get('file')
  const folder = formData.get('folder') as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Ingen fil modtaget' }, { status: 400 })
  }
  if (!folder || !VALID_FOLDERS.has(folder)) {
    return NextResponse.json({ error: 'Billedet kan ikke gemmes her.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Filen er tom' }, { status: 400 })
  }

  const nameLower = file.name.toLowerCase()
  const isHeic = erHeic(file)

  const forStor = billedeForStortBesked(file)
  if (forStor) {
    return NextResponse.json({ error: forStor }, { status: 400 })
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
        console.error('[api/upload] HEIC convert failed:', e instanceof Error ? e.message : e, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
        return NextResponse.json(
          { error: 'Billedet kunne ikke konverteres fra HEIC. Vælg billedet i et andet format (Indstillinger → Kamera → Formater → Mest kompatibel), eller tag billedet om.' },
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
    console.error('[api/upload] image processing failed:', e instanceof Error ? e.message : e, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
    return NextResponse.json({ error: fangetFejlBesked(e, 'Billedet kunne ikke behandles. Prøv et andet billede.') }, { status: 400 })
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
    return NextResponse.json({ error: dataFejlBesked(error, 'Billedet kunne ikke gemmes. Prøv igen.') }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
