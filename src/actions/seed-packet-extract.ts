'use server'

import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { PrimaryCategoryId } from '@/lib/types'

export interface ExtractedSeedFields {
  name?: string
  latinName?: string
  variety?: string
  supplier?: string
  seedCount?: number
  sowingMonths?: number[]
  plantingOutMonths?: number[]
  harvestMonths?: number[]
  sowingDepthMm?: number
  preCultivation?: boolean
  germinationDays?: string
  germinationTemperature?: string
  plantSpacing?: string
  rowSpacing?: string
  light?: 'full_sun' | 'partial_shade' | 'shade'
  water?: 'low' | 'regular' | 'high'
  primaryCategoryId?: PrimaryCategoryId
  notes?: string
}

const SYSTEM_PROMPT = `Du er en assistent der læser danske og europæiske frøposer.
Få information ud af billedet og returnér JSON med felter du er sikker på.
Lad felter du er i tvivl om være null.

Felter at udtrække:
- name: dansk navn (fx "Tomat", "Basilikum")
- latinName: latinsk/botanisk navn (fx "Solanum lycopersicum")
- variety: sort (fx "San Marzano", "Black Cherry")
- supplier: leverandør/mærke (fx "Nelson Garden", "Impecta")
- seedCount: antal frø i posen (kun hvis tydeligt angivet, som tal)
- sowingMonths: array af måned-numre (1-12) hvor frøet sås
- plantingOutMonths: array af måned-numre (1-12) hvor det udplantes
- harvestMonths: array af måned-numre (1-12) hvor det høstes
- sowingDepthMm: sådybde i mm. **VIGTIGT: 0 mm er en gyldig værdi (overflade-såning, fx for basilikum og salat). Brug 0, ikke null, hvis frøet skal lægges på overfladen.**
- preCultivation: true hvis posen anbefaler forspiring/indendørs forspiring/forkultivering, false hvis direkte såning anbefales, null hvis ikke nævnt
- germinationDays: spiretid som tekst (fx "7-14 dage")
- germinationTemperature: spiretemperatur som tekst (fx "18-22°C")
- plantSpacing: planteafstand (fx "40-60 cm")
- rowSpacing: rækkeafstand (fx "60-80 cm")
- light: "full_sun" | "partial_shade" | "shade"
- water: "low" | "regular" | "high"
- primaryCategoryId: "fro" (frø) | "loeg" (løg) | "knolde" | "buske" | "traeer" | "stauder"
- notes: en kort dansk note med ekstra info (fx "Kuldetolerant, gode i drivhus")

Returnér KUN gyldig JSON, ingen markdown, ingen forklaringer.`

export async function extractSeedPacketFields(imageUrls: string[]): Promise<
  | { fields: ExtractedSeedFields }
  | { error: string }
> {
  await requireUser()

  if (imageUrls.length === 0) return { error: 'Ingen billeder' }

  const anthropic = getAnthropicClient()

  // Brug max 4 billeder (forside, bagside, evt. ekstra info)
  const images = imageUrls.slice(0, 4).map(url => ({
    type: 'image' as const,
    source: {
      type: 'url' as const,
      url,
    },
  }))

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...images,
            {
              type: 'text',
              text: 'Læs denne frøpose og returnér JSON med felter du kan udtrække. Brug null for felter du er i tvivl om.',
            },
          ],
        },
      ],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { error: 'Intet tekst-svar fra AI' }
    }

    // Strip evt. markdown code fence
    let raw = textBlock.text.trim()
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (fenceMatch) raw = fenceMatch[1].trim()

    const parsed = parseJsonOrNull(raw)
    if (!parsed) return { error: 'AI returnerede ugyldig JSON' }
    return { fields: parseFieldsFromJson(parsed) }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ukendt fejl'
    return { error: `AI-fejl: ${msg}` }
  }
}

function parseJsonOrNull(raw: string): Record<string, unknown> | null {
  let cleaned = raw.trim()
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) cleaned = fenceMatch[1].trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

function parseFieldsFromJson(parsed: Record<string, unknown>): ExtractedSeedFields {
  const fields: ExtractedSeedFields = {}
  if (typeof parsed.name === 'string')           fields.name = parsed.name
  if (typeof parsed.latinName === 'string')      fields.latinName = parsed.latinName
  if (typeof parsed.variety === 'string')        fields.variety = parsed.variety
  if (typeof parsed.supplier === 'string')       fields.supplier = parsed.supplier
  if (typeof parsed.seedCount === 'number')      fields.seedCount = parsed.seedCount
  if (Array.isArray(parsed.sowingMonths))        fields.sowingMonths = parsed.sowingMonths.filter((m): m is number => typeof m === 'number')
  if (Array.isArray(parsed.plantingOutMonths))   fields.plantingOutMonths = parsed.plantingOutMonths.filter((m): m is number => typeof m === 'number')
  if (Array.isArray(parsed.harvestMonths))       fields.harvestMonths = parsed.harvestMonths.filter((m): m is number => typeof m === 'number')
  if (typeof parsed.sowingDepthMm === 'number')  fields.sowingDepthMm = parsed.sowingDepthMm
  if (typeof parsed.preCultivation === 'boolean') fields.preCultivation = parsed.preCultivation
  if (typeof parsed.germinationDays === 'string')        fields.germinationDays = parsed.germinationDays
  if (typeof parsed.germinationTemperature === 'string') fields.germinationTemperature = parsed.germinationTemperature
  if (typeof parsed.plantSpacing === 'string')   fields.plantSpacing = parsed.plantSpacing
  if (typeof parsed.rowSpacing === 'string')     fields.rowSpacing = parsed.rowSpacing
  if (parsed.light === 'full_sun' || parsed.light === 'partial_shade' || parsed.light === 'shade') {
    fields.light = parsed.light
  }
  if (parsed.water === 'low' || parsed.water === 'regular' || parsed.water === 'high') {
    fields.water = parsed.water
  }
  if (typeof parsed.primaryCategoryId === 'string') {
    fields.primaryCategoryId = parsed.primaryCategoryId as PrimaryCategoryId
  }
  if (typeof parsed.notes === 'string') fields.notes = parsed.notes
  return fields
}

/**
 * Hent en URL → udtræk produktbillede + tekst → kør AI for at få frøinfo.
 * Downloader og:image til Supabase Storage så billedet er persistent.
 */
export async function extractSeedFromUrl(url: string): Promise<
  | { fields: ExtractedSeedFields; primaryImageUrl: string | null; sourceUrl: string }
  | { error: string }
> {
  const user = await requireUser()

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url.trim())
  } catch {
    return { error: 'Ugyldig URL' }
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return { error: 'Kun http/https-URLs er understøttet' }
  }

  let html: string
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'PotAlot/1.0 (+https://potalot.app)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { error: `Kunne ikke hente side (HTTP ${res.status})` }
    html = await res.text()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ukendt fejl'
    return { error: `Fetch fejlede: ${msg}` }
  }

  const ogImageRaw =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? ''
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? ''
  const docTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? ''

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)

  let absoluteImageUrl: string | undefined
  if (ogImageRaw) {
    try { absoluteImageUrl = new URL(ogImageRaw, parsedUrl).toString() } catch {}
  }

  const anthropic = getAnthropicClient()
  const userBlocks: Array<
    | { type: 'image'; source: { type: 'url'; url: string } }
    | { type: 'text'; text: string }
  > = []

  if (absoluteImageUrl) {
    userBlocks.push({ type: 'image', source: { type: 'url', url: absoluteImageUrl } })
  }
  userBlocks.push({
    type: 'text',
    text:
      `Læs frøinformation fra denne webside og returnér JSON.\n\n` +
      `URL: ${parsedUrl.toString()}\n` +
      `Side-titel: ${docTitle}\n` +
      `OG-titel: ${ogTitle}\n` +
      `OG-beskrivelse: ${ogDesc}\n\n` +
      `Tekstindhold:\n${text}`,
  })

  let fields: ExtractedSeedFields
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userBlocks }],
    })
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return { error: 'Intet tekst-svar fra AI' }
    const parsed = parseJsonOrNull(textBlock.text)
    if (!parsed) return { error: 'AI returnerede ugyldig JSON' }
    fields = parseFieldsFromJson(parsed)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ukendt fejl'
    return { error: `AI-fejl: ${msg}` }
  }

  let primaryImageUrl: string | null = null
  if (absoluteImageUrl) {
    try {
      const imgRes = await fetch(absoluteImageUrl, { signal: AbortSignal.timeout(10000) })
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer()
        const ct = imgRes.headers.get('content-type') ?? 'image/jpeg'
        const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg'
        const path = `${user.id}/froebank/${crypto.randomUUID()}.${ext}`
        const supabase = await createClient()
        const { error } = await supabase.storage
          .from('media')
          .upload(path, new Uint8Array(arrayBuffer), { contentType: ct, upsert: false })
        if (!error) {
          primaryImageUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl
        }
      }
    } catch {
      // ignorér billedfejl — entry oprettes alligevel uden billede
    }
  }

  return { fields, primaryImageUrl, sourceUrl: parsedUrl.toString() }
}
