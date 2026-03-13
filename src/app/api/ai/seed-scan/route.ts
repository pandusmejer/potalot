import { getAnthropicClient } from '@/lib/anthropic/client'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Billede og mimeType er påkrævet' },
        { status: 400 }
      )
    }

    const client = getAnthropicClient()

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: image,
              },
            },
            {
              type: 'text',
              text: `Analyser dette billede af en frøpose/frøpakke. Udtræk følgende information og svar KUN med valid JSON:
{
  "name": "plantenavn på dansk (fx Tomat, Agurk, Chili)",
  "variety": "sortsnavn hvis synligt (fx San Marzano, Marketmore) eller null",
  "brand": "producent/mærke hvis synligt (fx Impecta, Nelson Garden) eller null",
  "quantity": "antal frø hvis angivet (tal) eller null",
  "expiry_year": "udløbsår hvis angivet (tal, fx 2027) eller null",
  "notes": "eventuelle ekstra detaljer fra posen (såtidspunkt, spiretid, dybde osv.) eller null"
}

Vigtige regler:
- Svar KUN med valid JSON, ingen anden tekst
- Brug danske plantenavne når muligt
- Hvis du ikke kan læse en værdi, brug null
- Hvis billedet ikke viser en frøpose, svar med: {"error": "Billedet ser ikke ud til at vise en frøpose."}`,
            },
          ],
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Forsøg at parse JSON fra svaret
    // Claude kan wrape i ```json ... ```, så strip det
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
