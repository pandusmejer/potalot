'use server'

import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { harKurateretFroekort } from '@/lib/images/resolve-potalot-image'
import {
  parseJsonOrNull,
  parseFieldsFromJson,
  type ExtractedSeedFields,
} from '@/lib/seed-packet-fields'

export type { ExtractedSeedFields }

const SYSTEM_PROMPT = `Du er en assistent der læser danske og europæiske frøposer.
Få information ud af billedet og returnér JSON med felter du er sikker på.
Lad felter du er i tvivl om være null.

Felter at udtrække:
- name: det ALMINDELIGE DANSKE NAVN PÅ DEN BOTANISKE ART (fx "Agurk", "Tomat", "Basilikum"). Produktets typebetegnelse, anvendelse eller markedsføringsnavn må ALDRIG bruges som art: "Skoleagurk Snack F1" er arten **Agurk** (sorten er Snack F1), ikke "Skoleagurk"; "Cherrytomat Sungold" er arten **Tomat**. Kan arten ikke identificeres sikkert, skal feltet være null — kopiér ALDRIG produkttitlen ind som artsnavn.
- latinName: latinsk/botanisk navn (fx "Solanum lycopersicum")
- variety: sort (fx "San Marzano", "Black Cherry")
- supplier: leverandør/mærke (fx "Nelson Garden", "Impecta")
- seedCount: antal frø i posen som heltal (kun hvis tydeligt angivet)
- purchaseYear: det årstal posen er pakket til / sæsonmærket med som heltal — KUN hvis det står tydeligt på posen eller siden. Gæt ALDRIG på indeværende år.
- sowingMonths: array af måned-numre (1-12) hvor frøet sås
- plantingOutMonths: array af måned-numre (1-12) hvor det udplantes
- harvestMonths: array af måned-numre (1-12) hvor det høstes
- sowingDepthMm: sådybde i mm som **heltal** — KUN hvis posen angiver ÉN entydig værdi (fx "5 mm" → 5). Angiver posen et INTERVAL (fx "2-5 mm"), skal feltet være null: konvertér ALDRIG et interval til ét tal — intet gennemsnit, minimum, maksimum eller afrunding. Posen ved "2-5 mm"; den ved ikke "3 mm". **VIGTIGT: 0 mm er en gyldig værdi (overflade-såning, fx for basilikum og salat). Brug 0, ikke null, hvis frøet skal lægges på overfladen.**
- preCultivation: true hvis posen anbefaler forspiring/indendørs forspiring/forkultivering, false hvis direkte såning anbefales, null hvis ikke nævnt
- germinationDays: spiretid som tekst (fx "7-14 dage")
- germinationTemperature: spiretemperatur som tekst (fx "18-22°C")
- plantSpacing: planteafstand (fx "40-60 cm")
- rowSpacing: rækkeafstand (fx "60-80 cm")
- light: "full_sun" | "partial_shade" | "shade"
- water: "low" | "regular" | "high"
- soil: jordtype/jordkrav som kort dansk tekst, ORDRET som posen eller siden beskriver det (fx "Næringsrig, veldrænet jord") — KUN hvis der faktisk står noget om jorden. Opfind ALDRIG en jordbeskrivelse ud fra hvad planten plejer at ville have; står der intet, skal feltet være null.
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
      return { error: 'Kunne ikke læse frøposen. Prøv igen.' }
    }

    // Strip evt. markdown code fence
    let raw = textBlock.text.trim()
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (fenceMatch) raw = fenceMatch[1].trim()

    const parsed = parseJsonOrNull(raw)
    if (!parsed) return { error: 'Kunne ikke tyde frøposen. Prøv igen, eller udfyld oplysningerne selv.' }
    return { fields: parseFieldsFromJson(parsed) }
  } catch (e: unknown) {
    // Rå fejltekst (ofte engelsk API-tekst) må aldrig nå brugeren — log den.
    console.error('seed-packet-extract (foto) fejlede:', e)
    return { error: 'Noget gik galt under læsningen. Prøv igen om lidt.' }
  }
}


/**
 * Hent en URL → udtræk produktbillede + tekst → kør AI for at få frøinfo.
 * Downloader og:image til Supabase Storage så billedet er persistent.
 */
export async function extractSeedFromUrl(
  url: string,
  options?: { skipImageDownload?: boolean }
): Promise<
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
    return { error: 'Kun http- og https-adresser understøttes.' }
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
    // Rå fejltekst (ofte engelsk netværkstekst) må aldrig nå brugeren — log den.
    console.error('seed-packet-extract (hent side) fejlede:', e)
    return { error: 'Kunne ikke hente siden. Tjek adressen, og prøv igen.' }
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

  // Anthropic-API tager kun https URLs for image-blocks. Hvis siden's
  // og:image er http (eller protokol-relativ der opløser til http),
  // skipper vi billedet — tekstindholdet alene giver typisk nok info.
  if (absoluteImageUrl && absoluteImageUrl.startsWith('https://')) {
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
    if (!textBlock || textBlock.type !== 'text') return { error: 'Kunne ikke læse siden. Prøv igen.' }
    const parsed = parseJsonOrNull(textBlock.text)
    if (!parsed) return { error: 'Kunne ikke tyde oplysningerne på siden. Prøv igen.' }
    fields = parseFieldsFromJson(parsed)
  } catch (e: unknown) {
    // Rå fejltekst (ofte engelsk API-tekst) må aldrig nå brugeren — log den.
    console.error('seed-packet-extract (url) fejlede:', e)
    return { error: 'Noget gik galt under læsningen. Prøv igen om lidt.' }
  }

  // Hvis der allerede findes et kurateret frøkort for sorten, skal DET
  // være standard-fotoet — så vi gemmer IKKE shoppens og:image (det
  // ville ellers blive primært og overskygge frøkortet). Billedet er
  // stadig brugt til AI-udtrækket ovenfor; vi springer kun lagringen
  // over. Brugeren kan altid uploade egne fotos og gøre dem til primære.
  const harFroekort = harKurateretFroekort({
    name: fields.name ?? '',
    variety: fields.variety,
  })

  let primaryImageUrl: string | null = null
  if (absoluteImageUrl && !options?.skipImageDownload && !harFroekort) {
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
