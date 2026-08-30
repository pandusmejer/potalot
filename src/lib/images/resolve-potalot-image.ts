/**
 * resolvePotalotImage — ÉN canonical billed-resolver for Potalot.
 *
 * Træffer beslutning om hvilket billede der vises HVOR for en given
 * guide / sort / art. Bruger 4 prioritets-niveauer i fald-orden:
 *
 *   1. user-upload        — explicit preferredSrc (valideret mod manifest)
 *   2. guide-images       — POTALOT_IMAGE_SETS_BY_ID entry
 *   3. asset-convention   — /images/<role>/<slug>.{jpg,png}
 *   4. fallback           — placeholder med kendt path
 *
 * Hver kandidat valideres mod IMAGE_MANIFEST før den returneres —
 * vi returnerer ALDRIG en path til en fil der ikke findes på disken.
 *
 * REGLER (Annas image-pipeline-instruktion, juni 2026):
 *
 *   - Ingen cross-role fall. En variety-rolle (seed-card, plant-card,
 *     variety-hero) må ALDRIG falde til species-niveau eller en
 *     beslægtet sorts fil. Corno må aldrig vise California Wonder.
 *   - macro må KUN komme fra POTALOT_IMAGE_SETS_BY_ID. Ingen
 *     asset-convention for macro. Ingen gæt på /images/makro/<slug>
 *     uden entry.
 *   - Forkert billede er værre end intet billede — vi falder altid
 *     tilbage til neutral placeholder, aldrig til relateret sort.
 *
 * Spec: src/lib/images/types.ts (PotalotImageSet/PotalotImageRole)
 *       Docs/design-system/guides.md sektion -2 (billedhierarki)
 */

import { IMAGE_MANIFEST } from '@/data/image-manifest.generated'
import { POTALOT_IMAGE_SETS_BY_ID } from '@/data/potalot-image-sets'
import { GUIDE_IMAGE_INDEX } from '@/data/guide-image-index.generated'
import { kanoniskSortsSlug } from '@/lib/sorts-alias'
import { kanoniskArtsSlug, typeSlugForPose } from '@/lib/arts-model'
import type {
  PotalotImageInput,
  PotalotImageOutput,
  PotalotImageRole,
  PotalotMacroInput,
  PotalotMacroOutput,
  CropProfile,
  CropProfileName,
  MacroImage,
  MacroRole,
  PotalotImageSet,
} from './types'

export type {
  PotalotImageInput,
  PotalotImageOutput,
  PotalotImageRole,
  PotalotImageSource,
  PotalotMacroInput,
  PotalotMacroOutput,
} from './types'

const PLACEHOLDER_SRC = '/images/ui/placeholder-card.svg'
const PLACEHOLDER_ALT = 'Billede mangler'

// ─── Crop-profiler (genbrugt af resolvePotalotMacro) ──────────

const cropProfiles: Record<CropProfileName, CropProfile> = {
  'soft-left':    { objectPosition: '35% 50%', scale: 1.08, rotation: '-1deg' },
  'soft-right':   { objectPosition: '65% 50%', scale: 1.08, rotation: '1deg' },
  'center-zoom':  { objectPosition: '50% 50%', scale: 1.18, rotation: '0deg' },
  'top-band':     { objectPosition: '50% 28%', scale: 1.12, rotation: '0deg' },
  'detail-close': { objectPosition: '45% 55%', scale: 1.28, rotation: '-1deg' },
}

const cropOrder: CropProfileName[] = [
  'soft-left',
  'soft-right',
  'center-zoom',
  'top-band',
  'detail-close',
]

const focalPosition = {
  center: '50% 50%',
  top: '50% 28%',
  bottom: '50% 72%',
  left: '35% 50%',
  right: '65% 50%',
} as const

// ─── Slug helpers ──────────────────────────────────────────────

/**
 * Konverterer fri tekst til kebab-case (uden æøå).
 * Matcher konventionen i scripts/import-guides.ts.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    // Accent-normalisering (é→e, ñ→n): 'Café au Lait' og 'Jalapeño'
    // skal matche filnavne uden accenter. æøå håndteres FØR NFD,
    // da å ellers dekomponeres til 'a' i stedet for 'aa'.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Asset-convention paths pr. rolle.
 *
 * VIGTIGT: variety-roller (seed-card, plant-card, variety-hero) bygger
 * KUN fra varietySlug. species-hero bygger KUN fra speciesSlug.
 * Ingen cross-role candidates — der ville være "forkert billede".
 *
 * macro returnerer altid [] — makros må kun komme fra
 * POTALOT_IMAGE_SETS_BY_ID.
 */
function conventionPaths(
  role: PotalotImageRole,
  speciesSlug: string | null | undefined,
  varietySlug: string | null | undefined,
): string[] {
  switch (role) {
    case 'seed-card':
      // Dækker SEMANTISK alle indkøbskort: frø, knolde, løg, sætteløg,
      // stiklinger og lignende propagation-materiale. Mappen hedder
      // historisk "frokort" — vi indfører ikke separate bulb-card- eller
      // tuber-card-mapper.
      if (!varietySlug) return []
      return [
        `/images/frokort/${varietySlug}.png`, // png er primær (transparens)
        `/images/frokort/${varietySlug}.jpg`,
      ]
    case 'plant-card':
    case 'variety-hero':
      if (!varietySlug) return []
      return [
        `/images/plantekort/${varietySlug}.jpg`,
        `/images/plantekort/${varietySlug}.png`,
      ]
    case 'species-hero':
      if (!speciesSlug) return []
      return [
        `/images/arts/${speciesSlug}.jpg`,
        `/images/arts/${speciesSlug}.png`,
      ]
    case 'macro':
      // ingen asset-convention for macro — pr. Annas regel
      return []
  }
}

/**
 * Hent den asset der svarer til rollen i et PotalotImageSet.
 * Returnerer undefined hvis rollen ikke er udfyldt på sættet.
 */
function setAssetForRole(
  set: PotalotImageSet,
  role: PotalotImageRole,
): { src: string; alt: string } | undefined {
  switch (role) {
    case 'seed-card':     return set.seedCard
    case 'plant-card':    return set.plantCard
    case 'species-hero':  return set.speciesHero
    case 'variety-hero':  return set.varietyHero
    case 'macro':         return set.macro[0]  // første macro er default
  }
}


/**
 * Foretræk .webp-søster når den findes i manifestet. Filnavne — og dermed
 * DB-lagrede stier (7 inventory + 7 planter + 106 guides pr. audit 5/8) —
 * forbliver .png/.jpg; kun det serverede format opgraderes. Nye webp-filer
 * genereres som søskende og registreres via npm run scan:images.
 */
export function medWebpSibling(src: string): string {
  const webp = src.replace(/\.(png|jpe?g)$/i, '.webp')
  if (webp !== src && IMAGE_MANIFEST.has(webp)) return webp
  return src
}

// ─── Hoved-resolver ────────────────────────────────────────────

/**
 * Hovedfunktion. Returnerer altid en gyldig src — i værste fald
 * placeholder. source-feltet fortæller hvilket lag der vandt.
 */
export function resolvePotalotImage(
  input: PotalotImageInput,
): PotalotImageOutput {
  const { guideId, role, preferredSrc, speciesSlug, varietySlug } = input

  // ── 1. user-upload — brugerens explicit preferredSrc ───────
  if (preferredSrc) {
    const isExternal = /^https?:\/\//.test(preferredSrc)
    const isLocal = preferredSrc.startsWith('/images/')
    if (isExternal) {
      return {
        src: preferredSrc,
        alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
        type: role,
        source: 'user-upload',
      }
    }
    if (isLocal && IMAGE_MANIFEST.has(preferredSrc)) {
      return {
        src: medWebpSibling(preferredSrc),
        alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
        type: role,
        source: 'user-upload',
      }
    }
    // Lokal sti der ikke findes (stale DB-data, fantasi-path) →
    // fortsæt til de andre lag. Returnerer aldrig brudt sti.
  }

  // ── 2. POTALOT_IMAGE_SETS_BY_ID entry ──────────────────────
  // Søg på guideId først, derefter på varietySlug, derefter speciesSlug
  // — men kun til at finde SET'ET; rolle-opslaget er stadig strikt.
  const candidateIds = uniqueCompact([
    guideId,
    role !== 'species-hero' ? varietySlug : null,
    role === 'species-hero' ? speciesSlug : null,
  ])

  for (const id of candidateIds) {
    const set = POTALOT_IMAGE_SETS_BY_ID[id]
    if (!set) continue
    const asset = setAssetForRole(set, role)
    if (asset && IMAGE_MANIFEST.has(asset.src)) {
      return {
        src: medWebpSibling(asset.src),
        alt: asset.alt,
        type: role,
        source: 'guide-images',
      }
    }
  }

  // ── 2b. imported-guide fallback (kun for variety/species hero) ─
  // Importerede guiders primaryImageId — via det SLANKE generede indeks
  // (guide-image-index.generated.ts, 8 kB), IKKE guides-imported.ts
  // (775 kB): resolveren lever i klient-bundlen, og datasættet kostede
  // en 656 kB-chunk på fire hovedruter (JS-audit 5/8).
  if (
    guideId &&
    (role === 'variety-hero' || role === 'species-hero' || role === 'plant-card')
  ) {
    const indexed = GUIDE_IMAGE_INDEX[guideId]
    if (indexed && IMAGE_MANIFEST.has(indexed[0])) {
      return {
        src: medWebpSibling(indexed[0]),
        alt: indexed[1],
        type: role,
        source: 'guide-images',
      }
    }
  }

  // ── 3. asset-convention ────────────────────────────────────
  const paths = conventionPaths(role, speciesSlug, varietySlug)
  for (const path of paths) {
    if (IMAGE_MANIFEST.has(path)) {
      return {
        src: medWebpSibling(path),
        alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
        type: role,
        source: 'asset-convention',
      }
    }
  }

  // ── 4. fallback — neutral placeholder ──────────────────────
  return {
    src: PLACEHOLDER_SRC,
    alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
    type: role,
    source: 'fallback',
  }
}

/**
 * Sortens slug-kandidater — navn+sort, i den rækkefølge de skal prøves.
 *
 * Apostroffer staves på TO måder i billedbiblioteket, fordi filerne er
 * produceret ad to veje: slugify laver "burpee's" → "burpee-s"
 * (/images/frokort/roedbede-burpee-s-golden.png), mens de håndnavngivne
 * guide-id'er dropper apostroffen helt ("Gardener's Delight" →
 * tomat-gardeners-delight). Begge stavemåder ligger på disken.
 *
 * Prøver vi kun den ene, finder en frøpost aldrig det frøkort Potalot
 * FAKTISK har — det var præcis dét "Tomat · Gardener's Delight" ramte.
 * Rækkefølgen er låst: slugify først (uændret adfærd), apostrof-fri
 * variant, og til sidst sortens kanoniske alias. Alle tre peger på SAMME
 * sort — kun stavemåden er forskellig — så reglen "ingen fald til
 * beslægtet sort" holder. Aliasserne er eksplicit verificeret pr. sort
 * (sorts-alias.ts); der er bevidst ingen generel F1-afkortning.
 *
 * ARTSDELEN staves også på flere måder, og af samme grund: brugeren skriver
 * "Bønner", Potalots bibliotek hedder "Bønne", og frøkortet er navngivet
 * efter VÆKSTTYPEN ("stangboenne-cobra"). De to sidste kandidater dækker
 * det — men kun med dækning i artsmodellen: artssluggen kommer fra et
 * eksplicit artsalias, og typesluggen kun når typen er kendt (brugeren skrev
 * den, eller sorten er verificeret). En pose der bare siger "Bønner" med en
 * ukendt sort får ALDRIG en typekandidat — der findes ingen optimistisk
 * antagelse om, at en bønne er en stangbønne. Se arts-model.ts.
 */
function sortsSlugKandidater(
  name: string,
  variety: string | null | undefined,
): string[] {
  if (!variety) return []
  const raa = `${name}-${variety}`
  // Kanonisk sortsalias til SIDST: eksakt stavemåde vinder altid, og
  // aliasset er kun en ekstra kandidat for de sorter hvor synonymet er
  // eksplicit verificeret (se sorts-alias.ts). Ingen generel F1-regel.
  const kanonisk = kanoniskSortsSlug(name, variety)
  const artSlug = kanoniskArtsSlug(name)
  const typeSlug = typeSlugForPose(name, variety)
  return uniqueCompact([
    slugify(raa),
    slugify(raa.replace(/['\u2018\u2019]/g, '')),
    `${slugify(name)}-${kanonisk}`,
    `${artSlug}-${kanonisk}`,
    typeSlug ? `${typeSlug}-${kanonisk}` : null,
  ])
}

/**
 * Resolver en sorts-rolle (seed-card / plant-card) på tværs af sortens
 * slug-stavemåder. Første kandidat der giver et RIGTIGT billede vinder;
 * findes intet, returneres fallback for den kanoniske slug (så alt-tekst
 * og src er uændrede i forhold til før).
 */
function resolveSortsRolle(
  role: PotalotImageRole,
  input: {
    guideId?: string | null
    name: string
    variety?: string | null
    preferredSrc?: string | null
  },
): PotalotImageOutput {
  const kandidater = sortsSlugKandidater(input.name, input.variety)
  const slugs: (string | null)[] = kandidater.length > 0 ? kandidater : [null]

  let foersteFallback: PotalotImageOutput | null = null
  for (const varietySlug of slugs) {
    const ud = resolvePotalotImage({
      guideId: input.guideId ?? undefined,
      varietySlug,
      role,
      preferredSrc: input.preferredSrc ?? undefined,
    })
    if (ud.source !== 'fallback') return ud
    foersteFallback ??= ud
  }
  return foersteFallback!
}

/**
 * resolveSeedCard — bekvemmeligheds-wrapper der bygger varietySlug af
 * navn+sort (præcis samme regel som frøbank-kortet) og resolver seed-
 * card-billedet. Samler slug-logikken ét sted, så frøbank-kort, frø-
 * detalje og harKurateretFroekort er garanteret enige.
 *
 * Prioritet (fra resolvePotalotImage): brugerens eget foto (preferredSrc)
 * → kurateret frøkort → asset-convention → placeholder.
 *
 * Opslaget sker ALTID på navn+sort — aldrig på hvad der lå gemt i
 * databasen da posen blev oprettet. Derfor finder en gammel frøpost
 * automatisk et frøkort Potalot først har fået BAGEFTER, uden at der
 * skrives noget som helst.
 */
export function resolveSeedCard(input: {
  guideId?: string | null
  name: string
  variety?: string | null
  preferredSrc?: string | null
}): PotalotImageOutput {
  return resolveSortsRolle('seed-card', input)
}

/**
 * resolvePlantCard — bekvem indgang for aktive planter (plant-card-rolle).
 * Bygger varietySlug fra navn+sort som resolveSeedCard. Returnerer hele
 * PotalotImageOutput, så kaldere kan tjekke `source` (fx springe fallback over).
 */
export function resolvePlantCard(input: {
  guideId?: string | null
  name: string
  variety?: string | null
  preferredSrc?: string | null
}): PotalotImageOutput {
  return resolveSortsRolle('plant-card', input)
}

/**
 * harKurateretFroekort — findes der et FÆRDIGT, kurateret frøkort
 * (seed-card) for dette frø, uafhængigt af brugerens eget upload?
 *
 * Bruges ved shoplink- og scan-import: når vi HAR et komponeret frøkort
 * for sorten, skal det være forsidefotoet. Så undlader vi at gøre det
 * skrabede/scannede foto til primært — ellers ville det vinde over
 * frøkortet i resolverens lag 1 (user-upload). Brugeren kan altid
 * uploade egne fotos og aktivt gøre dem til primære bagefter.
 *
 * Spørger UDEN preferredSrc, så svaret er GARANTERET identisk med det
 * frøkort der ellers ville blive vist.
 */
export function harKurateretFroekort(input: {
  guideId?: string | null
  name: string
  variety?: string | null
}): boolean {
  const { source } = resolveSeedCard(input)
  return source === 'guide-images' || source === 'asset-convention'
}

// ─── Makro-resolver med intelligent slot-selektion ─────────────

/**
 * resolvePotalotMacro — intelligent makro-vælger.
 *
 * Bruges på sider hvor flere makros skal vises på samme tid (fact-
 * blok, Vidste du, Potalot-tip). Hver kalder passer et unikt `slot`
 * + et avoidSrcs-set så samme makro ikke bruges flere gange.
 *
 * Returnerer altid en PotalotMacroOutput hvis der findes mindst én
 * makro i sættet — ellers null. Consumeren skal håndtere null
 * (typisk ved at skjule den dekorative makro-baggrund).
 */
export function resolvePotalotMacro(
  input: PotalotMacroInput,
): PotalotMacroOutput | null {
  const { guideId, varietySlug, speciesSlug, slot, preferredRoles, avoidSrcs, cropProfile } = input

  const candidateIds = uniqueCompact([guideId, varietySlug, speciesSlug])
  let macros: MacroImage[] = []
  for (const id of candidateIds) {
    const set = POTALOT_IMAGE_SETS_BY_ID[id]
    if (set?.macro && set.macro.length > 0) {
      macros = set.macro
      break
    }
  }
  if (macros.length === 0) return null

  const usable = macros.filter((m) => IMAGE_MANIFEST.has(m.src))
  if (usable.length === 0) return null

  // Foretrukne roller (fx ['atmosphere'] for baggrundsbruge,
  // ['fruit', 'structure'] for tekniske brug)
  const byRole: MacroImage[] =
    preferredRoles && preferredRoles.length > 0
      ? usable.filter((m) => preferredRoles.includes(m.role))
      : []
  const preferred = byRole.length > 0 ? byRole : usable

  // Undgå allerede brugte makros hvis muligt. Callers bygger typisk
  // avoidSrcs af tidligere outputs, som er webp-opgraderede
  // (medWebpSibling) — macro-listens srcs er rå .jpg/.png. Sammenlign
  // derfor begge former, ellers matcher filteret aldrig.
  const notAvoided = preferred.filter(
    (m) => !avoidSrcs?.has(m.src) && !avoidSrcs?.has(medWebpSibling(m.src)),
  )
  const pool = notAvoided.length > 0 ? notAvoided : preferred

  const seed = `${candidateIds.join(':')}:${slot}`
  const macro = pool[deterministicIndex(seed, pool.length)]
  const profileName =
    cropProfile ?? cropOrder[deterministicIndex(`${seed}:${macro.src}:crop`, cropOrder.length)]
  const profile = cropProfiles[profileName]

  return {
    src: medWebpSibling(macro.src),
    alt: macro.alt,
    type: 'macro',
    source: 'guide-images',
    role: macro.role,
    objectPosition: macro.focalPoint ? focalPosition[macro.focalPoint] : profile.objectPosition,
    cropProfile: profileName,
    scale: profile.scale,
    rotation: profile.rotation,
  }
}

// ─── Util ──────────────────────────────────────────────────────

function uniqueCompact(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    if (!v) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

function deterministicIndex(seed: string, length: number): number {
  if (length <= 1) return 0
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % length
}

