/**
 * Havehilsen — heroens daglige velkomst (V9: havens stue).
 *
 * Hilsnen skifter efter tidspunkt på dagen og årstid, og den
 * varierer fra dag til dag (deterministisk på dagsnummer, så
 * server og klient er enige). Den må ALDRIG føles som en chatbot:
 *
 *   ❌ "Hvordan har du det i dag?"
 *   ❌ "Hvad vil du arbejde på?"
 *   ❌ "Klar til at dyrke?"
 *
 * Stemningslinjerne er observationer fra haven — ikke spørgsmål,
 * ikke opgaver, ikke statistik. Ærligheds-reglen gælder: linjerne
 * beskriver årstidens almene stemning ("duggen ligger på bladene"),
 * aldrig påstande om brugerens konkrete planter.
 */

export interface DagensHilsen {
  /** "Godmorgen, Rasmus." / "God aften." */
  hilsen: string
  /** Stemningslinje — "Duggen ligger stadig på bladene." */
  stemning: string
}

type Dagsdel = 'morgen' | 'formiddag' | 'eftermiddag' | 'aften'
type Aarstid = 'foraar' | 'sommer' | 'efteraar' | 'vinter'

const MAANED = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

const HILSEN_ORD: Record<Dagsdel, string> = {
  morgen: 'Godmorgen',
  formiddag: 'Hej',
  eftermiddag: 'Hej',
  aften: 'God aften',
}

/** Stemningspuljer pr. årstid × dagsdel — 2-3 pr. kombination. */
const STEMNING: Record<Aarstid, Record<Dagsdel, string[]>> = {
  foraar: {
    morgen: [
      'Jorden er ved at blive varm.',
      'Morgenerne er stadig kølige, men lyset er tilbage.',
    ],
    formiddag: [
      '{maaned} har travlt under jorden.',
      'Alting venter lige under overfladen.',
    ],
    eftermiddag: [
      'Eftermiddagssolen begynder at kunne mærkes.',
      'Bedene tørrer langsomt op efter vinteren.',
    ],
    aften: [
      'Aftenerne er lyse igen.',
      'Haven samler kræfter til i morgen.',
    ],
  },
  sommer: {
    morgen: [
      'Duggen ligger stadig på bladene.',
      'Haven er vågnet før dig.',
    ],
    formiddag: [
      '{maaned} bevæger sig hurtigt i haven.',
      'Alting gror — også det, du ikke har plantet.',
    ],
    eftermiddag: [
      'Solen står højt over bedene i dag.',
      'Skyggerne er korte mellem rækkerne nu.',
    ],
    aften: [
      'Haven falder langsomt til ro.',
      'Aftenlyset er det bedste lys at se til planterne i.',
    ],
  },
  efteraar: {
    morgen: [
      'Morgenluften er blevet skarpere.',
      'Duggen bliver liggende længere nu.',
    ],
    formiddag: [
      'Haven trækker vejret langsommere i {maaned}.',
      'Sæsonen er ved at samle sine sidste kræfter.',
    ],
    eftermiddag: [
      'Lyset bliver gyldnere for hver uge.',
      'Bedene er ved at gøre sig færdige for i år.',
    ],
    aften: [
      'Aftenerne kryber tættere på.',
      'Haven gemmer allerede på næste forår.',
    ],
  },
  vinter: {
    morgen: [
      'Der er stadig lidt tid til de første spirer.',
      'Haven hviler — det må du også gerne.',
    ],
    formiddag: [
      'Frøene venter trygt på foråret.',
      '{maaned} er til planer og frøkataloger.',
    ],
    eftermiddag: [
      'Lyset vender langsomt tilbage.',
      'De bedste sæsoner starter i tankerne.',
    ],
    aften: [
      'Haven sover — drømmene om den behøver ikke.',
      'Forårets første såning er tættere på, end den føles.',
    ],
  },
}

function dagsdel(time: number): Dagsdel {
  if (time >= 5 && time < 10) return 'morgen'
  if (time >= 10 && time < 13) return 'formiddag'
  if (time >= 13 && time < 17) return 'eftermiddag'
  return 'aften'
}

function aarstid(maaned0: number): Aarstid {
  if (maaned0 >= 2 && maaned0 <= 4) return 'foraar'
  if (maaned0 >= 5 && maaned0 <= 7) return 'sommer'
  if (maaned0 >= 8 && maaned0 <= 10) return 'efteraar'
  return 'vinter'
}

function dagINummer(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86400000)
}

/**
 * Tidsforankrede stemningslinjer (V10 — "tælleren handler om tid;
 * hilsnen kan også handle om tid"). Beregnet af kalenderen, så de
 * skifter af sig selv hen over måneden — uden nye data og uden
 * påstande om brugerens planter (ærligheds-reglen).
 */
function tidslinjer(now: Date): string[] {
  const lines: string[] = []
  const m = now.getMonth()
  const dag = now.getDate()
  const sidsteDag = new Date(now.getFullYear(), m + 1, 0).getDate()
  const navn = MAANED[m].charAt(0).toUpperCase() + MAANED[m].slice(1)

  // Månedens fremdrift — "Juni er næsten halvvejs gennem haven."
  if (dag <= 5) lines.push(`${navn} er lige begyndt i haven.`)
  else if (dag <= 12) lines.push(`${navn} er godt i gang i haven.`)
  else if (dag <= 17) lines.push(`${navn} er næsten halvvejs gennem haven.`)
  else if (dag <= sidsteDag - 5) lines.push(`${navn} er mere end halvvejs gennem haven.`)
  else lines.push(`${navn} rinder ud i haven.`)

  // Nedtælling til næste årstid — "Der er 81 dage til den første
  // efterårsmåned." Årstidsmåneder: 1. mar / 1. jun / 1. sep / 1. dec.
  const SKIFTE: Array<{ maaned0: number; label: string }> = [
    { maaned0: 2, label: 'forårsmåned' },
    { maaned0: 5, label: 'sommermåned' },
    { maaned0: 8, label: 'efterårsmåned' },
    { maaned0: 11, label: 'vintermåned' },
  ]
  for (const s of SKIFTE.map(s => ({
    ...s,
    dato: new Date(
      now.getFullYear() + (now.getMonth() >= s.maaned0 ? 1 : 0),
      s.maaned0,
      1,
    ),
  })).sort((a, b) => a.dato.getTime() - b.dato.getTime())) {
    const dage = Math.round(
      (s.dato.getTime() - new Date(now.getFullYear(), m, dag).getTime()) / 86400000,
    )
    if (dage >= 2) {
      lines.push(
        dage === 2
          ? `Der er to dage til den første ${s.label}.`
          : `Der er ${dage} dage til den første ${s.label}.`,
      )
      break
    }
  }

  return lines
}

export function dagensHilsen(now: Date, fornavn?: string | null): DagensHilsen {
  const del = dagsdel(now.getHours())
  const tid = aarstid(now.getMonth())
  // Puljen = tidsforankrede linjer + årstids-stemninger. Deterministisk
  // dag-for-dag rotation — ingen Math.random (server og klient skal
  // rendre ens, og brugeren skal opleve at bogen skifter side hver
  // dag, ikke hvert reload).
  const pulje = [...tidslinjer(now), ...STEMNING[tid][del]]
  const valg = pulje[dagINummer(now) % pulje.length]
  const stemning = valg.replace(
    '{maaned}',
    MAANED[now.getMonth()].charAt(0).toUpperCase() + MAANED[now.getMonth()].slice(1),
  )
  const navn = fornavn?.trim()
  return {
    hilsen: navn ? `${HILSEN_ORD[del]}, ${navn}.` : `${HILSEN_ORD[del]}.`,
    stemning,
  }
}
