/**
 * "Prøv næste år"-motoren (Fase C, 9. juli 2026) — Havebogens fremadblik.
 *
 * Sammenligner brugerens egne sorter/arter (frøbank + planter) + høstlogs
 * med guide-kataloget og finder ÉN konkret ting at prøve næste sæson. Ikke
 * reklame, ikke katalog, ikke generisk inspiration — en redaktionel
 * anbefaling baseret på brugerens egen have.
 *
 * Prioritet (Annas spec):
 *   1 forlæng sæsonen · 2 udfyld hul i sortiment · 3 frøavl ·
 *   4 robusthed · 5 køkken/høst · 6 fallback (skjul for indlogget).
 *
 * Kun ægte data. Ingen fabrikerede tal, ingen døde links (et sort-forslag
 * peger kun på en sort, der findes i kataloget). Ren funktion — testet i
 * scripts/test-proev-naeste-aar.ts.
 */

export interface KatalogSort {
  art: string
  variety: string
  tags: string[]
  harvestMonths: number[]
  difficulty?: string | null
  billede?: string | null
  /** Guide-id (→ /guides/[id]) for det klikbare små-forslag. */
  id?: string | null
}

export interface ProevInput {
  /** Arter+sorter brugeren dyrker (frøbank + ikke-arkiverede planter). */
  dyrkede: Array<{ art: string; variety: string | null }>
  /** Tilgængelige sort-guider at anbefale fra. */
  katalog: KatalogSort[]
  /** Antal høst-logs pr. art i sæsonen. */
  hoestPrArt: Record<string, number>
}

/** Lille klikbart forslag (top=sort/art, bund=regel-baseret kvalitet). */
export interface SmaaForslag {
  top: string
  bund: string
  foto: string
  href: string
}

/** InspirerForslag-formen motoren fylder (uden at importere UI-typen). */
export interface ProevForslag {
  kicker: string
  navn: string
  begrundelse: string
  billede?: string | null
  sekundaer?: { kicker: string; titel: string; tekst: string }
  /** intern — hvilken regel valgte forslaget. ALDRIG i UI. */
  reason: string
  // ── Små-format-felter pr. kandidat (til de klikbare små forslag) ──
  /** Sort/art-navn (toplinje). */
  titel?: string
  /** Regel-baseret kort kvalitet (bundlinje, 2-4 ord). */
  undertitel?: string
  /** Guide-id → href; null → frøbank. */
  slug?: string | null
  /** Regel-nøgle (forlaeng/hul/froeavl/robusthed/koekken). */
  type?: string
  // ── Kun på det komponerede resultat ──
  /** Max 2 ægte små forslag (kun kandidater der har foto). */
  forslag?: SmaaForslag[]
}

// ── Ordforråd (tags) ──────────────────────────────────────────
const TYPE_TAGS = ['cherry', 'cocktail', 'salat', 'bøf', 'pasta', 'snack', 'mini', 'kæmpe', 'snitblomst']
const TIDLIG_TAGS = ['tidlig', 'tidligt']
const SEN_TAGS = ['sen', 'sildig', 'eftersommer']
const HAARDFOR_TAGS = ['hårdfør', 'robust', 'nem', 'nøjsom']
const FROEAVL_ARTER = new Set(['tomat', 'chili', 'peberfrugt', 'boenne', 'stangboenne', 'aert', 'sukkeraert', 'salat', 'agurk', 'graeskar'])
const FROEAVL_TAGS = ['frøægte', 'arvesort', 'open pollinated']

// Køkken-makkere (hortikulturelt/kulinarisk fornuftige naboer).
const KOEKKEN_MAKKER: Record<string, string> = {
  tomat: 'basilikum',
  agurk: 'dild',
  chili: 'koriander',
  peberfrugt: 'basilikum',
  jordbaer: 'mynte',
  kartoffel: 'persille',
}

function norm(s: string): string {
  return s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').trim()
}
function artKey(s: string): string {
  return norm(s).split(/[\s-]/)[0]
}
function har(tags: string[], vocab: string[]): boolean {
  const n = tags.map(norm)
  return vocab.some(v => n.includes(norm(v)))
}
function sen(g: KatalogSort): boolean {
  if (har(g.tags, SEN_TAGS)) return true
  return g.harvestMonths.length > 0 && Math.max(...g.harvestMonths) >= 9
}
function tidlig(g: KatalogSort): boolean {
  if (har(g.tags, TIDLIG_TAGS)) return true
  return g.harvestMonths.length > 0 && Math.min(...g.harvestMonths) <= 7
}
function haardfoer(g: KatalogSort): boolean {
  return har(g.tags, HAARDFOR_TAGS) || norm(g.difficulty ?? '') === 'easy'
}
function typerAf(g: KatalogSort): string[] {
  return g.tags.map(norm).filter(t => TYPE_TAGS.map(norm).includes(t))
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Kør reglerne og saml alle forslag der har ægte grundlag, i prioriteret
 * rækkefølge (dedup på art+regel). Første = lead; andet distinkte = sekundært.
 */
function samlForslag(input: ProevInput): ProevForslag[] {
  const { dyrkede, katalog, hoestPrArt } = input
  const dyrkedeArter = new Set(dyrkede.map(d => artKey(d.art)))
  const dyrkedeSortKeys = new Set(
    dyrkede.filter(d => d.variety).map(d => `${artKey(d.art)}|${norm(d.variety!)}`),
  )
  const dyrkerSort = (art: string, variety: string) =>
    dyrkedeSortKeys.has(`${artKey(art)}|${norm(variety)}`)

  // Brugerens egne sorter slået op i kataloget (metadata).
  const egneKatalog = katalog.filter(k => dyrkerSort(k.art, k.variety))
  // Kandidater = katalog-sorter brugeren IKKE dyrker.
  const kandidater = katalog.filter(k => !dyrkerSort(k.art, k.variety))
  const soeskende = (art: string) =>
    kandidater.filter(k => artKey(k.art) === artKey(art))

  const ud: ProevForslag[] = []
  const seen = new Set<string>()
  const push = (regelKey: string, f: Omit<ProevForslag, 'kicker'>) => {
    if (seen.has(regelKey)) return
    seen.add(regelKey)
    ud.push({ kicker: 'Prøv næste år', ...f })
  }

  // 1 · Forlæng sæsonen — sen sort dyrket → foreslå tidlig søskende.
  for (const egen of egneKatalog) {
    if (!sen(egen)) continue
    const tidligSoesk = soeskende(egen.art).find(k => tidlig(k))
    if (!tidligSoesk) continue
    push(`forlaeng|${artKey(egen.art)}`, {
      navn: `Tidligere ${artKey(egen.art)} næste år`,
      begrundelse: `Du dyrker flere sene sorter. ${capitalize(tidligSoesk.variety)} modner tidligere og kan give dig høst før august.`,
      billede: tidligSoesk.billede ?? null,
      reason: `forlæng: sen ${egen.variety} → tidlig ${tidligSoesk.variety}`,
      titel: capitalize(tidligSoesk.variety),
      undertitel: 'Tidligere sort',
      slug: tidligSoesk.id ?? null,
      type: 'forlaeng',
    })
    break
  }

  // 2 · Udfyld hul — kun én type inden for en art → foreslå anden type.
  for (const art of dyrkedeArter) {
    const egne = egneKatalog.filter(k => artKey(k.art) === art)
    const typer = new Set(egne.flatMap(typerAf))
    if (egne.length === 0 || typer.size !== 1) continue
    const andenType = soeskende(art).find(k => {
      const t = typerAf(k)
      return t.length > 0 && !t.some(x => typer.has(x))
    })
    if (!andenType) continue
    const nyType = typerAf(andenType)[0]
    push(`hul|${art}`, {
      navn: `Prøv en ${nyType}`,
      begrundelse: `Du dyrker mest én slags ${art}. ${capitalize(andenType.variety)} giver ${art} med en anden smag og brug i køkkenet.`,
      billede: andenType.billede ?? null,
      reason: `hul: kun ${[...typer]} → ${nyType} (${andenType.variety})`,
      titel: capitalize(andenType.variety),
      undertitel: 'Anden type',
      slug: andenType.id ?? null,
      type: 'hul',
    })
    break
  }

  // 3 · Frøavl — dyrker en frøavls-egnet art/sort → foreslå at gemme frø.
  const froeArt = [...dyrkedeArter].find(a => FROEAVL_ARTER.has(a)) ??
    (egneKatalog.find(k => har(k.tags, FROEAVL_TAGS))?.art
      ? artKey(egneKatalog.find(k => har(k.tags, FROEAVL_TAGS))!.art)
      : undefined)
  if (froeArt) {
    push(`froeavl|${froeArt}`, {
      navn: 'Prøv frøavl',
      begrundelse: `Du dyrker ${froeArt} — måske er det tid til at gemme dine egne frø til næste sæson.`,
      reason: `frøavl: ${froeArt}`,
      titel: capitalize(froeArt),
      undertitel: 'Gem egne frø',
      slug: null,
      type: 'froeavl',
    })
  }

  // 4 · Robusthed — krævende sort dyrket → foreslå hårdfør søskende.
  for (const egen of egneKatalog) {
    if (haardfoer(egen)) continue
    if (norm(egen.difficulty ?? '') !== 'hard') continue
    const robust = soeskende(egen.art).find(k => haardfoer(k))
    if (!robust) continue
    push(`robust|${artKey(egen.art)}`, {
      navn: `En mere hårdfør ${artKey(egen.art)}`,
      begrundelse: `${capitalize(robust.variety)} er mere nøjsom og kan stå ved siden af dine favoritter med mindre pasning.`,
      billede: robust.billede ?? null,
      reason: `robusthed: ${egen.variety} (hard) → ${robust.variety}`,
      titel: capitalize(robust.variety),
      undertitel: 'Mere hårdfør',
      slug: robust.id ?? null,
      type: 'robusthed',
    })
    break
  }

  // 5 · Køkken/høst — meget af én afgrøde → foreslå en makker.
  const topArt = Object.entries(hoestPrArt)
    .map(([a, n]) => [artKey(a), n] as const)
    .filter(([a, n]) => n >= 3 && KOEKKEN_MAKKER[a] && !dyrkedeArter.has(KOEKKEN_MAKKER[a]))
    .sort((x, y) => y[1] - x[1])[0]
  if (topArt) {
    const makker = KOEKKEN_MAKKER[topArt[0]]
    push(`koekken|${topArt[0]}`, {
      navn: capitalize(makker),
      begrundelse: `Du høster meget ${topArt[0]}. ${capitalize(makker)} passer godt til og gør bedet mere brugbart i køkkenet.`,
      reason: `køkken: ${topArt[1]}× ${topArt[0]} → ${makker}`,
      titel: capitalize(makker),
      undertitel: 'God makker',
      slug: null,
      type: 'koekken',
    })
  }

  return ud
}

/**
 * Byg dagens "Prøv næste år"-forslag: ét lead + evt. ét sekundært.
 * Returnerer null hvis der ikke er ægte grundlag (skjul sektionen).
 */
export function byggProevNaesteAar(input: ProevInput): ProevForslag | null {
  const kandidater = samlForslag(input)
  if (kandidater.length === 0) return null
  const lead = kandidater[0]
  const sek = kandidater[1]

  // Små forslag = lavere-prioritets-kandidater MED foto (det låste kort viser
  // thumbnails). Max 2. Href → sortens guide, ellers frøbank. Ingen døde links.
  const smaa: SmaaForslag[] = kandidater
    .slice(2)
    .filter(k => k.billede && k.titel && k.undertitel)
    .slice(0, 2)
    .map(k => ({
      top: k.titel!,
      bund: k.undertitel!,
      foto: k.billede!,
      href: k.slug ? `/guides/${k.slug}` : '/froebank',
    }))

  return {
    ...lead,
    sekundaer: sek
      ? { kicker: 'Måske du også vil prøve', titel: sek.navn, tekst: sek.begrundelse }
      : undefined,
    forslag: smaa.length > 0 ? smaa : undefined,
  }
}
