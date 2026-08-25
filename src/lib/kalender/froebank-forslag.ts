/**
 * Frøbank-forslag til Kalenderens Inspiration-mappe (fane 1, "Fra din Frøbank").
 *
 * ── Hvorfor denne fil findes (KAL-0110, Anna 25/8, P1) ────────────────────
 * Fanen viste tre HARDKODEDE kort (Little Gem / basilikum / stangbønne) året
 * rundt — uanset måned og uanset om brugeren overhovedet ejede de frø. I
 * august læste brugeren derfor "Giv basilikum varme — vent på lune nætter"
 * under overskriften "Sorter, du stadig kan nå". Det er rådgivning på det
 * forkerte tidspunkt, ikke kosmetik.
 *
 * ── De to låste regler ───────────────────────────────────────────────────
 * 1. MÅNED FØRST. Et kort må kun vises, hvis Potalot kan dokumentere BÅDE
 *    at brugeren ejer frøet OG at der findes et vindue for netop den valgte
 *    måned. Ukendt vindue (tomme månedslister) = tavshed, aldrig et gæt.
 * 2. INGEN FILLER. Er der ét relevant frø, vises ét kort. Vi fylder aldrig
 *    tre pladser op for formens skyld (samme regel som Kalender-korrekturen
 *    og som `dagens-fokus.ts`' stilhed-er-en-feature).
 *
 * Handlingsordene er de samme som Kalenderens hjerne bruger i lag 4
 * (`dagens-fokus.ts` → `lag4FroebankVindue`): Så / Forkultivér / Plant ud.
 * Bydeform, jf. sektion-roller.md — Kalenderen formulerer alt som handling.
 *
 * Høst, blomstring og stiklinger er BEVIDST udeladt: Frøbanken kender kun
 * de tre vinduer (så / plant ud / høst), og høst hører til en plante, ikke
 * til en frøpose. Kommer der data for flere handlinger, udvides `Vindue`.
 *
 * Ren funktion, ingen DB-kald. Kaldes server-side (kalender/page.tsx), fordi
 * billed-resolveren trækker de genererede manifester ind — de skal ikke i
 * kalenderens klient-bundle.
 */

import type { InventoryItem, InventoryStatus, PrimaryCategoryId, Plant } from '@/lib/types'
import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import { findFroebankAutofill } from '@/lib/froebank-autofill'

export interface FroebankForslag {
  /** Stabil React-key — inventory-id'et for den pose forslaget kom fra. */
  id: string
  title: string
  text: string
  href: string
  image?: string
  imageAlt?: string
}

export interface FroebankForslagInput {
  inventory: InventoryItem[]
  plants: Plant[]
  /** 1-12 — den måned brugeren KIGGER på, ikke nødvendigvis dags dato. */
  month: number
  /** Max antal kort. Færre er fint; vi fylder aldrig op. */
  max?: number
}

const MAANED_NAVN = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/** Kategorier der ikke er ting, brugeren EJER og kan sætte i jorden. */
const IKKE_EJET: PrimaryCategoryId[] = ['indkoebsliste', 'favoritter']

/** Poser der er ude af spil — de skal ikke foreslås. */
const UDE_AF_SPIL: InventoryStatus[] = ['afsluttet', 'arkiveret']

type Vindue = 'forspir' | 'saa' | 'plant-ud'

/** Visningsnavn: "Stangbønne Cobra" (art + sort) eller bare arten. */
function visningsNavn(name: string, variety?: string | null): string {
  return variety ? `${name} ${variety}` : name
}

/** Dedup-nøgle på art|sort — flere fysiske poser af samme sort giver ét kort. */
function sortKey(name: string, variety?: string | null): string {
  return `${name.toLowerCase().trim()}|${(variety ?? '').toLowerCase().trim()}`
}

/** Sidste måned i et vindue — bruges til "sidste udkald"-linjen. */
function lukker(months: number[]): number {
  return Math.max(...months)
}

function tekst(vindue: Vindue, month: number, months: number[]): string {
  const maaned = MAANED_NAVN[month - 1]
  const sidste = lukker(months) === month
  if (vindue === 'plant-ud') {
    return sidste
      ? `Sidste måned, du kan plante ud.`
      : `Udplantningsvinduet er åbent i ${maaned}.`
  }
  if (vindue === 'forspir') {
    return sidste
      ? `Sidste måned, du kan forkultivere.`
      : `Forkultiveringsvinduet er åbent i ${maaned}.`
  }
  return sidste
    ? `Sidste måned, du kan så.`
    : `Såvinduet er åbent i ${maaned}.`
}

function titel(vindue: Vindue, navn: string): string {
  if (vindue === 'plant-ud') return `Plant ${navn} ud`
  if (vindue === 'forspir') return `Forkultivér ${navn}`
  return `Så ${navn}`
}

interface PoseVinduer {
  sowingMonths: number[]
  plantingOutMonths: number[]
  preCultivation: boolean | null
}

/**
 * Posens dyrkningsvinduer — med ARV, jf. guidekontrakten (Anna 25/8).
 *
 * En manglende værdi på posen betyder "ingen override", ikke "ingen
 * aktivitet". Står posen helt uden vinduer, spørger vi derfor Potalots
 * egen resolver (`findFroebankAutofill`), som allerede implementerer
 * sort → art-arven OG sammenfoldningen af guidernes to såfelter
 * (`sowingMonths` = forkultivering, `directSowingMonths` = direkte såning).
 * Er guiderne også tavse, forbliver vi tavse.
 *
 * To ting det her IKKE gør, og hvorfor:
 * - Det OVERSKRIVER aldrig en gemt værdi. En udfyldt pose kan være Annas
 *   egen rettelse, og "Potalot foreslår, brugeren bestemmer" gælder også
 *   her. Er en gemt værdi forældet i forhold til en nyere guide, hører det
 *   hjemme i backfill-flowet på /froebank — ikke i en tavs read-time-override.
 * - Det SKRIVER intet. Samme princip som frøkort-resolveren: opslaget sker
 *   ved visning, så en pose automatisk får glæde af en guide, Potalot først
 *   har fået bagefter.
 */
function vinduerForPose(item: InventoryItem): PoseVinduer {
  const gemt = {
    sowingMonths: item.sowingMonths ?? [],
    plantingOutMonths: item.plantingOutMonths ?? [],
    preCultivation: item.preCultivation ?? null,
  }
  if (gemt.sowingMonths.length > 0 || gemt.plantingOutMonths.length > 0) return gemt

  const autofill = findFroebankAutofill(item.name, item.variety ?? null)
  if (!autofill) return gemt
  const arvet = {
    sowingMonths: autofill.facts.sowingMonths ?? [],
    plantingOutMonths: autofill.facts.plantingOutMonths ?? [],
    preCultivation: autofill.facts.preCultivation ?? gemt.preCultivation,
  }
  if (arvet.sowingMonths.length === 0 && arvet.plantingOutMonths.length === 0) return gemt
  return arvet
}

/**
 * Hvilket vindue er åbent for denne pose i denne måned? Rækkefølgen er
 * bevidst: så/forkultivér vinder over udplantning, fordi såvinduet lukker
 * først og er den handling, brugeren kan nå at gøre noget ved.
 * Tomme månedslister EFTER arv = vi VED det ikke → null (tavshed, ikke gæt).
 */
function aabentVindue(item: InventoryItem, month: number): { vindue: Vindue; months: number[] } | null {
  const v = vinduerForPose(item)
  if (v.sowingMonths.length && v.sowingMonths.includes(month)) {
    return { vindue: v.preCultivation === true ? 'forspir' : 'saa', months: v.sowingMonths }
  }
  if (v.plantingOutMonths.length && v.plantingOutMonths.includes(month)) {
    return { vindue: 'plant-ud', months: v.plantingOutMonths }
  }
  return null
}

/**
 * Bygger månedens forslag fra brugerens EGEN frøbank.
 *
 * Rangering (kun på kriterier vi kender for ALLE kandidater):
 *   1. Vinduet lukker denne måned  → "stadig kan nå" er bogstavelig talt sandt
 *   2. Så/forkultivér før plant-ud → handlingen med kortest horisont først
 *   3. Alfabetisk på visningsnavn  → stabil rækkefølge mellem reloads
 */
export function byggFroebankForslag(input: FroebankForslagInput): FroebankForslag[] {
  const { inventory, plants, month, max = 3 } = input
  if (month < 1 || month > 12) return []

  // Sorter der allerede gror: så siger vi ikke "så tomat", mens tomaten
  // står i vindueskarmen (samme dedup som dagens-fokus lag 4).
  const groerAllerede = new Set(
    plants.filter(p => !p.isArchived).map(p => sortKey(p.name, p.variety))
  )

  const set = new Set<string>()
  const kandidater: Array<{ forslag: FroebankForslag; sidste: boolean; vindue: Vindue; navn: string }> = []

  for (const item of inventory) {
    if (IKKE_EJET.includes(item.primaryCategoryId)) continue
    if (UDE_AF_SPIL.includes(item.status)) continue
    // Tom pose: seedCount 0 betyder faktisk nul (ikke "ukendt"), så en
    // opbrugt pose skal ikke foreslås. Er antallet ukendt, siger vi intet.
    if (typeof item.seedsRemaining === 'number' && item.seedsRemaining <= 0) continue

    const aabent = aabentVindue(item, month)
    if (!aabent) continue

    const noegle = sortKey(item.name, item.variety)
    if (groerAllerede.has(noegle)) continue
    if (set.has(noegle)) continue // flere poser af samme sort → ét kort
    set.add(noegle)

    const navn = visningsNavn(item.name, item.variety)
    const { src, source } = resolveSeedCard({
      guideId: item.guideId,
      name: item.name,
      variety: item.variety,
      preferredSrc: item.primaryImageId,
    })

    kandidater.push({
      sidste: lukker(aabent.months) === month,
      vindue: aabent.vindue,
      navn,
      forslag: {
        id: item.id,
        title: titel(aabent.vindue, navn),
        text: tekst(aabent.vindue, month, aabent.months),
        href: `/froebank/${item.id}`,
        // Kun ægte billeder — placeholder udelades, så kortet falder til
        // den neutrale kilde-markør i stedet for en tom ramme.
        ...(source !== 'fallback' ? { image: src, imageAlt: navn } : {}),
      },
    })
  }

  const vindueRang: Record<Vindue, number> = { forspir: 0, saa: 0, 'plant-ud': 1 }
  kandidater.sort((a, b) =>
    (Number(b.sidste) - Number(a.sidste)) ||
    (vindueRang[a.vindue] - vindueRang[b.vindue]) ||
    a.navn.localeCompare(b.navn, 'da')
  )

  return kandidater.slice(0, max).map(k => k.forslag)
}

/**
 * Alle 12 måneders forslag på én gang. Kalenderen lader brugeren skifte
 * måned i klienten, men motoren skal blive på serveren (billed-manifester).
 * Derfor beregnes hele året forud og sendes som ét lille opslagsobjekt.
 */
export function byggFroebankForslagPrMaaned(
  input: Omit<FroebankForslagInput, 'month'>,
): Record<number, FroebankForslag[]> {
  const ud: Record<number, FroebankForslag[]> = {}
  for (let m = 1; m <= 12; m++) ud[m] = byggFroebankForslag({ ...input, month: m })
  return ud
}
