/**
 * Forvandlinger — "Det kan haven blive til" (9. juli 2026).
 *
 * Havens output-univers: ikke kun mad, men alt haven kan blive til på tværs
 * af 8 kategorier. Et kurateret katalog + en selektor der vælger idéer på
 * tværs af kategorier ud fra brugerens afgrøder. Ren funktion, ingen DB.
 *
 * Sikkerhed (plej/olie/salve): kun kosmetisk/sanselig brug, ALDRIG medicinske
 * løfter eller sygdomsbehandling. safetyNote bæres med og vises neutralt.
 */

export type ForvandlingKategori =
  | 'spis' | 'gem' | 'toer' | 'bryg' | 'duft' | 'plej' | 'pynt' | 'saa-igen' | 'natur'

export interface HavebogForvandling {
  id: string
  title: string
  category: ForvandlingKategori
  /** Normaliserede afgrøde-nøgler (ingen æøå). */
  crops: string[]
  /** Kort "hvorfor nu". */
  body: string
  steps: string[]
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  safetyNote?: string
}

export const KATEGORI_LABEL: Record<ForvandlingKategori, string> = {
  spis: 'Spis', gem: 'Gem', toer: 'Tør', bryg: 'Bryg',
  duft: 'Duft', plej: 'Plej', pynt: 'Pynt', 'saa-igen': 'Så igen',
  natur: 'Natur',
}

// Hver kategori sin accent — giver mosaikken variation OG signalerer type.
export const KATEGORI_FARVE: Record<ForvandlingKategori, string> = {
  spis: '#B85A3D',      // terracotta
  gem: '#9A6A3E',       // syltet amber
  toer: '#8B9774',      // salvie
  bryg: '#A9803E',      // brygget rav
  duft: '#7E6480',      // lavendel/blomme
  plej: '#6F7E55',      // urtegrøn
  pynt: '#C36F7C',      // blomsterrosa
  'saa-igen': '#5E7052', // frøgrøn
  natur: '#6F5D42',      // varmt træ/bambus (haven som levende sted)
}

const KOSMETISK_NOTE = 'Kun til kosmetisk brug — ingen medicinske løfter. Test altid på et lille hudområde først.'

export const FORVANDLINGER: HavebogForvandling[] = [
  // ── Spis ──
  { id: 'gazpacho', title: 'Gazpacho', category: 'spis', crops: ['tomat', 'agurk', 'basilikum'], body: 'Tomaterne og agurkerne fylder i kurven lige nu.', steps: ['Blend tomater, agurk og lidt basilikum.', 'Smag til med salt, olie og syre.', 'Køl ned og spis koldt.'], season: 'summer' },
  { id: 'tomatsalat', title: 'Tomatsalat', category: 'spis', crops: ['tomat', 'basilikum'], body: 'Modne tomater smager bedst lige plukket.', steps: ['Skær tomater i både.', 'Riv basilikum over.', 'Dryp med god olie og lidt salt.'], season: 'summer' },
  { id: 'jordbaertaerte', title: 'Jordbærtærte', category: 'spis', crops: ['jordbaer'], body: 'Jordbærrene er søde og fylder i kurven nu.', steps: ['Bag en sprød bund.', 'Fyld med creme og friske jordbær.', 'Køl af før servering.'], season: 'summer' },
  { id: 'agurkesalat', title: 'Agurkesalat', category: 'spis', crops: ['agurk'], body: 'Frisk agurk er kølig og sprød i sommervarmen.', steps: ['Skær agurk i tynde skiver.', 'Vend med eddike, sukker og salt.', 'Lad trække en halv time.'], season: 'summer' },
  { id: 'jordbaersorbet', title: 'Jordbærsorbet', category: 'spis', crops: ['jordbaer'], body: 'De bløde bær kan blive til noget koldt, sødt og ret kortlivet.', steps: ['Blend jordbær med lidt sukker og citron.', 'Frys massen, og rør rundt et par gange undervejs.', 'Spis den, mens den stadig er blød.'], season: 'summer' },
  { id: 'basilikumpesto', title: 'Basilikumpesto', category: 'spis', crops: ['basilikum'], body: 'Klip basilikum før planten går i blomst.', steps: ['Blend basilikum, nødder, ost og olie.', 'Smag til med salt og citron.', 'Brug straks eller frys i portioner.'] },
  { id: 'guleroedskage', title: 'Gulerodskage', category: 'spis', crops: ['gulerod'], body: 'Når høsten bliver større end behovet til aftensmaden, kan du rive gulerødderne ind i en krydret og saftig kage.', steps: ['Riv gulerødderne fint.', 'Rør dem i en krydret kagedej, og bag kagen gylden.', 'Lad kagen køle af, og top den eventuelt med flødeostecreme.'], season: 'autumn' },
  { id: 'ovnbagte-guleroedder', title: 'Ovnbagte gulerødder', category: 'spis', crops: ['gulerod'], body: 'Gulerødderne bliver sødere og mere intense, når du bager dem, til kanterne karamelliserer.', steps: ['Skrub gulerødderne, og halvér de største.', 'Vend dem med olie, salt og peber.', 'Bag dem møre og let karamelliserede.'], season: 'autumn' },
  { id: 'glaserede-guleroedder', title: 'Glaserede gulerødder', category: 'spis', crops: ['gulerod'], body: 'Smør og lidt sødme giver gulerødderne en blank glasering og lader dem fylde mere på tallerkenen.', steps: ['Kog eller bag gulerødderne, til de næsten er møre.', 'Vend dem med smør og lidt honning.', 'Varm dem videre, til glaseringen lægger sig blankt omkring dem.'], season: 'autumn' },
  // ── Gem ──
  { id: 'syltede-agurker', title: 'Syltede agurker', category: 'gem', crops: ['agurk'], body: 'Har du flere agurker, end du kan spise nu?', steps: ['Skær agurk i skiver.', 'Kog en lage af eddike, sukker og krydderier.', 'Hæld over og lad trække på køl.'], season: 'summer' },
  { id: 'tomatsauce', title: 'Tomatsauce på glas', category: 'gem', crops: ['tomat'], body: 'Gem sommerens tomater til vinterens retter.', steps: ['Kog tomater ind med hvidløg og urter.', 'Fyld på skoldede glas.', 'Opbevar køligt og mørkt.'], season: 'summer' },
  { id: 'frys-jordbaer', title: 'Frys jordbær', category: 'gem', crops: ['jordbaer'], body: 'Frys de overskydende bær, mens de er friske.', steps: ['Skyl og nip bærrene.', 'Frys dem enkeltvis på en bakke.', 'Saml i pose, når de er faste.'] },
  { id: 'toerrede-chilier', title: 'Tørrede chilier', category: 'gem', crops: ['chili'], body: 'Modne chilier kan gemmes hele vinteren.', steps: ['Træd en snor gennem stilkene.', 'Hæng dem luftigt og mørkt.', 'Knus eller brug hele efter behov.'], season: 'autumn' },
  { id: 'syltede-guleroedder', title: 'Syltede gulerødder', category: 'gem', crops: ['gulerod'], body: 'En syrlig lage holder på høsten og giver sprøde gulerødder, som du kan hente frem til vinterens måltider.', steps: ['Skær gulerødderne i stave eller skiver.', 'Pak dem i rene glas, og hæld varm syltelage over.', 'Lad dem trække på køl, før du åbner glasset.'], season: 'autumn' },
  // ── Tør ──
  { id: 'toer-basilikum', title: 'Tør basilikum', category: 'toer', crops: ['basilikum'], body: 'Klip før planten bliver træt eller går i blomst.', steps: ['Klip rene skud.', 'Tør dem luftigt eller ved lav varme.', 'Gem bladene mørkt og tørt.'] },
  { id: 'toer-mynte', title: 'Tør mynte', category: 'toer', crops: ['mynte'], body: 'Mynte tørrer let og holder smagen til te.', steps: ['Klip friske skud.', 'Bind små bundter og hæng dem.', 'Smuldr de tørre blade på glas.'] },
  { id: 'lavendelbundter', title: 'Lavendelbundter', category: 'toer', crops: ['lavendel'], body: 'Klip lavendlen, når den lige er sprunget ud.', steps: ['Bind små bundter.', 'Hæng dem mørkt og luftigt.', 'Brug tørret til duft eller pynt.'], season: 'summer' },
  // ── Bryg ──
  { id: 'mynte-te', title: 'Mynte-te', category: 'bryg', crops: ['mynte'], body: 'Et par friske skud giver en rolig kop.', steps: ['Skyl en håndfuld mynte.', 'Overhæld med kogende vand.', 'Lad trække 5 minutter.'] },
  { id: 'kamille-te', title: 'Kamille-te', category: 'bryg', crops: ['kamille'], body: 'Pluk blomsterne, når de er helt åbne.', steps: ['Tør blomsterne luftigt.', 'Overhæld en teskefuld med varmt vand.', 'Lad trække og si fra.'] },
  { id: 'ribs-sirup', title: 'Ribs-sirup', category: 'bryg', crops: ['ribs'], body: 'Ribsene er modne og syrlige lige nu.', steps: ['Kog ribs med vand og sukker.', 'Si saften fra.', 'Fyld på flaske og opbevar køligt.'], season: 'summer' },
  { id: 'guleroedsjuice', title: 'Gulerodsjuice', category: 'bryg', crops: ['gulerod'], body: 'Saftige gulerødder kan blive til en frisk juice, når du vil bruge en større del af høsten med det samme.', steps: ['Vask gulerødderne, og skær dem i mindre stykker.', 'Pres dem i en juicer, eller blend dem med lidt vand og si juicen.', 'Smag eventuelt til med citron eller ingefær, og drik den straks.'], season: 'autumn' },
  // ── Duft ──
  { id: 'lavendelpotpourri', title: 'Lavendelpotpourri', category: 'duft', crops: ['lavendel'], body: 'Klip blomsterne, når de dufter mest.', steps: ['Bind små bundter.', 'Hæng dem mørkt og luftigt.', 'Brug de tørrede blomster i en skål eller lille pose.'], season: 'summer' },
  { id: 'duftpose', title: 'Duftpose til skuffen', category: 'duft', crops: ['lavendel'], body: 'Tørret lavendel holder tøjet friskt længe.', steps: ['Tør lavendelblomster helt.', 'Fyld en lille stofpose.', 'Læg den i skuffen eller skabet.'] },
  { id: 'lavendelposer', title: 'Lavendelposer', category: 'duft', crops: ['lavendel'], body: 'Blomsterne kan få et stille liv i skuffer, skabe og sengetøj.', steps: ['Tør lavendelblomsterne helt.', 'Fyld dem i små stofposer.', 'Læg poserne i skuffer, skabe eller sengetøj.'], season: 'summer' },
  // ── Plej ──
  { id: 'lavendelolie', title: 'Lavendelolie', category: 'plej', crops: ['lavendel'], body: 'En blid, duftende olie til huden.', steps: ['Fyld et glas med tørrede lavendelblomster.', 'Dæk med en mild olie.', 'Lad trække lyst i et par uger, og si fra.'], safetyNote: KOSMETISK_NOTE },
  { id: 'morgenfrue-salve', title: 'Morgenfruesalve', category: 'plej', crops: ['morgenfrue'], body: 'Morgenfruens kronblade giver en blød salve.', steps: ['Træk kronblade i olie.', 'Si fra og varm forsigtigt med lidt bivoks.', 'Hæld i små glas og lad stivne.'], safetyNote: KOSMETISK_NOTE },
  // ── Pynt ──
  { id: 'dahlia-vase', title: 'Dahlia i vase', category: 'pynt', crops: ['dahlia'], body: 'Dahliaerne blomstrer og vil gerne indenfor.', steps: ['Klip tidligt om morgenen.', 'Skær stilken skråt.', 'Skift vand hver anden dag.'], season: 'summer' },
  { id: 'spiselige-blomster', title: 'Spiselige blomster', category: 'pynt', crops: ['morgenfrue', 'tallerkensmaekker'], body: 'Nogle blomster pynter både tallerken og kage.', steps: ['Pluk friske, rene blomster.', 'Dryp dem forsigtigt tørre.', 'Læg dem på salat, kage eller i isterninger.'], season: 'summer' },
  // P0b fra forvandlinger-copy-specen (Docs/product/forvandlinger-copy-
  // inspiration.md) — body-sætningen er Annas valgte og LÅST.
  { id: 'pynt-til-drikke', title: 'Pynt til drikke', category: 'pynt', crops: ['mynte', 'jordbaer', 'agurk', 'morgenfrue'], body: 'Forskøn vand, drinks og cocktails med frugt, blomster og krydderurter fra haven.', steps: ['Pluk og skyl bær, blade og blomster.', 'Frys dem eventuelt i isterninger.', 'Læg dem i glasset lige før servering.'], season: 'summer' },
  // ── Så igen ──
  { id: 'gem-tomatfroe', title: 'Gem tomatfrø', category: 'saa-igen', crops: ['tomat'], body: 'De bedste tomater giver frø til næste sæson.', steps: ['Skrab frø og gelé ud i et glas.', 'Lad gære et par dage og skyl rent.', 'Tør frøene og gem dem mørkt.'], season: 'autumn' },
  { id: 'gem-aertefroe', title: 'Gem ærtefrø', category: 'saa-igen', crops: ['aert'], body: 'Lad nogle bælge modne helt på planten.', steps: ['Lad bælgene tørre på planten.', 'Bælg ærterne, når de rasler.', 'Gem tørt og mørkt til foråret.'], season: 'autumn' },
  // ── Natur ── (haven som levende sted — crop-løse haveprojekter)
  { id: 'insekthotel', title: 'Byg et insekthotel', category: 'natur', crops: [], body: 'Et lille insekthotel giver skjul og overvintring til havens nyttige smådyr.', steps: ['Saml naturlige materialer: hule stængler, bambusrør, kviste og bark.', 'Pak dem tæt i en lille kasse, krukke eller dåse.', 'Stil den lunt og tørt, gerne i læ og med åbningen mod syd.'] },
]

function norm(s: string): string {
  return s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').trim()
}
export function forvandlingCropKey(navn: string): string {
  const k = norm(navn).split(/[\s-]/)[0]
  // Robust mod flertal ("Agurker"→agurk, "Tomater"→tomat).
  const kendte = new Set(FORVANDLINGER.flatMap(f => f.crops))
  for (const kand of [k, k.replace(/er$/, ''), k.replace(/e$/, ''), k.replace(/r$/, '')]) {
    if (kendte.has(kand)) return kand
  }
  return k
}

export function findForvandling(id: string): HavebogForvandling | undefined {
  return FORVANDLINGER.find(f => f.id === id)
}

// ── Basis-mosaik: havens output-univers for den NYE bruger ──────────────────
//
// Anna 14/7: en fast mosaik med 8 generiske forvandlinger, der ALDRIG påstår
// noget om brugerens egen have. Model:
//   Basis-mosaik      = generiske Forvandlinger (denne liste, altid synlig)
//   Personlig mosaik  = brugerens planter, høst, frøbank og gemte idéer (senere)
// Når brugerdata findes, prioriteres personlige forslag; basis fylder resten.
//
// Balance (bevidst — Potalot er ikke en kogebog): Mad 3 · Gem/tør/så igen 3 ·
// Duft/pynt/natur 2.

// 'natur' (haven som levende sted) er nu en fuldgyldig ForvandlingKategori med
// egen detail-side, så basis-elementer bruger kernens KATEGORI_FARVE/LABEL
// direkte — ingen særtilfælde længere.
export type BasisKind = 'recipe_idea' | 'guide' | 'project' | 'seed_saving'

export function basisKategoriFarve(k: ForvandlingKategori): string {
  return KATEGORI_FARVE[k]
}
export function basisKategoriLabel(k: ForvandlingKategori): string {
  return KATEGORI_LABEL[k]
}

export interface BasisMosaikElement {
  id: string
  title: string
  category: ForvandlingKategori
  kind: BasisKind
  /** Kort "kan blive til"-copy (aldrig "er blevet"). Vises på detail-siden. */
  description: string
  cta: string
  href: string
  /** id på en FORVANDLINGER-post, hvis fotoet skal resolves derfra (via
   *  selectForvandlingAssets). Uden = farve-tile (fx crop-løse projekter). */
  forvandlingId?: string
  basis: true
}

export const BASIS_MOSAIK: BasisMosaikElement[] = [
  { id: 'tomatsauce', title: 'Tomatsauce på glas', category: 'gem', kind: 'recipe_idea', description: 'Når tomaterne vælter ind, kan de blive til sauce, suppe eller vinterglas.', cta: 'Se idé', href: '/havebog/forvandlinger/tomatsauce', forvandlingId: 'tomatsauce', basis: true },
  { id: 'gem-tomatfroe', title: 'Gem tomatfrø', category: 'saa-igen', kind: 'seed_saving', description: 'Én moden tomat kan blive starten på næste sæson.', cta: 'Se hvordan', href: '/havebog/forvandlinger/gem-tomatfroe', forvandlingId: 'gem-tomatfroe', basis: true },
  { id: 'toer-basilikum', title: 'Tør basilikum', category: 'toer', kind: 'guide', description: 'Gem duften af sommeren, før planten bliver træt.', cta: 'Se idé', href: '/havebog/forvandlinger/toer-basilikum', forvandlingId: 'toer-basilikum', basis: true },
  { id: 'lavendelposer', title: 'Lav lavendelposer', category: 'duft', kind: 'project', description: 'Blomsterne kan få et stille liv i skuffer, skabe og sengetøj.', cta: 'Se idé', href: '/havebog/forvandlinger/lavendelposer', forvandlingId: 'lavendelposer', basis: true },
  { id: 'jordbaersorbet', title: 'Jordbærsorbet', category: 'spis', kind: 'recipe_idea', description: 'De bløde bær kan blive til noget koldt, sødt og ret kortlivet.', cta: 'Se idé', href: '/havebog/forvandlinger/jordbaersorbet', forvandlingId: 'jordbaersorbet', basis: true },
  { id: 'agurkesalat', title: 'Agurkesalat', category: 'spis', kind: 'recipe_idea', description: 'Når agurkerne kommer hurtigt, må glassene gerne følge med.', cta: 'Se idé', href: '/havebog/forvandlinger/agurkesalat', forvandlingId: 'agurkesalat', basis: true },
  { id: 'spiselige-blomster', title: 'Spiselige blomster', category: 'pynt', kind: 'guide', description: 'Nogle blomster kan både stå i bedet og ende på tallerkenen.', cta: 'Læs mere', href: '/havebog/forvandlinger/spiselige-blomster', forvandlingId: 'spiselige-blomster', basis: true },
  { id: 'insekthotel', title: 'Byg et insekthotel', category: 'natur', kind: 'project', description: 'Nogle af havens bedste gæster skal bare have et sted at bo.', cta: 'Se projekt', href: '/havebog/forvandlinger/insekthotel', forvandlingId: 'insekthotel', basis: true },
]

/**
 * Ekstra mosaik-elementer uden for den faste BASIS_MOSAIK — pool som
 * REDAKTIONENS_VALG kan trække på (fx sæsonens gulerod-forvandlinger).
 */
export const EKSTRA_MOSAIK_ELEMENTER: BasisMosaikElement[] = [
  { id: 'guleroedskage', title: 'Gulerodskage', category: 'spis', kind: 'recipe_idea', description: 'Når høsten bliver større end aftensmaden, kan den blive til kage.', cta: 'Se idé', href: '/havebog/forvandlinger/guleroedskage', forvandlingId: 'guleroedskage', basis: true },
  { id: 'syltede-guleroedder', title: 'Syltede gulerødder', category: 'gem', kind: 'recipe_idea', description: 'En syrlig lage holder på høsten til vinterens måltider.', cta: 'Se idé', href: '/havebog/forvandlinger/syltede-guleroedder', forvandlingId: 'syltede-guleroedder', basis: true },
  { id: 'guleroedsjuice', title: 'Gulerodsjuice', category: 'bryg', kind: 'recipe_idea', description: 'Saftige rødder kan blive til en frisk, solgul juice.', cta: 'Se idé', href: '/havebog/forvandlinger/guleroedsjuice', forvandlingId: 'guleroedsjuice', basis: true },
]

/**
 * REDAKTIONENS VALG (Anna 3/8): redaktionen bestemmer hvilke drømme der møder
 * nye brugere — måneden er blot standard-filter for opslaget. Id'er skal
 * findes i BASIS_MOSAIK ∪ EKSTRA_MOSAIK_ELEMENTER; ukendte id'er springes
 * over. Mangler måneden helt, falder mosaikken tilbage til BASIS_MOSAIK
 * (robust når en måned glemmes).
 */
export const REDAKTIONENS_VALG: Partial<Record<number, string[]>> = {
  1: ['guleroedskage', 'guleroedsjuice', 'insekthotel', 'tomatsauce', 'toer-basilikum', 'gem-tomatfroe'],
  2: ['guleroedskage', 'guleroedsjuice', 'insekthotel', 'tomatsauce', 'toer-basilikum', 'gem-tomatfroe'],
  3: ['spiselige-blomster', 'jordbaersorbet', 'insekthotel', 'toer-basilikum', 'agurkesalat', 'tomatsauce'],
  4: ['spiselige-blomster', 'jordbaersorbet', 'insekthotel', 'toer-basilikum', 'agurkesalat', 'tomatsauce'],
  5: ['jordbaersorbet', 'spiselige-blomster', 'agurkesalat', 'lavendelposer', 'toer-basilikum', 'tomatsauce'],
  6: ['jordbaersorbet', 'spiselige-blomster', 'agurkesalat', 'lavendelposer', 'toer-basilikum', 'tomatsauce'],
  7: ['jordbaersorbet', 'agurkesalat', 'lavendelposer', 'tomatsauce', 'spiselige-blomster', 'toer-basilikum'],
  8: ['tomatsauce', 'jordbaersorbet', 'toer-basilikum', 'gem-tomatfroe', 'agurkesalat', 'lavendelposer'],
  9: ['tomatsauce', 'guleroedskage', 'syltede-guleroedder', 'gem-tomatfroe', 'guleroedsjuice', 'insekthotel'],
  10: ['tomatsauce', 'guleroedskage', 'syltede-guleroedder', 'gem-tomatfroe', 'guleroedsjuice', 'insekthotel'],
  11: ['guleroedskage', 'syltede-guleroedder', 'guleroedsjuice', 'insekthotel', 'lavendelposer', 'toer-basilikum'],
  12: ['guleroedskage', 'syltede-guleroedder', 'guleroedsjuice', 'insekthotel', 'lavendelposer', 'toer-basilikum'],
}

/**
 * Slå redaktionens valg op for en måned. Ukendte id'er filtreres fra;
 * tomt/utilstrækkeligt resultat → BASIS_MOSAIK (fallback-reglen).
 */
export function redaktionensValg(maaned: number): BasisMosaikElement[] {
  const ids = REDAKTIONENS_VALG[maaned]
  if (!ids || ids.length === 0) return BASIS_MOSAIK
  const pool = new Map([...BASIS_MOSAIK, ...EKSTRA_MOSAIK_ELEMENTER].map(e => [e.id, e]))
  const valgte = ids.map(id => pool.get(id)).filter((e): e is BasisMosaikElement => !!e)
  return valgte.length > 0 ? valgte : BASIS_MOSAIK
}

const KAT_ORDEN: ForvandlingKategori[] = ['spis', 'gem', 'toer', 'bryg', 'duft', 'plej', 'pynt', 'saa-igen']

/**
 * Vælg forvandlinger til mosaikken — på TVÆRS af kategorier ud fra brugerens
 * afgrøder. Max 3 'spis', mindst én ikke-mad hvis muligt, kategori-diversitet.
 */
export function vaelgForvandlinger(input: {
  crops: string[]
  maxTiles?: number
}): HavebogForvandling[] {
  const { crops, maxTiles = 6 } = input
  const brugerCrops = new Set(crops.map(forvandlingCropKey))
  const matches = FORVANDLINGER.filter(f => f.crops.some(c => brugerCrops.has(c)))

  const perKat = new Map<ForvandlingKategori, HavebogForvandling[]>()
  for (const f of matches) {
    const arr = perKat.get(f.category) ?? []
    arr.push(f)
    perKat.set(f.category, arr)
  }

  // Round-robin over kategorier (spis cappet til 3) → diversitet.
  const valgt: HavebogForvandling[] = []
  let tilfoejet = true
  while (valgt.length < maxTiles && tilfoejet) {
    tilfoejet = false
    for (const kat of KAT_ORDEN) {
      if (valgt.length >= maxTiles) break
      if (kat === 'spis' && valgt.filter(v => v.category === 'spis').length >= 3) continue
      const pool = perKat.get(kat) ?? []
      const next = pool.find(p => !valgt.includes(p))
      if (!next) continue
      valgt.push(next)
      tilfoejet = true
    }
  }
  return valgt
}
