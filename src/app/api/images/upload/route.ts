import { NextResponse, type NextRequest } from 'next/server'
import { dataFejlBesked, fangetFejlBesked } from '@/lib/data-fejl'
import sharp from 'sharp'
import heicConvert from 'heic-convert'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'media'
const MAX_BYTES = 20 * 1024 * 1024
const VALID_FOLDERS = new Set(['froebank', 'planter', 'log', 'profil', 'idetavle'])

/**
 * Detect HEIC/HEIF ud fra fil-signatur (magic bytes), ikke kun MIME-type.
 * iPhone sender ofte filer med MIME 'application/octet-stream' eller tom MIME,
 * så vi kan ikke stole på file.type alene.
 *
 * HEIC/HEIF struktur: [4 bytes box-størrelse][4 bytes 'ftyp'][4 bytes brand][...]
 * Brands der indikerer HEIC/HEIF: heic, heix, hevc, mif1, msf1, heif.
 */
function isHeicBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false
  if (buf.toString('ascii', 4, 8) !== 'ftyp') return false
  const brand = buf.toString('ascii', 8, 12).toLowerCase()
  return ['heic', 'heix', 'hevc', 'mif1', 'msf1', 'heif'].includes(brand)
}

export async function POST(request: NextRequest) {
  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (e) {
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
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Billede for stort (max ${MAX_BYTES / 1024 / 1024}MB)` }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Filen er tom' }, { status: 400 })
  }

  let buffer = Buffer.from(await file.arrayBuffer())

  // 1. Konvertér HEIC → JPEG hvis nødvendigt (signature-baseret detection)
  if (isHeicBuffer(buffer)) {
    try {
      const converted = await heicConvert({
        buffer: new Uint8Array(buffer),
        format: 'JPEG',
        quality: 0.85,
      })
      buffer = Buffer.from(converted)
    } catch (e) {
      return NextResponse.json({ error: fangetFejlBesked(e, 'Billedet kunne ikke konverteres fra HEIC. Prøv et andet format.') }, { status: 500 })
    }
  }

  // 2. Sharp pipeline: rotate (EXIF auto-orient) → resize → JPEG
  let mainBuffer: Buffer
  let thumbBuffer: Buffer
  try {
    const base = sharp(buffer).rotate()
    mainBuffer = await base
      .clone()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()
    thumbBuffer = await base
      .clone()
      .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer()
  } catch (e) {
    return NextResponse.json({ error: fangetFejlBesked(e, 'Billedet kunne ikke behandles. Prøv et andet billede.') }, { status: 500 })
  }

  // 3. Upload begge til Supabase Storage
  const supabase = await createClient()
  const id = crypto.randomUUID()
  const mainPath = `${userId}/${folder}/${id}.jpg`
  const thumbPath = `${userId}/${folder}/${id}_thumb.jpg`

  const [mainUp, thumbUp] = await Promise.all([
    supabase.storage.from(BUCKET).upload(mainPath, mainBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    }),
    supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    }),
  ])

  if (mainUp.error) {
    return NextResponse.json({ error: dataFejlBesked(mainUp.error, 'Billedet kunne ikke gemmes. Prøv igen.') }, { status: 500 })
  }
  if (thumbUp.error) {
    // Main lykkedes, thumb fejlede — accepter alligevel
    console.error('thumb upload failed:', thumbUp.error)
  }

  const { data: mainPublic } = supabase.storage.from(BUCKET).getPublicUrl(mainPath)
  const { data: thumbPublic } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath)

  return NextResponse.json({
    id,
    url: mainPublic.publicUrl,
    thumbnailUrl: thumbUp.error ? mainPublic.publicUrl : thumbPublic.publicUrl,
  })
}
