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
  /**
   * Brugerens egne sorter med ægte foto (upload/kurateret frøkort/plantekort,
   * ALDRIG cross-sort). Bruges til at forankre frøavl-forslaget i den konkrete
   * plante — så "Prøv frøavl" bliver et foto-kort, ikke en tom tekstflade.
   */
  egneSorter?: Array<{ art: string; billede: string | null }>
  /**
   * artKey → frøavls-guide-id. Frøavl er en LÆRINGShandling ("hvordan gemmer
   * jeg frø fra denne plante?"), så leadet skal føre til en frøavls-guide før
   * en sort/arts-guide. Tom indtil frøavls-guides skrives (så falder den til
   * sort→arts→frøbank). Se backlog.
   */
  froeavlGuide?: Record<string, string>
  /** artKey → arts-/species-guide-id (fx "tomat"), fallback-niveau for href. */
  artGuide?: Record<string, string>
}

/**
 * Lead-egnet kandidat (har foto → kan vises som hovedforslag på kort 1 ELLER
 * som lille klikbart forslag). Klienten roterer deterministisk gennem listen.
 */
export interface LeadKandidat {
  /** Lang titel (Cormorant) når kandidaten er hovedforslag. */
  navn: string
  /** Brødtekst når kandidaten er hovedforslag. */
  begrundelse: string
  /** Foto (påkrævet — derfor "lead-egnet"). */
  billede: string
  /** Kort toplinje når kandidaten er lille forslag. */
  titel: string
  /** Regel-baseret kort kvalitet (bundlinje, 2-4 ord). */
  undertitel: string
  /** Sortens guide (/guides/[id]) ELLER frøbank som fallback. */
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
  // ── Små-format-felter pr. kandidat ──
  /** Sort/art-navn (toplinje). */
  titel?: string
  /** Regel-baseret kort kvalitet (bundlinje, 2-4 ord). */
  undertitel?: string
  /** Guide-id → href; null → frøbank. */
  slug?: string | null
  /** Regel-nøgle (forlaeng/hul/froeavl/robusthed/koekken). */
  type?: string
  // ── Kun på det komponerede resultat ──
  /** Lead-egnede kandidater (foto) — klienten roterer gennem dem. */
  kandidater?: LeadKandidat[]
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
 * Foto til et handlings-/tema-forslag (frøavl, køkken): forankr det i den
 * art, forslaget er afledt af — ikke et generisk ikon. Prioritet:
 *   1 brugerens egen sort m. ægte foto (upload/kurateret kort, ingen cross-sort)
 *   2 brugerens egen guide-sort af arten (m. foto)
 *   3 enhver katalog-sort af arten (m. foto). Slug følger fotoets sort.
 * Intet foto → { null, null } (forslaget er da ikke lead-egnet; kort 1 gates).
 */
function artFoto(
  art: string,
  egneSorter: NonNullable<ProevInput['egneSorter']>,
  egne: KatalogSort[],
  katalog: KatalogSort[],
): { billede: string | null; slug: string | null } {
  const k = artKey(art)
  const eget = egneSorter.find(s => artKey(s.art) === k && s.billede)
  if (eget) return { billede: eget.billede!, slug: null } // eget foto → frøbank-href
  const egen = egne.find(s => artKey(s.art) === k && s.billede)
  if (egen) return { billede: egen.billede!, slug: egen.id ?? null }
  const enhver = katalog.find(s => artKey(s.art) === k && s.billede)
  if (enhver) return { billede: enhver.billede!, slug: enhver.id ?? null }
  return { billede: null, slug: null }
}

/**
 * Kør reglerne og saml alle forslag der har ægte grundlag, i prioriteret
 * rækkefølge (dedup på art+regel). Første = lead; andet distinkte = sekundært.
 */
function samlForslag(input: ProevInput): ProevForslag[] {
  const { dyrkede, katalog, hoestPrArt } = input
  const egneSorter = input.egneSorter ?? []
  const froeavlGuide = input.froeavlGuide ?? {}
  const artGuide = input.artGuide ?? {}
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
    // Vis brugerens egne ord for arten (ikke ascii-normaliseret "stangboenne").
    const artNavn = dyrkede.find(d => artKey(d.art) === froeArt)?.art ?? froeArt
    const foto = artFoto(froeArt, egneSorter, egneKatalog, katalog) // A: forankr i planten
    // Frøavl = læringshandling → href-prioritet: frøavls-guide → sort-guide →
    // artsguide → frøbank (fallback). Brugeren skal lære at gemme frø, ikke
    // bare sendes til samlingen.
    const sortGuide = egneKatalog.find(k => artKey(k.art) === froeArt)?.id ?? null
    const froeavlSlug = froeavlGuide[froeArt] ?? sortGuide ?? artGuide[froeArt] ?? null
    push(`froeavl|${froeArt}`, {
      navn: 'Prøv frøavl',
      begrundelse: `Du dyrker ${artNavn.toLowerCase()} — måske er det tid til at gemme dine egne frø til næste sæson.`,
      billede: foto.billede,
      reason: `frøavl: ${froeArt}`,
      titel: capitalize(artNavn),
      undertitel: 'Gem egne frø',
      slug: froeavlSlug,
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
    const foto = artFoto(makker, egneSorter, egneKatalog, katalog) // A: foto af makker-arten
    push(`koekken|${topArt[0]}`, {
      navn: capitalize(makker),
      begrundelse: `Du høster meget ${topArt[0]}. ${capitalize(makker)} passer godt til og gør bedet mere brugbart i køkkenet.`,
      billede: foto.billede,
      reason: `køkken: ${topArt[1]}× ${topArt[0]} → ${makker}`,
      titel: capitalize(makker),
      undertitel: 'God makker',
      slug: foto.slug,
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
  const alle = samlForslag(input)
  if (alle.length === 0) return null

  const harLeadForm = (k: ProevForslag) => !!(k.billede && k.titel && k.undertitel)

  // Lead-egnede kandidater = dem med foto (kortet viser foto-højre-split).
  // Klienten roterer gennem dem ét ad gangen; de øvrige bliver små forslag.
  // Href → sortens guide, ellers frøbank. Ingen døde links.
  const seenFoto = new Set<string>()
  const kandidater: LeadKandidat[] = alle
    .filter(harLeadForm)
    .filter(k => {
      // To regler kan låne samme foto (fx frøavl + robusthed fra samme art) —
      // vis hvert foto kun én gang i rotationen (højeste prioritet vinder).
      if (seenFoto.has(k.billede!)) return false
      seenFoto.add(k.billede!)
      return true
    })
    .map(k => ({
      navn: k.navn,
      begrundelse: k.begrundelse,
      billede: k.billede!,
      titel: k.titel!,
      undertitel: k.undertitel!,
      href: k.slug ? `/guides/${k.slug}` : '/froebank',
    }))

  // B: intet foto-bærende lead-forslag → skjul kort 1 (ingen stor tekst-only
  // fallback, ingen tom højreside).
  if (kandidater.length === 0) return null

  // Lead = første lead-egnede (= kandidater[0]s kilde).
  const lead = alle.find(harLeadForm)!
  // Sekundært (kort 2) = første kandidat der IKKE er lead → ingen dublet.
  const sek = alle.find(k => k !== lead)

  return {
    ...lead,
    kandidater,
    sekundaer: sek
      ? { kicker: 'Måske du også vil prøve', titel: sek.navn, tekst: sek.begrundelse }
      : undefined,
  }
}
