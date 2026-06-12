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

export function dagensHilsen(now: Date, fornavn?: string | null): DagensHilsen {
  const del = dagsdel(now.getHours())
  const tid = aarstid(now.getMonth())
  const pulje = STEMNING[tid][del]
  // Deterministisk dag-for-dag variation — ingen Math.random
  // (server og klient skal rendre ens, og brugeren skal opleve
  // at bogen skifter side hver dag, ikke hvert reload).
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
