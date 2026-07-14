'use server'

import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { requireUser } from '@/lib/auth'
import type { PrimaryCategoryId } from '@/lib/types'

/**
 * Onboarding-indgang 4: "Fortæl om haven med tekst".
 *
 * Genbruger den EKSISTERENDE Anthropic Haiku-klient (samme mønster som
 * seed-packet-extract) — ingen ny motor-stak. Fortolker en fri dansk
 * beskrivelse til strukturerede FORSLAG, der føres gennem onboarding-shellens
 * godkend-liste og først gemmes via de eksisterende create-actions
 * (opretEgenPlante / createInventoryItem). Intet gemmes her.
 */

export type HaveForslagKind = 'plante' | 'froe'
export type Usikkerhed = 'hoej' | 'mellem' | 'lav'

export interface HaveForslag {
  /** Stabilt id til listen (tildeles server-side). */
  id: string
  /** Dyrker brugeren den allerede (plante) eller har de frø (froe)? */
  kind: HaveForslagKind
  /** Art, fx "Tomat". */
  name: string
  /** Sort/type, fx "San Marzano". null = ukendt. */
  variety: string | null
  /** Antal (planter/poser). null = ukendt. */
  quantity: number | null
  /** Dyrkningssted, fx "Drivhus". null = ikke nævnt. Kun relevant for planter. */
  location: string | null
  /** Så-måneder 1-12 (kun frø, hvis nævnt). */
  sowingMonths: number[] | null
  /** Kategori-gæt for frø. */
  primaryCategoryId: PrimaryCategoryId | null
  /**
   * Hvor sikker fortolkningen er:
   *   hoej   = eksplicit nævnt i teksten
   *   mellem = rimeligt underforstået
   *   lav    = gæt — bør gennemses
   */
  usikkerhed: Usikkerhed
}

const SYSTEM_PROMPT = `Du læser en fri, dansk beskrivelse af en have og udleder,
hvad haven indeholder. Returnér KUN gyldig JSON (ingen markdown).

Format:
{"items":[{"kind","name","variety","quantity","location","sowingMonths","primaryCategoryId","certainty"}]}

Regler:
- kind: "plante" hvis brugeren ALLEREDE dyrker/har den stående (fx "jeg har tomater
  i drivhuset", "der står dahlia i bedet"). "froe" hvis det er frø/frøposer de
  har eller vil så (fx "jeg har en pose gulerodsfrø", "vil så spinat").
- name: dansk artsnavn med stort begyndelsesbogstav (fx "Tomat", "Gulerod").
- variety: sort/type hvis nævnt, ellers null.
- quantity: heltal hvis nævnt (fx "tre tomatplanter" → 3), ellers null.
- location: dyrkningssted hvis nævnt (fx "Drivhus", "Højbed 2"), ellers null.
- sowingMonths: array af måned-numre 1-12 KUN hvis teksten nævner så-tidspunkt, ellers null.
- primaryCategoryId: "fro" | "loeg" | "knolde" | "buske" | "traeer" | "stauder" (bedste gæt for frø, ellers null).
- certainty: "hoej" hvis eksplicit nævnt, "mellem" hvis rimeligt underforstået, "lav" hvis gæt.

VIGTIGT: Opfind ALDRIG planter/frø der ikke er nævnt. Er teksten tom for havehold,
returnér {"items":[]}. Del sammensatte udsagn op (fx "tomater og agurker" → to items).

Får du et FOTO af håndskrevne noter, lister eller skitser: læs det du kan, og udled
arter, sorter, antal, steder og status. Er håndskriften svær, så gæt forsigtigt og
sæt certainty="lav" — hellere et usikkert forslag brugeren kan rette end opfundet
sikkerhed. Kan du slet ikke læse noget, så udelad det.`

export async function fortolkHaveTekst(
  text: string,
  imageUrl?: string | null,
): Promise<{ forslag: HaveForslag[] } | { error: string }> {
  await requireUser()

  const trimmed = text.trim()
  // Foto af håndskrevne noter er lige så gyldigt input som tekst — genbruger
  // Claude-vision (samme mønster som frøpose-scan). https-URL kræves.
  const harFoto = !!imageUrl && /^https:\/\//.test(imageUrl)
  if (!harFoto && trimmed.length < 3) {
    return { error: 'Skriv lidt om haven eller tilføj et foto af dine noter først.' }
  }
  if (trimmed.length > 4000) return { error: 'Teksten er for lang — hold den under 4000 tegn.' }

  const anthropic = getAnthropicClient()

  // Besked-indhold: foto (hvis der er et) + fri tekst. Begge, én af delene, virker.
  const content: Array<
    | { type: 'image'; source: { type: 'url'; url: string } }
    | { type: 'text'; text: string }
  > = []
  if (harFoto) content.push({ type: 'image', source: { type: 'url', url: imageUrl! } })
  if (trimmed) content.push({ type: 'text', text: trimmed })
  if (harFoto && !trimmed) {
    content.push({ type: 'text', text: 'Læs mine håndskrevne have-noter på billedet og udled hvad du kan.' })
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { error: 'Intet svar fra AI. Prøv igen.' }
    }

    let raw = textBlock.text.trim()
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (fence) raw = fence[1].trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { error: 'AI returnerede ugyldigt svar. Prøv at omformulere.' }
    }

    const items = (parsed as { items?: unknown }).items
    if (!Array.isArray(items)) return { forslag: [] }

    const forslag: HaveForslag[] = items
      .map((it, i) => normaliserForslag(it, i))
      .filter((f): f is HaveForslag => f !== null)

    return { forslag }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ukendt fejl'
    return { error: `AI-fejl: ${msg}` }
  }
}

const KATEGORIER: PrimaryCategoryId[] = ['fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder']

function normaliserForslag(raw: unknown, index: number): HaveForslag | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>

  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!name) return null

  const kind: HaveForslagKind = o.kind === 'froe' ? 'froe' : 'plante'
  const usikkerhed: Usikkerhed =
    o.certainty === 'hoej' || o.certainty === 'lav' ? o.certainty : 'mellem'

  const quantity =
    typeof o.quantity === 'number' && o.quantity > 0 ? Math.round(o.quantity) : null

  const sowingMonths = Array.isArray(o.sowingMonths)
    ? o.sowingMonths.filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 12)
    : null

  const primaryCategoryId =
    typeof o.primaryCategoryId === 'string' && KATEGORIER.includes(o.primaryCategoryId as PrimaryCategoryId)
      ? (o.primaryCategoryId as PrimaryCategoryId)
      : null

  return {
    id: `t${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    kind,
    name,
    variety: typeof o.variety === 'string' && o.variety.trim() ? o.variety.trim() : null,
    quantity,
    location: typeof o.location === 'string' && o.location.trim() ? o.location.trim() : null,
    sowingMonths: sowingMonths && sowingMonths.length > 0 ? sowingMonths : null,
    primaryCategoryId,
    usikkerhed,
  }
}
