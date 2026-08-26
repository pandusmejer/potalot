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
 * ── Semantikken (ANNA-LÅST 25/8) ─────────────────────────────────────────
 * "Fra din Frøbank" = ting, du stadig kan STARTE fra frø, løg eller knold.
 * Høst, blomstring, knibning og stiklinger handler om planter, der allerede
 * vokser — de hører til Mine planter og Kalenderens plantebaserede råd. En
 * basilikum-frøpose fortæller os ikke, om posen nogensinde blev sået; råd om
 * høst dér ville bare være en mere sofistikeret måde at gætte på.
 * Derfor er "Sorter, du stadig kan nå" præcis, ikke omtrentlig.
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
import {
  resolveFroebankVinduer,
  FROEBANK_VINDUE_PRIORITET,
  type FroebankVindue,
  type FroebankVinduesHandling,
  type FroebankVinduesKilde,
} from '@/lib/froebank-autofill'

export interface FroebankForslag {
  /** Stabil React-key — inventory-id'et for den pose forslaget kom fra. */
  id: string
  title: string
  text: string
  href: string
  image?: string
  imageAlt?: string
  /** Hvilket vindue kortet står på — bevaret hele vejen, så det kan debugges. */
  action: FroebankVinduesHandling
  /** Hvor vinduet kom fra: posen selv, sortsguiden eller artsguiden. */
  source: FroebankVinduesKilde
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

const TITEL: Record<FroebankVinduesHandling, (navn: string) => string> = {
  direct_sow: navn => `Så ${navn}`,
  pre_sow: navn => `Forkultivér ${navn}`,
  plant_out: navn => `Plant ${navn} ud`,
}

const SIDSTE_LINJE: Record<FroebankVinduesHandling, string> = {
  direct_sow: 'Sidste måned, du kan så.',
  pre_sow: 'Sidste måned, du kan forkultivere.',
  plant_out: 'Sidste måned, du kan plante ud.',
}

const AABEN_LINJE: Record<FroebankVinduesHandling, string> = {
  direct_sow: 'Såvinduet',
  pre_sow: 'Forkultiveringsvinduet',
  plant_out: 'Udplantningsvinduet',
}

function tekst(vindue: FroebankVindue, month: number): string {
  if (lukker(vindue.months) === month) return SIDSTE_LINJE[vindue.action]
  return `${AABEN_LINJE[vindue.action]} er åbent i ${MAANED_NAVN[month - 1]}.`
}

/**
 * Posens dyrkningsvinduer — typede, med ARV (guidekontrakten, Anna 25/8).
 *
 * Kilden er `resolveFroebankVinduer`, som bevarer HANDLINGEN. Motoren udleder
 * altså aldrig verbet af `preCultivation` — den egenskab siger "denne art
 * kan/skal forkultiveres", ikke "denne måned er en forkultiveringsmåned".
 *
 * To lag:
 * 1. Har posen ingen egne måneder → guidens vinduer bruges direkte (arv).
 *    En manglende sortsværdi betyder "ingen override", ikke "ingen aktivitet".
 * 2. Har posen egne måneder → MÅNEDERNE er posens (brugeren bestemmer), men
 *    HANDLINGEN slås op i guidens typede vinduer måned for måned. Ligger
 *    posens marts i artens directSowingMonths, er marts en "Så"-måned — også
 *    selv om arten også kan forkultiveres.
 *
 * Det OVERSKRIVER aldrig en gemt værdi, og det SKRIVER intet (samme princip
 * som frøkort-resolveren). Er en gemt værdi forældet i forhold til en nyere
 * guide, hører det hjemme i backfill-flowet på /froebank — ikke i en tavs
 * read-time-override.
 */
function vinduerForPose(item: InventoryItem): FroebankVindue[] {
  const guide = resolveFroebankVinduer(item.name, item.variety ?? null)
  const gemtSaa = item.sowingMonths ?? []
  const gemtUd = item.plantingOutMonths ?? []
  if (gemtSaa.length === 0 && gemtUd.length === 0) return guide

  const ud: FroebankVindue[] = []
  if (gemtSaa.length > 0) ud.push(...saaVinduerFraGemte(gemtSaa, guide, item.preCultivation ?? null))
  if (gemtUd.length > 0) {
    ud.push({ action: 'plant_out', months: [...gemtUd].sort((a, b) => a - b), source: 'inventory' })
  }
  return ud
}

/**
 * Posens gemte såmåneder → typede vinduer. Hver måned tildeles ÉN handling:
 * findes den i guidens direkte-så-vindue, er den en "Så"-måned; ellers i
 * forkultiverings-vinduet, er den en "Forkultivér"-måned.
 *
 * Kender guiden slet ikke måneden (posen rækker ud over artens vinduer —
 * fx en tomat gemt med februar, hvor arten kun kender marts-april), falder
 * vi tilbage i denne rækkefølge: posens eget `preCultivation` → den ENESTE
 * såhandling arten overhovedet kender → "Så" som enkleste råd.
 *
 * Her SKAL månederne klippes fra hinanden (modsat guidens egne vinduer):
 * "sidste måned, du kan så" må måles på posens eget vindue, ikke på artens.
 */
function saaVinduerFraGemte(
  gemte: number[], guide: FroebankVindue[], preCultivation: boolean | null,
): FroebankVindue[] {
  const direkte = guide.find(v => v.action === 'direct_sow')
  const forspir = guide.find(v => v.action === 'pre_sow')
  const sidsteUdvej: FroebankVinduesHandling =
    preCultivation === true ? 'pre_sow'
    : preCultivation === false ? 'direct_sow'
    : forspir && !direkte ? 'pre_sow'
    : 'direct_sow'
  const grupper = new Map<FroebankVinduesHandling, number[]>()

  for (const m of [...gemte].sort((a, b) => a - b)) {
    const action: FroebankVinduesHandling =
      direkte?.months.includes(m) ? 'direct_sow'
      : forspir?.months.includes(m) ? 'pre_sow'
      : sidsteUdvej
    grupper.set(action, [...(grupper.get(action) ?? []), m])
  }

  return FROEBANK_VINDUE_PRIORITET
    .filter(a => grupper.has(a))
    .map(action => ({ action, months: grupper.get(action)!, source: 'inventory' as const }))
}

/**
 * Hvilket vindue er åbent for denne pose i denne måned?
 *
 * Prioritet ved flere åbne vinduer: direkte såning → forkultivering →
 * udplantning (FROEBANK_VINDUE_PRIORITET). Kan man både så salaten direkte
 * og forkultivere den i august, er "Så salat" det enklere råd.
 *
 * Ingen vinduer efter arv = vi VED det ikke → null (tavshed, ikke gæt).
 */
function aabentVindue(item: InventoryItem, month: number): FroebankVindue | null {
  const vinduer = vinduerForPose(item)
  for (const action of FROEBANK_VINDUE_PRIORITET) {
    const traeffer = vinduer.find(v => v.action === action && v.months.includes(month))
    if (traeffer) return traeffer
  }
  return null
}

/**
 * Bygger månedens forslag fra brugerens EGEN frøbank.
 *
 * Rangering (kun på kriterier vi kender for ALLE kandidater):
 *   1. Vinduet lukker denne måned  → "stadig kan nå" er bogstavelig talt sandt
 *   2. Handlings-prioritet        → så → forkultivér → plant ud
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
  const kandidater: Array<{
    forslag: FroebankForslag
    sidste: boolean
    action: FroebankVinduesHandling
    navn: string
  }> = []

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
    const { src, source: billedKilde } = resolveSeedCard({
      guideId: item.guideId,
      name: item.name,
      variety: item.variety,
      preferredSrc: item.primaryImageId,
    })

    kandidater.push({
      sidste: lukker(aabent.months) === month,
      action: aabent.action,
      navn,
      forslag: {
        id: item.id,
        title: TITEL[aabent.action](navn),
        text: tekst(aabent, month),
        href: `/froebank/${item.id}`,
        action: aabent.action,
        source: aabent.source,
        // Kun ægte billeder — placeholder udelades, så kortet falder til
        // den neutrale kilde-markør i stedet for en tom ramme.
        ...(billedKilde !== 'fallback' ? { image: src, imageAlt: navn } : {}),
      },
    })
  }

  kandidater.sort((a, b) =>
    (Number(b.sidste) - Number(a.sidste)) ||
    (FROEBANK_VINDUE_PRIORITET.indexOf(a.action) - FROEBANK_VINDUE_PRIORITET.indexOf(b.action)) ||
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
