/**
 * "Begynd her"-emnekortene på /guides — flyttet ud af guides-demo.ts
 * (JS-audit 5/8): guides-bibliotek (klient) importerede kun disse ~40
 * linjer, men trak dermed HELE guides-demo → IMPORTED_GUIDES (656 kB
 * klient-chunk delt af 4 hovedruter) med i bundlen. Denne fil må ALDRIG
 * importere fra guides-demo eller guides-imported.
 */
export interface PopulaertEmne {
  /** Søge-token der filtrerer biblioteket på plantenavn */
  matchPlantName: string
  /** Stort navn på kortet */
  navn: string
  /** Kuratorisk byline — kort, redaktionel */
  byline: string
  imageUrl: string
}

// V4.1 låst regel (-2.F): "Begynd her" er ARTSNIVEAU-navigation.
// imageUrl skal pege på arts/<art>.jpg — IKKE plantekort/<sort>.
// Sortsspecifikke fotos sniger sig ellers ind hvor teksten siger art.
export const POPULAERE_EMNER: PopulaertEmne[] = [
  {
    matchPlantName: 'tomat',
    navn: 'Tomater',
    byline: 'Fra frø til høst',
    imageUrl: '/images/arts/tomat.jpg',
  },
  {
    matchPlantName: 'dahlia',
    navn: 'Dahliaer',
    byline: 'Flere blomster hele sommeren',
    imageUrl: '/images/arts/dahlia.jpg',
  },
  {
    matchPlantName: 'agurk',
    navn: 'Agurker',
    byline: 'Sprøde høster gennem sommeren',
    imageUrl: '/images/arts/agurk.jpg',
  },
  {
    matchPlantName: 'chili',
    navn: 'Chili',
    byline: 'Lang sæson, stor belønning',
    imageUrl: '/images/arts/chili.jpg',
  },
]
