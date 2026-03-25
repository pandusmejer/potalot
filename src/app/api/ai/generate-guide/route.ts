import { getAnthropicClient } from '@/lib/anthropic/client'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { name, variety, category } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Plantenavn er påkrævet' }, { status: 400 })
    }

    const client = getAnthropicClient()

    const plantDescription = variety ? `${name} (sort: ${variety})` : name
    const categoryLabel = category || 'ukendt'

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Du er en erfaren dansk haveekspert. Generér en komplet dyrkningsguide for "${plantDescription}" (kategori: ${categoryLabel}).

Svar KUN med valid JSON i følgende format. Udfyld alle felter du kan med fagligt korrekte data for danske dyrkningsforhold. Brug null for felter du ikke kan udfylde.

{
  "description": "Kort beskrivelse af planten (1-2 sætninger)",
  "sun_requirement": "full_sun" | "partial_shade" | "shade",
  "water_need": "low" | "medium" | "high",
  "frost_hardy": true | false,
  "spacing_cm": tal | null,
  "depth_cm": tal | null,
  "sow_indoor_start": "måned (fx mar)" | null,
  "sow_indoor_end": "måned (fx apr)" | null,
  "sow_outdoor_start": "måned" | null,
  "sow_outdoor_end": "måned" | null,
  "prick_out_weeks_after_sow": tal | null,
  "plant_out_start": "måned" | null,
  "plant_out_end": "måned" | null,
  "harvest_start": "måned" | null,
  "harvest_end": "måned" | null,
  "days_to_germination_min": tal | null,
  "days_to_germination_max": tal | null,
  "days_to_harvest_min": tal | null,
  "days_to_harvest_max": tal | null,
  "companion_plants": ["slug1", "slug2"] | null,
  "sowing_info": "Detaljeret tekst om såning: forspiring, såtidspunkt, spiringstid, sådybde, jordtype. Skriv som prosa, ikke som felter.",
  "repotting_info": "Tekst om ompotning: hvornår, trigger, potstørrelse, jordtype. Null hvis irrelevant.",
  "planting_out_info": "Tekst om udplantning: tidspunkt, afstand, temperatur, lysbehov, frosttolerance.",
  "care_info": "Tekst om pasning: vanding, gødning, opbinding, beskæring, knibning.",
  "environment_info": "Tekst om miljø: drivhus/friland/krukke, jordtype, opvarmet/uopvarmet.",
  "biology_info": "Tekst om biologi: companion planting, skadedyr, sygdomme.",
  "seed_type": "F1, heirloom, hybrid, osv." | null,
  "seed_harvest_possible": true | false | null,
  "common_mistakes": "Typiske fejl ved dyrkning af denne plante.",
  "warnings": "Vigtige advarsler eller ting man skal være opmærksom på.",
  "tips": "Gode tips og tricks til dyrkning."
}

Vigtige regler:
- Svar KUN med valid JSON, ingen anden tekst
- Skriv på dansk
- Brug danske måneder (jan, feb, mar, apr, maj, jun, jul, aug, sep, okt, nov, dec)
- Sektioner med tekst skal skrives som prosa — ikke lister eller felter
- Vær fagligt korrekt med fokus på danske dyrkningsforhold (zone 7-8)
- Inkludér kun sektioner der er relevante for planten`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()

    try {
      const parsed = JSON.parse(cleaned)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json(
        { error: 'Kunne ikke generere guide. Prøv igen.' },
        { status: 422 }
      )
    }
  } catch (error) {
    console.error('Generate guide error:', error)
    return NextResponse.json(
      { error: 'Der opstod en fejl. Prøv igen.' },
      { status: 500 }
    )
  }
}
