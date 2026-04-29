'use server'

import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { requireUser } from '@/lib/auth'
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
- sowingDepthMm: sådybde i mm
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

  // Brug max 2 billeder (forside + bagside)
  const images = imageUrls.slice(0, 2).map(url => ({
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

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { error: 'AI returnerede ugyldig JSON' }
    }

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

    return { fields }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ukendt fejl'
    return { error: `AI-fejl: ${msg}` }
  }
}
