/**
 * Tale-fortolkeren (v1) — hjernen i "Tal til din have".
 *
 * Tager en transskription af, hvad brugeren sagde i haven, og omdanner
 * den til 0-3 strukturerede forslag, brugeren kan godkende. Ren funktion:
 * ingen auth, ingen DB, ingen skrivning i domænetabeller — så den kan
 * testes isoleret. Auth + persistering ligger i src/actions/tale.ts og
 * src/actions/optagelser.ts.
 *
 * LÅSTE beslutninger (Docs/product/diktafon-v1-implementering.md):
 *  - 7 typer (2.2), fallback-type `note` når intet andet passer sikkert.
 *  - `text` = kort, sprogligt ryddet visningstekst; `evidence.sourceText`
 *    = ordret udsnit fra transskriptionen. Modellen må rydde talesprog,
 *    men ikke tilføje eller ændre betydning (2.1).
 *  - `null` frem for gæt: felter der ikke er nævnt, sættes til null (2.5).
 *  - Datoer løses til ISO (YYYY-MM-DD) med optagelsestidspunktet som anker;
 *    aldrig relative strenge (2.5).
 *  - Output valideres mod et fast Zod-skema; ved malformet svar forsøges
 *    højst én kontrolleret reparation, ellers INTERPRETATION_INVALID og
 *    intet gemmes (2.5).
 *
 * Skema-virkelighed: plant_logs_v2.plant_id er NOT NULL. Log-typerne
 * (observation/hoest/problem/minde/note) knyttes derfor til en plante, når
 * en kan matches; kan ingen matches, bevares forslaget stadig (teksten
 * ligger i optagelses-arkivet) — det degraderes IKKE til en falsk opgave.
 */

import { z } from 'zod'
import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'

export type ForslagType =
  | 'observation'
  | 'opgave'
  | 'hoest'
  | 'problem'
  | 'minde'
  | 'naeste_saeson'
  | 'note'

export const FORSLAG_TYPER: ForslagType[] = [
  'observation',
  'opgave',
  'hoest',
  'problem',
  'minde',
  'naeste_saeson',
  'note',
]

/** Typer der beskriver noget der skal gøres → gemmes som kalender-opgave. */
export const OPGAVE_TYPER: ForslagType[] = ['opgave', 'naeste_saeson']

export interface TaleForslag {
  /** Klient-id til markering i bekræftelses-UI'et */
  id: string
  type: ForslagType
  /** Kort, sprogligt ryddet visningstekst (hel sætning, ~max 10 ord) */
  text: string
  /** Matchet plante (log-typerne knyttes hertil når muligt) */
  plantId: string | null
  plantNavn: string | null
  /** YYYY-MM-DD — kun opgave/naeste_saeson når et tidspunkt er nævnt; ellers null */
  dato: string | null
  /** Det brugeren faktisk sagde — ordret udsnit fra transskriptionen */
  evidence: { sourceText: string }
}

export interface FortolkPlante {
  id: string
  name: string
  variety: string | null
}

/**
 * Resultatet af en fortolkning. `ok: true` med tom `forslag`-liste er en
 * gyldig tilstand (ren snak / intet brugbart) — UI'et viser da tom-tilstanden.
 * `ok: false` er en malformet-model-fejl: intet gemmes, teksten bevares.
 */
export type FortolkResultat =
  | { ok: true; forslag: TaleForslag[] }
  | { ok: false; code: 'INTERPRETATION_INVALID'; message: string }

// ── Zod-skema for modellens rå output (struktur, ikke semantik) ──────────
// Løst på plantId/dato med vilje: ukendt plante → null, ikke-ISO dato → null
// normaliseres i kode. Zod fanger kun STRUKTURfejl (manglende felter, forkert
// type-enum, tomme strenge) → dét udløser reparation/INTERPRETATION_INVALID.
const RawItemSchema = z.object({
  type: z.enum(FORSLAG_TYPER as [ForslagType, ...ForslagType[]]),
  text: z.string().trim().min(1),
  sourceText: z.string().trim().min(1),
  plantId: z.string().nullable(),
  dato: z.string().nullable(),
})
const RawOutputSchema = z.object({
  forslag: z.array(RawItemSchema).max(3),
})
type RawItem = z.infer<typeof RawItemSchema>

const ISO_DATO = /^\d{4}-\d{2}-\d{2}$/

function systemPrompt(plants: FortolkPlante[], ankerDato: string): string {
  const planteListe = plants.length
    ? plants
        .map(p => `- id:${p.id} · ${p.name}${p.variety ? ' ' + p.variety : ''}`)
        .join('\n')
    : '(brugeren har ingen aktive planter endnu)'

  return `Du er Potalots havejournal-assistent. Brugeren har netop fortalt med sin stemme, hvad de så, gjorde, oplevede eller planlægger i haven. Omdan det til 0-3 korte, strukturerede forslag, som brugeren kan godkende.

Optagelsen er lavet ${ankerDato} (brug denne dato som anker, når du løser tidsudtryk).

Brugerens aktive planter:
${planteListe}

Svar KUN med ren JSON i præcis dette format (ingen markdown, ingen forklaring):
{"forslag":[{"type":"observation","text":"...","sourceText":"...","plantId":"...","dato":null}]}

Felter pr. forslag:
- type: én af observation | opgave | hoest | problem | minde | naeste_saeson | note.
- text: KORT, sprogligt ryddet visningstekst. Du må fjerne fyldord og gøre talesprog til en læsbar sætning. Du må IKKE tilføje oplysninger eller ændre betydningen.
- sourceText: det ORDRETTE udsnit af transskriptionen, som forslaget bygger på. Citér brugeren; ret ikke.
- plantId: id fra listen ovenfor, hvis forslaget tydeligt handler om en konkret plante; ellers null. GÆT ALDRIG en plante der ikke er nævnt.
- dato: YYYY-MM-DD, KUN for opgave/naeste_saeson og KUN hvis brugeren nævner et tidspunkt (fx "på tirsdag", "næste uge"). Løs det til en rigtig dato ud fra ankeret ovenfor. Ellers null. Skriv ALDRIG relative ord som "næste uge" i dato-feltet.

Typernes betydning:
- observation: en iagttagelse af en plantes tilstand ("tomaterne ser trætte ud").
- opgave: noget der skal gøres ("husk at vande").
- hoest: en høst ("første agurk plukket").
- problem: sygdom, skadedyr eller skade ("meldug på squashen").
- minde: et øjeblik værd at huske ("første blomst sprang ud i dag").
- naeste_saeson: en idé eller note til en kommende sæson ("prøv en anden sort næste år").
- note: meningsfuldt, men passer ikke sikkert i nogen af de andre. Brug den som sidste udvej — kast ALDRIG noget meningsfuldt væk.

Regler:
- Lav kun forslag der faktisk ligger i det sagte. Find ikke på planter, datoer eller detaljer.
- Er intet brugbart sagt, så returnér {"forslag":[]}.
- Højst 3 forslag.`
}

/** Trim modelsvar til det første JSON-objekt og parse det. */
function udtrækJSON(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

async function kaldModel(system: string, brugerBesked: string): Promise<string> {
  const anthropic = getAnthropicClient()
  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU,
    max_tokens: 800,
    system,
    messages: [{ role: 'user', content: brugerBesked }],
  })
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text : ''
}

/** Normalisér ét validt rå-item til et TaleForslag (plante-match + ISO-dato). */
function normalisér(
  raw: RawItem,
  i: number,
  plantById: Map<string, FortolkPlante>,
): TaleForslag {
  const plantId =
    typeof raw.plantId === 'string' && plantById.has(raw.plantId)
      ? raw.plantId
      : null
  const plante = plantId ? plantById.get(plantId)! : null

  // Dato kun for opgave-typer og kun hvis den er en ægte ISO-dato; ellers null.
  const dato =
    OPGAVE_TYPER.includes(raw.type) &&
    typeof raw.dato === 'string' &&
    ISO_DATO.test(raw.dato)
      ? raw.dato
      : null

  return {
    id: `f${i}`,
    type: raw.type,
    text: raw.text.trim(),
    plantId,
    plantNavn: plante ? `${plante.name}${plante.variety ? ' ' + plante.variety : ''}` : null,
    dato,
    evidence: { sourceText: raw.sourceText.trim() },
  }
}

/**
 * Ren del af fortolkningen (ingen I/O): rå modelsvar → validerede forslag.
 * Zod fanger STRUKTURfejl → `{ ok: false }`. Ved success normaliseres hvert
 * item (plante-match, ISO-dato). Eksporteret så logikken kan testes isoleret.
 */
export function fortolkRåSvar(
  rå: string,
  plants: FortolkPlante[],
): { ok: true; forslag: TaleForslag[] } | { ok: false; issues: string } {
  const parsed = RawOutputSchema.safeParse(udtrækJSON(rå))
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues
        .map(iss => iss.path.join('.') + ': ' + iss.message)
        .join('; '),
    }
  }
  const plantById = new Map(plants.map(p => [p.id, p]))
  return {
    ok: true,
    forslag: parsed.data.forslag.map((r, i) => normalisér(r, i, plantById)),
  }
}

/**
 * Fortolk en transskription → 0-3 forslag.
 *
 * Flow (2.5): kald model → parse → Zod-validér. Ved struktur-fejl forsøges
 * ÉN kontrolleret reparation; fejler den også, returneres
 * INTERPRETATION_INVALID (intet gemmes, teksten bevares i UI'et).
 * Kaster ikke — kalderen (actions/tale.ts) fanger netværks-/API-fejl separat.
 */
export async function byggForslag(args: {
  transcript: string
  plants: FortolkPlante[]
  ankerDato: string
  /** Injicerbart modelkald (test-seam). Default = det rigtige Haiku-kald. */
  _kald?: (system: string, besked: string) => Promise<string>
}): Promise<FortolkResultat> {
  const transcript = args.transcript.trim()
  if (!transcript) return { ok: true, forslag: [] }

  const system = systemPrompt(args.plants, args.ankerDato)
  const kald = args._kald ?? kaldModel

  // Forsøg 1 + præcis én reparation.
  let besked = transcript
  for (let forsøg = 0; forsøg < 2; forsøg++) {
    const rå = await kald(system, besked)
    const res = fortolkRåSvar(rå, args.plants)
    if (res.ok) return { ok: true, forslag: res.forslag }
    // Kontrolleret reparation: bed modellen rette til gyldigt skema, én gang.
    besked = `Dit forrige svar matchede ikke det krævede JSON-skema (${res.issues}). Her er teksten igen — svar KUN med gyldig JSON i det format, jeg beskrev:\n\n${transcript}`
  }

  return {
    ok: false,
    code: 'INTERPRETATION_INVALID',
    message: 'Potalot kunne ikke dele noten sikkert op.',
  }
}
