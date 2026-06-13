/**
 * Tale-fortolkeren (V19) — hjernen i "Tal til din have".
 *
 * Tager en transskription af, hvad brugeren sagde i haven, og
 * omdanner den til 1-3 strukturerede forslag, brugeren kan godkende.
 * Ren funktion: ingen auth, ingen DB — så den kan testes isoleret.
 * Auth + gem ligger i src/actions/tale.ts.
 *
 * Råstof-reglen (Annas dom): det er DENNE funktion der gør Havebogen
 * selvforsynende med indhold — minder, vendepunkter, noter, opgaver.
 *
 * DB-virkelighed: plant_logs_v2.plant_id er NOT NULL. Derfor SKAL
 * note/observation/høst knyttes til en af brugerens planter; kan
 * ingen plante matches, bliver forslaget til en opgave (som godt
 * kan stå uden plante). Det håndhæves både i prompten og når der
 * gemmes.
 */

import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'

export type ForslagType = 'note' | 'observation' | 'hoest' | 'opgave'

export interface TaleForslag {
  /** Klient-id til markering i bekræftelses-UI'et */
  id: string
  type: ForslagType
  /** Kort overskrift, max ~6 ord */
  titel: string
  /** Tæt på brugerens egne ord */
  tekst: string
  /** Matchet plante (kræves for note/observation/hoest) */
  plantId: string | null
  plantNavn: string | null
  /** YYYY-MM-DD — kun opgaver, når et tidspunkt er nævnt */
  dato: string | null
}

export interface FortolkPlante {
  id: string
  name: string
  variety: string | null
}

const TYPER: ForslagType[] = ['note', 'observation', 'hoest', 'opgave']

function systemPrompt(plants: FortolkPlante[], today: string): string {
  const planteListe = plants.length
    ? plants
        .map(p => `- id:${p.id} · ${p.name}${p.variety ? ' ' + p.variety : ''}`)
        .join('\n')
    : '(brugeren har ingen aktive planter endnu)'

  return `Du er Potalots havejournal-assistent. Brugeren har netop fortalt med sin stemme, hvad de så, gjorde eller planlægger i haven. Omdan det til 1-3 korte, strukturerede forslag, som brugeren kan godkende.

I dag er ${today}.

Brugerens aktive planter:
${planteListe}

Svar KUN med ren JSON i dette format (ingen markdown, ingen forklaring):
{"forslag":[{"type":"note","titel":"...","tekst":"...","plantId":"...","dato":null}]}

Regler:
- type skal være én af: note, observation, hoest, opgave.
- "note" og "observation" og "hoest" SKAL have et plantId fra listen ovenfor. Kan du ikke med rimelighed knytte forslaget til en konkret plante, så lav det i stedet til en "opgave" med plantId: null.
- "hoest" bruges når brugeren fortæller om en høst (fx "første agurk plukket").
- "opgave" bruges til noget der skal gøres. Sæt dato (YYYY-MM-DD) hvis brugeren nævner et tidspunkt ("i weekenden", "næste uge"); ellers null.
- titel: kort, max ca. 6 ord. tekst: tæt på brugerens egne ord, hel sætning.
- Lav kun forslag der faktisk ligger i det sagte. Find ikke på planter eller datoer der ikke er nævnt. Højst 3 forslag.`
}

/** Trim Claude-svar til det første JSON-objekt og parse det robust. */
function parseForslagJSON(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

/**
 * Fortolk en transskription → 1-3 forslag. Kaster ikke; returnerer
 * tom liste hvis Claude svarer uventet (kalderen viser så "prøv igen").
 */
export async function byggForslag(args: {
  transcript: string
  plants: FortolkPlante[]
  today: string
}): Promise<TaleForslag[]> {
  const transcript = args.transcript.trim()
  if (!transcript) return []

  const anthropic = getAnthropicClient()
  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU,
    max_tokens: 700,
    system: systemPrompt(args.plants, args.today),
    messages: [{ role: 'user', content: transcript }],
  })
  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return []

  const parsed = parseForslagJSON(textBlock.text) as
    | { forslag?: unknown[] }
    | null
  if (!parsed || !Array.isArray(parsed.forslag)) return []

  const plantById = new Map(args.plants.map(p => [p.id, p]))

  return parsed.forslag
    .slice(0, 3)
    .map((r, i): TaleForslag | null => {
      const o = r as Record<string, unknown>
      let type = (typeof o.type === 'string' ? o.type : 'note') as ForslagType
      if (!TYPER.includes(type)) type = 'note'
      const titel = typeof o.titel === 'string' ? o.titel.trim() : ''
      const tekst = typeof o.tekst === 'string' ? o.tekst.trim() : ''
      if (!titel && !tekst) return null

      const plantId = typeof o.plantId === 'string' && plantById.has(o.plantId) ? o.plantId : null
      // Håndhæv NOT NULL-reglen: note/observation/hoest uden gyldig
      // plante kan ikke gemmes som log → degradér til opgave.
      if (type !== 'opgave' && !plantId) type = 'opgave'

      const dato =
        type === 'opgave' && typeof o.dato === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.dato)
          ? o.dato
          : null

      const plante = plantId ? plantById.get(plantId) : null
      return {
        id: `f${i}`,
        type,
        titel: titel || tekst.slice(0, 40),
        tekst: tekst || titel,
        plantId,
        plantNavn: plante ? `${plante.name}${plante.variety ? ' ' + plante.variety : ''}` : null,
        dato,
      }
    })
    .filter((f): f is TaleForslag => f !== null)
}
