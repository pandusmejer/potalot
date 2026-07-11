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
  | 'spis' | 'gem' | 'toer' | 'bryg' | 'duft' | 'plej' | 'pynt' | 'saa-igen'

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
}

const KOSMETISK_NOTE = 'Kun til kosmetisk brug — ingen medicinske løfter. Test altid på et lille hudområde først.'

export const FORVANDLINGER: HavebogForvandling[] = [
  // ── Spis ──
  { id: 'gazpacho', title: 'Gazpacho', category: 'spis', crops: ['tomat', 'agurk', 'basilikum'], body: 'Tomaterne og agurkerne fylder i kurven lige nu.', steps: ['Blend tomater, agurk og lidt basilikum.', 'Smag til med salt, olie og syre.', 'Køl ned og spis koldt.'], season: 'summer' },
  { id: 'tomatsalat', title: 'Tomatsalat', category: 'spis', crops: ['tomat', 'basilikum'], body: 'Modne tomater smager bedst lige plukket.', steps: ['Skær tomater i både.', 'Riv basilikum over.', 'Dryp med god olie og lidt salt.'], season: 'summer' },
  { id: 'jordbaertaerte', title: 'Jordbærtærte', category: 'spis', crops: ['jordbaer'], body: 'Jordbærrene er søde og fylder i kurven nu.', steps: ['Bag en sprød bund.', 'Fyld med creme og friske jordbær.', 'Køl af før servering.'], season: 'summer' },
  { id: 'agurkesalat', title: 'Agurkesalat', category: 'spis', crops: ['agurk'], body: 'Frisk agurk er kølig og sprød i sommervarmen.', steps: ['Skær agurk i tynde skiver.', 'Vend med eddike, sukker og salt.', 'Lad trække en halv time.'], season: 'summer' },
  { id: 'basilikumpesto', title: 'Basilikumpesto', category: 'spis', crops: ['basilikum'], body: 'Klip basilikum før planten går i blomst.', steps: ['Blend basilikum, nødder, ost og olie.', 'Smag til med salt og citron.', 'Brug straks eller frys i portioner.'] },
  // ── Gem ──
  { id: 'syltede-agurker', title: 'Syltede agurker', category: 'gem', crops: ['agurk'], body: 'Har du flere agurker, end du kan spise nu?', steps: ['Skær agurk i skiver.', 'Kog en lage af eddike, sukker og krydderier.', 'Hæld over og lad trække på køl.'], season: 'summer' },
  { id: 'tomatsauce', title: 'Tomatsauce på glas', category: 'gem', crops: ['tomat'], body: 'Gem sommerens tomater til vinterens retter.', steps: ['Kog tomater ind med hvidløg og urter.', 'Fyld på skoldede glas.', 'Opbevar køligt og mørkt.'], season: 'summer' },
  { id: 'frys-jordbaer', title: 'Frys jordbær', category: 'gem', crops: ['jordbaer'], body: 'Frys de overskydende bær, mens de er friske.', steps: ['Skyl og nip bærrene.', 'Frys dem enkeltvis på en bakke.', 'Saml i pose, når de er faste.'] },
  { id: 'toerrede-chilier', title: 'Tørrede chilier', category: 'gem', crops: ['chili'], body: 'Modne chilier kan gemmes hele vinteren.', steps: ['Træd en snor gennem stilkene.', 'Hæng dem luftigt og mørkt.', 'Knus eller brug hele efter behov.'], season: 'autumn' },
  // ── Tør ──
  { id: 'toer-basilikum', title: 'Tør basilikum', category: 'toer', crops: ['basilikum'], body: 'Klip før planten bliver træt eller går i blomst.', steps: ['Klip rene skud.', 'Tør dem luftigt eller ved lav varme.', 'Gem bladene mørkt og tørt.'] },
  { id: 'toer-mynte', title: 'Tør mynte', category: 'toer', crops: ['mynte'], body: 'Mynte tørrer let og holder smagen til te.', steps: ['Klip friske skud.', 'Bind små bundter og hæng dem.', 'Smuldr de tørre blade på glas.'] },
  { id: 'lavendelbundter', title: 'Lavendelbundter', category: 'toer', crops: ['lavendel'], body: 'Klip lavendlen, når den lige er sprunget ud.', steps: ['Bind små bundter.', 'Hæng dem mørkt og luftigt.', 'Brug tørret til duft eller pynt.'], season: 'summer' },
  // ── Bryg ──
  { id: 'mynte-te', title: 'Mynte-te', category: 'bryg', crops: ['mynte'], body: 'Et par friske skud giver en rolig kop.', steps: ['Skyl en håndfuld mynte.', 'Overhæld med kogende vand.', 'Lad trække 5 minutter.'] },
  { id: 'kamille-te', title: 'Kamille-te', category: 'bryg', crops: ['kamille'], body: 'Pluk blomsterne, når de er helt åbne.', steps: ['Tør blomsterne luftigt.', 'Overhæld en teskefuld med varmt vand.', 'Lad trække og si fra.'] },
  { id: 'ribs-sirup', title: 'Ribs-sirup', category: 'bryg', crops: ['ribs'], body: 'Ribsene er modne og syrlige lige nu.', steps: ['Kog ribs med vand og sukker.', 'Si saften fra.', 'Fyld på flaske og opbevar køligt.'], season: 'summer' },
  // ── Duft ──
  { id: 'lavendelpotpourri', title: 'Lavendelpotpourri', category: 'duft', crops: ['lavendel'], body: 'Klip blomsterne, når de dufter mest.', steps: ['Bind små bundter.', 'Hæng dem mørkt og luftigt.', 'Brug de tørrede blomster i en skål eller lille pose.'], season: 'summer' },
  { id: 'duftpose', title: 'Duftpose til skuffen', category: 'duft', crops: ['lavendel'], body: 'Tørret lavendel holder tøjet friskt længe.', steps: ['Tør lavendelblomster helt.', 'Fyld en lille stofpose.', 'Læg den i skuffen eller skabet.'] },
  // ── Plej ──
  { id: 'lavendelolie', title: 'Lavendelolie', category: 'plej', crops: ['lavendel'], body: 'En blid, duftende olie til huden.', steps: ['Fyld et glas med tørrede lavendelblomster.', 'Dæk med en mild olie.', 'Lad trække lyst i et par uger, og si fra.'], safetyNote: KOSMETISK_NOTE },
  { id: 'morgenfrue-salve', title: 'Morgenfruesalve', category: 'plej', crops: ['morgenfrue'], body: 'Morgenfruens kronblade giver en blød salve.', steps: ['Træk kronblade i olie.', 'Si fra og varm forsigtigt med lidt bivoks.', 'Hæld i små glas og lad stivne.'], safetyNote: KOSMETISK_NOTE },
  // ── Pynt ──
  { id: 'dahlia-vase', title: 'Dahlia i vase', category: 'pynt', crops: ['dahlia'], body: 'Dahliaerne blomstrer og vil gerne indenfor.', steps: ['Klip tidligt om morgenen.', 'Skær stilken skråt.', 'Skift vand hver anden dag.'], season: 'summer' },
  { id: 'spiselige-blomster', title: 'Spiselige blomster', category: 'pynt', crops: ['morgenfrue', 'tallerkensmaekker'], body: 'Nogle blomster pynter både tallerken og kage.', steps: ['Pluk friske, rene blomster.', 'Dryp dem forsigtigt tørre.', 'Læg dem på salat, kage eller i isterninger.'], season: 'summer' },
  // ── Så igen ──
  { id: 'gem-tomatfroe', title: 'Gem tomatfrø', category: 'saa-igen', crops: ['tomat'], body: 'De bedste tomater giver frø til næste sæson.', steps: ['Skrab frø og gelé ud i et glas.', 'Lad gære et par dage og skyl rent.', 'Tør frøene og gem dem mørkt.'], season: 'autumn' },
  { id: 'gem-aertefroe', title: 'Gem ærtefrø', category: 'saa-igen', crops: ['aert'], body: 'Lad nogle bælge modne helt på planten.', steps: ['Lad bælgene tørre på planten.', 'Bælg ærterne, når de rasler.', 'Gem tørt og mørkt til foråret.'], season: 'autumn' },
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
