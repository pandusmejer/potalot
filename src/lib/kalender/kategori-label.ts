/**
 * Gøremåls-kategorier: fra intern nøgle til brugerrettet label.
 *
 * `general_garden_tasks.category` blev vist råt. Kolonnen har 56 forskellige
 * værdier i produktion mod en enum på 6 — ASCII-nøgler (`saaning`), danske
 * tvillinger (`såning`), versal-varianter (`Beskæring`) og, i 118 af 265
 * rækker, en kategori der slet ikke er en handling, men et STED
 * (`drivhus`, `græsplæne`), en PLANTETYPE (`stauder`, `roser`) eller en
 * ANLEDNING (`halloween`, `juledekorationer`).
 *
 * Den akse er aldrig blevet modelleret. En streng "ukendt → Andet" ville
 * rette 6 rækker og ødelægge 118. Derfor er formatteren tre-lags
 * (ANNA-LÅST, Docs/content/potalot-terminologi.md 2/9 2026):
 *
 *   Lag 1 — kendt: canonical værdi eller DOKUMENTERET alias → CATEGORY_LABELS.
 *   Lag 2 — ukendt, men sikker dansk: KUN typografisk normalisering.
 *           Versalisering, plus gendannelse af æ/ø/å når den ASCII-strippede
 *           tvilling af ordet er dokumenteret (`klargoering` → Klargøring).
 *   Lag 3 — ukendt OG slug-/kodeagtig: → "Andet" + registrering.
 *
 * **Lag 2 er typografi, aldrig semantik.** `vinterklargoering` får sine
 * bogstaver tilbage, men gættes ALDRIG ind i en canonical kategori — det
 * ville kræve et dokumenteret alias i lag 1. Vi genskaber bogstaver, vi
 * opfinder ikke betydning.
 *
 * Ingen prod-datawrites. Nøglen i databasen står urørt.
 */

export type GardenTaskCategory =
  | 'jord'
  | 'saaning'
  | 'hoest'
  | 'pleje'
  | 'beskyttelse'
  | 'planlaegning'

/** Visuelle labels til kategori-chips. Ikke "greb". */
export const CATEGORY_LABELS: Record<GardenTaskCategory, string> = {
  jord: 'Jord',
  saaning: 'Såning',
  hoest: 'Høst',
  pleje: 'Pleje',
  beskyttelse: 'Beskyt',
  planlaegning: 'Plan',
}

/**
 * Lag 1 — dokumenterede aliasser.
 *
 * BEVIDST snæver: kun stavevarianter af de canonical nøgler selv (dansk
 * tvilling af ASCII-formen). Et alias er en anden stavemåde af SAMME ord —
 * aldrig en beslutning om at to forskellige ord betyder det samme.
 * `beskæring` bliver fx IKKE `pleje`; det er en semantisk sammenlægning,
 * som kun et menneske må træffe.
 */
const KATEGORI_ALIAS: Readonly<Record<string, GardenTaskCategory>> = {
  såning: 'saaning',
  høst: 'hoest',
  planlægning: 'planlaegning',
}

/**
 * Lag 2 — dokumenterede ASCII-tvillinger.
 *
 * ASCII-form → det danske ord, den er en translitteration af. Kun ord hvor
 * den danske form er verificeret. Tabellen giver bogstaverne tilbage; den
 * siger intet om, hvilken kategori ordet hører til.
 */
const ASCII_TVILLING: Readonly<Record<string, string>> = {
  klargoering: 'klargøring',
  vinterklargoering: 'vinterklargøring',
  froesamling: 'frøsamling',
  jorddaekke: 'jorddække',
  goedning: 'gødning',
  beskaering: 'beskæring',
  graesplaene: 'græsplæne',
  koekkenhave: 'køkkenhave',
  loegplanter: 'løgplanter',
  froe: 'frø',
  vinterbeskyttelse: 'vinterbeskyttelse',
  frugttraeer: 'frugttræer',
  indendoers: 'indendørs',
  vintergroent: 'vintergrønt',
}

/** Lag 2 accepterer danske bogstaver og mellemrum. Alt andet er struktur. */
const SIKKER_DANSK = /^[a-zæøå][a-zæøå ]*$/

export type KategoriLag = 1 | 2 | 3

export interface KategoriVisning {
  /** Den uændrede værdi fra databasen. */
  noegle: string
  label: string
  lag: KategoriLag
}

const tilOprydning = new Map<string, KategoriLag>()

/** Læs registret over kategorier uden verificeret label. Muterer ikke. */
export function kategorierTilOprydning(): Array<{ noegle: string; lag: KategoriLag }> {
  return [...tilOprydning]
    .map(([noegle, lag]) => ({ noegle, lag }))
    .sort((a, b) => a.lag - b.lag || a.noegle.localeCompare(b.noegle, 'da'))
}

/** Nulstil registret (kun til test). */
export function nulstilKategoriRegister(): void {
  tilOprydning.clear()
}

function noter(noegle: string, lag: KategoriLag): void {
  if (tilOprydning.has(noegle)) return
  tilOprydning.set(noegle, lag)
  // Lag 3 mister betydning for brugeren nu og råbes op. Lag 2 registreres
  // altid, men støjer kun på forlangende (POTALOT_KATEGORI_LOG=1).
  const raab = lag === 3 || process.env.POTALOT_KATEGORI_LOG === '1'
  if (raab && process.env.NODE_ENV !== 'production') {
    console.info(`[kategori] lag ${lag} — uden verificeret label: "${noegle}"`)
  }
}

function erCanonical(v: string): v is GardenTaskCategory {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, v)
}

/**
 * Oversæt én kategoriværdi til dens visningsform.
 * Returnerer altid en label — kategorien vises, den forsvinder ikke.
 */
export function formatKategori(kategori: string): KategoriVisning {
  const noegle = kategori
  const v = kategori.trim().toLowerCase()

  if (erCanonical(v)) return { noegle, label: CATEGORY_LABELS[v], lag: 1 }

  const alias = KATEGORI_ALIAS[v]
  if (alias) return { noegle, label: CATEGORY_LABELS[alias], lag: 1 }

  if (SIKKER_DANSK.test(v)) {
    const dansk = ASCII_TVILLING[v] ?? v
    noter(v, 2)
    return { noegle, label: dansk.charAt(0).toUpperCase() + dansk.slice(1), lag: 2 }
  }

  noter(v || kategori, 3)
  return { noegle, label: 'Andet', lag: 3 }
}

/** Kortformen, når kun labelen skal bruges. */
export function kategoriLabel(kategori: string): string {
  return formatKategori(kategori).label
}
