import { getAnthropicClient } from '@/lib/anthropic/client'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Support both single image and multiple images
    const images: { image: string; mimeType: string }[] = []

    if (body.images && Array.isArray(body.images)) {
      // Multi-image: [{ image, mimeType }, ...]
      for (const img of body.images) {
        if (img.image && img.mimeType) {
          images.push(img)
        }
      }
    } else if (body.image && body.mimeType) {
      // Legacy single-image
      images.push({ image: body.image, mimeType: body.mimeType })
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Mindst ét billede er påkrævet' },
        { status: 400 }
      )
    }

    const client = getAnthropicClient()

    type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    // Build content blocks: all images first, then the text prompt
    const content: Array<
      | { type: 'image'; source: { type: 'base64'; media_type: ImageMediaType; data: string } }
      | { type: 'text'; text: string }
    > = []

    for (const img of images) {
      content.push({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.mimeType as ImageMediaType,
          data: img.image,
        },
      })
    }

    content.push({
      type: 'text',
      text: `Analyser ${images.length > 1 ? 'disse billeder' : 'dette billede'} af en frøpose/frøpakke. ${images.length > 1 ? 'Kombinér information fra ALLE billeder (forside + bagside osv.).' : ''}

Udtræk følgende information og svar KUN med valid JSON:
{
  "kategori": "Frø (eller Løg, Knolde, Buske, Træer, Stauder)",
  "dansk_navn": "plantenavn på dansk (fx Tomat, Agurk, Chili)",
  "sort": "sortsnavn hvis synligt (fx San Marzano) eller null",
  "botanisk_navn": "latin navn fra posen eller null",
  "underkategori": "fx Grøntsager, Blomster, Krydderurter, Græsser eller null",
  "status": "På lager",
  "antal_total": "antal frø hvis angivet (tal) eller null",
  "antal_sået": 0,
  "mærke_eller_leverandør": "brand/producent (fx Impecta, Nelson Garden) eller null",
  "købt_her_url": "kun hvis synligt på posen eller null",
  "købsår": "kun hvis sikkert eller null",
  "udløbsdato": "format DD.MM.ÅÅÅÅ hvis angivet eller null",
  "spireprocent": "kun hvis angivet (tal) eller null",
  "type": "fx F1, økologisk, heirloom, etårig, flerårig eller null",
  "noter": "korte praktiske info fra posen (såtid, højde, blomstring, lys, afstand osv.) eller null"
}

Vigtige regler:
- Svar KUN med valid JSON, ingen anden tekst
- Brug danske plantenavne når muligt
- Kombinér information fra alle billeder — rækkefølgen er ligegyldig
- Hvis du ikke kan læse en værdi, brug null
- Opfind aldrig data — kun det der tydeligt fremgår
- Hvis billedet ikke viser en frøpose, svar med: {"error": "Billedet ser ikke ud til at vise en frøpose."}`,
    })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()

    try {
      const parsed = JSON.parse(cleaned)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json(
        { error: 'Kunne ikke analysere billedet. Prøv med et tydeligere billede.' },
        { status: 422 }
      )
    }
  } catch (error) {
    console.error('Seed scan error:', error)
    return NextResponse.json(
      { error: 'Der opstod en fejl. Prøv igen.' },
      { status: 500 }
    )
  }
}
