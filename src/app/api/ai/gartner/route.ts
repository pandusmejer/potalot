import { NextResponse, type NextRequest } from 'next/server'
import { getAnthropicClient, CLAUDE_HAIKU } from '@/lib/anthropic/client'
import { createClient } from '@/lib/supabase/server'
import { getPlant, getPlantLogs } from '@/actions/mine-planter'
import { GUIDE_FACTS } from '@/data/guide-facts-index.generated'
import { PLANT_LOG_LABEL } from '@/lib/plant-log-meta'
import type { PlantLog } from '@/lib/types'

/**
 * AI Gartneren — motoren (spec: Docs/product/ai-gartner-integration.md).
 *
 * Ét streamende endpoint for alle indgange. Låste principper:
 *   1. Kører ALDRIG ved sideindlæsning — kun når brugeren beder om hjælp.
 *   2. Konteksten er superkraften: Potalot pakker selv art/sort/sådato/sted/
 *      log, så brugeren aldrig skal forklare sin have igen.
 *   3. Én identitet ("Gartneren"), ingen AI-brand.
 *
 * Kræver login (API-omkostning — anonyme får 401 og en venlig besked i
 * klienten). Svar gemmes i ai_conversations, så vurderingen bliver historik.
 */

export const maxDuration = 60

interface GartnerRequest {
  question?: string
  plantId?: string
  logId?: string
  guideId?: string
  /**
   * Semantisk skel (Annas retning 8/8): 'problem' = brugeren har registreret
   * noget konkret (log) og vil have hjælp til dét — problem-strukturen bruges.
   * 'general' = brugeren beder om et generelt blik på planten UDEN at have
   * meldt et problem — Gartneren må IKKE opfinde et problem eller bruge
   * "Sandsynlig årsag"-strukturen medmindre historikken reelt viser et.
   */
  intent?: 'general' | 'problem'
}

const MAX_QUESTION_LENGTH = 1000

function systemPrompt(dato: string): string {
  return `Du er Gartneren — Potalots rolige, erfarne danske haverådgiver. Potalot er en app til hobbyavlere, der dyrker grøntsager, blomster og krydderurter i haver, drivhuse og krukker i Danmark.

Dagens dato: ${dato}. Tag højde for dansk klima og sæson.

Din faglighed og dine grænser (VIGTIGST af alt):
- Skeln altid mellem observation, vurdering og sikker viden. Stil ALDRIG en sikker diagnose ud fra en kort beskrivelse alene — skriv aldrig "du har X" eller "det er X", medmindre grundlaget reelt er entydigt. Sig i stedet, hvad det kan ligne, og hjælp brugeren med at skelne: beskriv konkrete kendetegn at kigge efter (fx "små hvide insekter, der flyver op, når du rører planten, peger mod mellus — tætte kolonier af små grønne eller sorte insekter ved nye skud peger mod bladlus").
- Brug KUN almindelige danske plantenavne, skadedyrsnavne og fagtermer, som du med høj sikkerhed ved er etableret dansk fagsprog. Opfind ALDRIG danske betegnelser ved at oversætte, sammensætte eller gætte. Er du usikker på en betegnelse, så beskriv organismen eller symptomet med almindelige ord i stedet.
- Potalots medsendte dyrkningsfakta er din primære kilde. Du må ræsonnere ud fra observationer, men du må ALDRIG opfinde doseringer, blandingsforhold, produktnavne, temperaturer, intervaller eller behandlingsopskrifter, som ikke står i den medsendte viden. Ingen improviserede sprøjtemidler, sæbeblandinger eller hjemmelavede opskrifter med konkrete mål. Et forsigtigt generelt råd eller "det ved jeg ikke præcist" er ALTID bedre end opdigtet præcision.
- Anbefal tiltag i denne rækkefølge: 1) identificér problemet sikkert, 2) mekaniske og fysiske tiltag (fjern angrebne blade, skyl med vand, flyt planten), 3) dyrkningsmæssige tiltag (vanding, lys, luft, afstand), 4) andet kun hvis den medsendte viden konkret dækker det.
- Lov aldrig et resultat ("så virker det") — beskriv i stedet, hvad brugeren skal se efter, og hvad det betyder.

Sådan svarer du:
- Kort, roligt og konkret, på dansk, i et venligt havefagligt sprog uden smalltalk og uden dramatik. Korte sætninger — svaret skal kunne scannes, ikke læses som en artikel.
- Ved problemer bruger du denne struktur med sektions-labels på hver sin linje (uden kolon, uden andet på linjen). Den FØRSTE label vælger du ærligt efter, hvor sikker du reelt er — brug PRÆCIS én af disse tre:

Det ligner
(kun når beskrivelsen giver rimelig sikkerhed — 1-2 sætninger, den mest sandsynlige forklaring)

Mulige årsager
(når flere forklaringer er plausible — nævn dem kort, og hvad der peger mod hver)

Jeg mangler lidt for at vurdere det
(når beskrivelsen ikke er nok — sig kort, hvad du kan se, og stil 1-2 konkrete spørgsmål om det, brugeren kan undersøge)

Derefter:

Gør dette nu
(2-4 bindestreg-punkter, hver én konkret og sikker handling — udelad sektionen, hvis du reelt mangler grundlag for at anbefale noget)

Hold øje med
(1-2 korte linjer — hvad brugeren skal observere de kommende dage, og hvad det betyder)

Relevant guide
(KUN hvis konteksten nævner en art eller sort fra Potalots guides. På næste linje: PRÆCIS navnet som det står i konteksten — artens navn, fx "Tomat", eller sortens i formen "Tomat 'San Marzano'", hvis rådet er sortsspecifikt. Skriv ALDRIG et navn, der ikke står i konteksten. Findes intet, udelades label og sektion helt.)

- Ved almindelige videns-spørgsmål (ikke problemer) svarer du i 1-3 korte afsnit uden labels — stadig kort og konkret.
- Ved en GENEREL plantevurdering (brugeren har IKKE meldt et problem): start med 1-2 sætninger om plantens overordnede tilstand ud fra alder, sort, sted og historik. Brug derefter labelen "Hold øje med" med 2-3 punkter over det vigtigste fremadrettet. Brug KUN problem-strukturen ("Det ligner"/"Mulige årsager"/"Gør dette nu"), hvis historikken faktisk viser et konkret problem. Opfind aldrig et problem.
- Du hjælper brugeren fra en bestemt placering i Potalot. Brug altid den medsendte kontekst som allerede kendt information. Spørg ALDRIG brugeren om art, sort, plante eller problem, hvis oplysningerne findes i konteksten. Stil kun et opklarende spørgsmål, når en nødvendig oplysning reelt mangler. Svar på det niveau, brugeren befinder sig på.
- Mangler en AFGØRENDE oplysning, så giv dit bedste bud først og slut med ét enkelt opklarende spørgsmål (efter strukturen, som sidste linje).
- Ren tekst uden markdown: ingen **fed**, ingen overskrifter med #, ingen emojis.
- Du kan IKKE se billeder i denne samtale — bed i stedet brugeren beskrive, hvad de ser, hvis det er nødvendigt.
- Ved spørgsmål om spiselighed eller gift: vær forsigtig og sig tydeligt, når noget bør tjekkes hos en fagperson.
- Svar kun på have- og dyrkningsrelaterede spørgsmål; andet afviser du venligt med én sætning.`
}

function formaterLog(log: PlantLog): string {
  const type = PLANT_LOG_LABEL[log.type] ?? log.type
  const dele = [`${log.date}: ${type}`]
  if (log.title) dele.push(log.title)
  if (log.valueText) dele.push(`tilstand: ${log.valueText}`)
  if (log.valueNumeric != null) dele.push(`måling: ${log.valueNumeric}`)
  if (log.note) dele.push(log.note)
  return dele.join(' — ')
}

/** Kontekst-pakken: det Potalot allerede ved, formateret kompakt til modellen. */
async function bygKontekst(input: GartnerRequest): Promise<{
  kontekst: string
  plantIds: string[]
}> {
  const dele: string[] = []
  const plantIds: string[] = []

  if (input.plantId) {
    const [plant, logs] = await Promise.all([
      getPlant(input.plantId),
      getPlantLogs(input.plantId),
    ])
    if (plant) {
      plantIds.push(plant.id)
      const info = [
        `Plante: ${plant.name}${plant.variety ? ` '${plant.variety}'` : ''}`,
        plant.sowDate ? `sået ${plant.sowDate}` : null,
        plant.plantingOutDate ? `plantet ud ${plant.plantingOutDate}` : null,
        plant.location ? `sted: ${plant.location}` : null,
        `antal: ${plant.quantity}`,
        `status: ${plant.status}`,
      ].filter(Boolean)
      dele.push(info.join(' · '))

      const fokusLog = input.logId ? logs.find(l => l.id === input.logId) : null
      if (fokusLog) {
        dele.push(`Hændelsen brugeren beder om vurdering af:\n${formaterLog(fokusLog)}`)
      }
      const seneste = logs
        .filter(l => l.id !== input.logId)
        .slice(0, 10)
        .map(formaterLog)
      if (seneste.length > 0) {
        dele.push(`Seneste log (nyeste først):\n${seneste.join('\n')}`)
      }

      // Dyrkningsfakta fra guide-biblioteket, hvis arten/sorten er kendt.
      const facts = opslagGuideFakta(plant.name, plant.variety)
      if (facts) dele.push(facts)
    }
  }

  if (input.guideId) {
    const guide = GUIDE_FACTS.find(g => g.id === input.guideId)
    if (guide) {
      if (guide.variety) {
        // Sortsguide: sortens egne fakta + NEDARVEDE artsfakta (Anna 9/8:
        // "Tomat · Sungold" er bedre kontekst end "tomat" alene).
        const parent = guide.parentGuideId
          ? GUIDE_FACTS.find(g => g.id === guide.parentGuideId)
          : null
        const artNavn = parent?.plantName ?? guide.plantName ?? input.guideId
        dele.push(`Brugeren står på sortsguiden for '${guide.variety}' under arten ${artNavn}. Spørgsmålet handler om denne sort, medmindre brugeren siger andet.`)
        const sortQf = kompaktQuickFacts(guide.quickFacts)
        if (sortQf) dele.push(`Sortens fakta: ${sortQf}`)
        if (parent) {
          const artQf = kompaktQuickFacts(parent.quickFacts)
          if (artQf) dele.push(`Artens fakta (${artNavn}): ${artQf}`)
        }
      } else {
        const artNavn = guide.plantName ?? input.guideId
        dele.push(`Brugeren står på artsguiden om ${artNavn}. Spørgsmålet handler om ${artNavn.toLowerCase()}, medmindre brugeren siger andet.`)
        const qf = kompaktQuickFacts(guide.quickFacts)
        if (qf) dele.push(qf)
      }
    }
  }

  return { kontekst: dele.join('\n\n'), plantIds }
}

function kompaktQuickFacts(qf: (typeof GUIDE_FACTS)[number]['quickFacts']): string | null {
  const md = (m: number[] | undefined) => (m && m.length ? m.join(', ') : null)
  const dele = [
    md(qf.sowingMonths) ? `forkultiveres md. ${md(qf.sowingMonths)}` : null,
    md(qf.directSowingMonths) ? `sås direkte md. ${md(qf.directSowingMonths)}` : null,
    md(qf.plantingOutMonths) ? `plantes ud md. ${md(qf.plantingOutMonths)}` : null,
    md(qf.harvestMonths) ? `høstes md. ${md(qf.harvestMonths)}` : null,
    qf.light ? `lys: ${qf.light}` : null,
    qf.water ? `vand: ${qf.water}` : null,
  ].filter(Boolean)
  return dele.length ? `Dyrkningsfakta fra Potalots guide: ${dele.join(' · ')}` : null
}

function opslagGuideFakta(name: string, variety?: string | null): string | null {
  const slug = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const kandidater = [
    variety ? slug(`${name} ${variety}`) : null,
    slug(name),
  ].filter((s): s is string => !!s)
  for (const id of kandidater) {
    const guide = GUIDE_FACTS.find(g => g.id === id)
    if (guide) return kompaktQuickFacts(guide.quickFacts)
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'login_paakraevet' }, { status: 401 })
  }

  let body: GartnerRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'ugyldigt_input' }, { status: 400 })
  }

  const question = (body.question ?? '').trim().slice(0, MAX_QUESTION_LENGTH)
  // Tomt spørgsmål er OK når Gartneren selv skal vurdere noget konkret:
  // en logpost (problem) eller en plante (generel vurdering fra dialogen).
  const kanVurdereUdenSpoergsmaal =
    !!body.logId || (body.intent === 'general' && !!body.plantId)
  if (!question && !kanVurdereUdenSpoergsmaal) {
    return NextResponse.json({ error: 'tomt_spoergsmaal' }, { status: 400 })
  }

  // Regel (Anna 8/8): én logpost = højst én initial vurdering. Findes der
  // allerede en gemt vurdering for denne log, returneres DEN — genåbning må
  // aldrig udløse et nyt AI-kald, og samme bladlus må aldrig få to svar.
  if (body.logId) {
    const { data: eksisterende } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('log_id', body.logId)
      .maybeSingle()
    if (eksisterende) {
      const msgs = eksisterende.messages as { role: string; content: string }[]
      const svar = msgs.find(m => m.role === 'assistant')?.content
      if (svar) {
        return new Response(svar, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      }
    }
  }

  const { kontekst, plantIds } = await bygKontekst(body)

  const intent = body.intent ?? (body.logId ? 'problem' : 'general')

  // Uden eksplicit spørgsmål: default pr. intent.
  const effektivtSpoergsmaal =
    question ||
    (intent === 'problem'
      ? 'Giv din vurdering af hændelsen ovenfor: sandsynlige årsager, hvad jeg bør gøre nu, og hvad jeg skal holde øje med.'
      : 'Giv en generel vurdering af planten ud fra dens alder, sort, sted og historik — og hvad jeg især bør holde øje med fremover. Jeg har ikke meldt noget problem.')

  const brugerBesked = kontekst
    ? `<kontekst>\n${kontekst}\n</kontekst>\n\n${effektivtSpoergsmaal}`
    : effektivtSpoergsmaal

  const dato = new Date().toLocaleDateString('da-DK', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const anthropic = getAnthropicClient()
  const encoder = new TextEncoder()
  let fuldtSvar = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: CLAUDE_HAIKU,
          max_tokens: 1024,
          system: systemPrompt(dato),
          messages: [{ role: 'user', content: brugerBesked }],
        })
        claudeStream.on('text', (delta) => {
          fuldtSvar += delta
          controller.enqueue(encoder.encode(delta))
        })
        await claudeStream.finalMessage()
        controller.close()

        // Gem som historik — best-effort, må aldrig påvirke svaret.
        try {
          await supabase.from('ai_conversations').insert({
            user_id: user.id,
            title: effektivtSpoergsmaal.slice(0, 120),
            messages: [
              { role: 'user', content: effektivtSpoergsmaal },
              { role: 'assistant', content: fuldtSvar },
            ],
            context_plant_ids: plantIds.length ? plantIds : null,
            // Binding til logposten (unikt indeks håndhæver én pr. log —
            // taber et racende kald, er den første vurdering sandheden).
            log_id: body.logId ?? null,
          })
        } catch {
          // stille — historik er sekundær
        }
      } catch (err) {
        console.error('gartner-stream fejlede:', err)
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
