/**
 * Lokal demo-data til Dyrkningsguides.
 *
 * KUN brugt af Guides-flowet. Ikke en global app-demo-mekanisme.
 *
 * Viser hele tillidshierarkiet:
 *   - 3 Potalot-guides (kvalitetssikret, kuraterede — standarden)
 *   - 2 Egne guides (heraf én afledt af Potalot-guide for at vise lineage)
 *   - 1 AI-udkast (sekundært lag, klart markeret)
 *
 * AI-udkast har INGEN dedikeret kolonne i schemaet i V1 — det er kun
 * synligt i demo via DEMO_AI_GUIDE_IDS. Real-data path mapper alle
 * private guides til "Egen guide" indtil AI-genereringen lander.
 *
 * Plus 4 populære emner (redaktionelle indgange, IKKE filterknapper).
 */

import type { Guide } from '@/lib/types'

// ════════════════════════════════════════════════════════════════
// POPULÆRE EMNER — redaktionelle indgange, ikke kategorier
// ════════════════════════════════════════════════════════════════

export interface PopulaertEmne {
  /** Søge-token der filtrerer biblioteket på plantenavn */
  matchPlantName: string
  /** Stort navn på kortet */
  navn: string
  /** Kuratorisk byline — kort, redaktionel */
  byline: string
  imageUrl: string
}

export const POPULAERE_EMNER: PopulaertEmne[] = [
  {
    matchPlantName: 'tomat',
    navn: 'Tomater',
    byline: 'Fra frø til høst',
    imageUrl: '/images/plantekort/plantekort-tomat-san-marzano.png',
  },
  {
    matchPlantName: 'dahlia',
    navn: 'Dahliaer',
    byline: 'Flere blomster hele sommeren',
    imageUrl: '/images/plantekort/plantekort-dahlia-cafe-au-lait.jpg',
  },
  {
    matchPlantName: 'agurk',
    navn: 'Agurker',
    byline: 'Sprøde høster gennem sommeren',
    imageUrl: '/images/plantekort/plantekort-agurk-marketmore.png',
  },
  {
    matchPlantName: 'chili',
    navn: 'Chili',
    byline: 'Lang sæson, stor belønning',
    imageUrl: '/images/plantekort/plantekort-chili-habanero-orange.jpg',
  },
]

// ════════════════════════════════════════════════════════════════
// DEMO GUIDES
// ════════════════════════════════════════════════════════════════

const NOW = '2026-05-01T00:00:00Z'

function baseGuide(): Pick<
  Guide,
  'guideLevel' | 'subcategoryId' | 'difficulty' | 'mediaIds' | 'sourceLinks' |
  'status' | 'reviewStatus' | 'flaggedAt' | 'flaggedReason' | 'deleteAt' |
  'createdAt' | 'updatedAt'
> {
  return {
    guideLevel: 'variety',
    subcategoryId: 'groentsager',
    difficulty: 'medium',
    mediaIds: [],
    sourceLinks: [],
    status: 'published',
    reviewStatus: 'approved',
    flaggedAt: null,
    flaggedReason: null,
    deleteAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

// ── 3 POTALOT-GUIDES (visibility: 'public' — kvalitetssikrede) ───

const POTALOT_TOMAT: Guide = {
  ...baseGuide(),
  id: 'demo-guide-tomat-sm',
  plantName: 'Tomat',
  variety: 'San Marzano',
  latinName: 'Solanum lycopersicum',
  primaryCategoryId: 'fro',
  summary:
    'Klassisk italiensk pasta-tomat med kraftig vækst og kødfuld frugt. Trives i drivhus og varm friland med god opbinding.',
  tags: ['italiensk', 'pasta', 'kødfuld'],
  quickFacts: {
    sowingMonths: [3, 4],
    directSowingMonths: [],
    plantingOutMonths: [5, 6],
    harvestMonths: [8, 9, 10],
    preCultivation: true,
    light: 'full_sun',
    water: 'regular',
    soil: 'Næringsrig, veldrænende muldjord. pH 6,0–6,8.',
    growthType: 'Ranketomat',
    height: '180-220 cm',
    maturityDays: '80-85 dage',
    primaryUse: 'Sauce og madlavning',
  },
  sections: [
    {
      key: 'intro',
      title: 'Om sorten',
      body:
        'San Marzano er en hævdvunden italiensk landrace fra det vulkanske område syd for Napoli. Sorten er bedrejeren bag den klassiske ragù: kødfuld, sød, med lavt vandindhold og let at koge ind. På bedsted vokser den højt, så opbinding er nødvendig fra første dag i jord.',
    },
    {
      kind: 'fact',
      key: 'rank-vs-busk',
      variant: 'comparison',
      title: 'Tomater vokser på to måder',
      columns: [
        {
          heading: 'Ranketomat',
          items: [
            'Vokser hele sæsonen',
            'Skal opbindes',
            'Skal ofte knibes',
            'Bedst i drivhus',
          ],
        },
        {
          heading: 'Busktomat',
          items: [
            'Kompakt vækst',
            'Kræver sjældent opbinding',
            'Kræver sjældent knibning',
            'Velegnet til krukker og altan',
          ],
        },
      ],
    },
    {
      key: 'forspiring',
      title: 'Forspiring',
      body:
        'Sø i marts–april ved 18–22 °C. Brug små potter med fugtig forspiringsjord, 5 mm dyb. Hold under låg eller plastic indtil spiringen (7–14 dage). Når kimbladene er ude, fjernes låget og potterne flyttes til kraftigt lys. Først ompottet i større potte når 4–5 ægte blade er udviklet.',
    },
    {
      key: 'udplantning',
      title: 'Udplantning',
      body:
        'Plantes ud efter isdamene (midt-slut maj) i drivhus eller mod sydvendt mur. Hold 50 cm mellem planterne. Grav dybt og plante helt ned til de nederste blade — stænglen danner ekstra rødder. Vand grundigt ved plantning og bind op til pind eller snor med det samme.',
    },
    {
      key: 'pleje',
      title: 'Pleje gennem sæsonen',
      body:
        'Tyv (knib sideskud væk) hver 7. dag — det giver større frugter og lader luften cirkulere. Vand dybt og regelmæssigt; ujævn vanding giver revnede tomater. Gød hver 14. dag fra første blomst med tomat-gødning eller komposttea. Fjern de nederste blade når de gulner.',
    },
    {
      key: 'host',
      title: 'Høst og opbevaring',
      body:
        'Pluk når frugterne er fuldt røde og let bløde. San Marzano kan plukkes lidt grønne og modnes på køkkenbordet hvis efteråret bliver koldt. Hold dem ved stuetemperatur — aldrig køleskab. Til konservering: blanchér 30 sekunder, pillet skinn af, og rull på glas eller frys.',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir indenfor', recommendedMonths: [3, 4], priority: 'high' },
    { taskType: 'repot', title: 'Ompot til større potte', recommendedMonths: [4, 5], priority: 'medium' },
    { taskType: 'plant_out', title: 'Udplant i drivhus eller mod sydvæg', recommendedMonths: [5, 6], priority: 'high' },
    { taskType: 'pruning', title: 'Tyv tomatplanterne', recommendedMonths: [6, 7, 8], priority: 'medium' },
    { taskType: 'harvest', title: 'Høst modne frugter', recommendedMonths: [7, 8, 9], priority: 'high' },
  ],
  primaryImageId: '/images/plantekort/plantekort-tomat-san-marzano.png',
  visibility: 'public',
}

const POTALOT_DAHLIA: Guide = {
  ...baseGuide(),
  id: 'demo-guide-dahlia-cafe',
  plantName: 'Dahlia',
  variety: 'Café au Lait',
  latinName: 'Dahlia hybrida',
  primaryCategoryId: 'knolde',
  subcategoryId: 'blomster',
  summary:
    'Stor, krem-rosa dinnerplate-dahlia. Bærer overflod af blomster gennem hele sommeren hvis den plukkes regelmæssigt.',
  tags: ['blomster', 'snitblomst', 'eftersommer'],
  quickFacts: {
    sowingMonths: [],
    directSowingMonths: [],
    plantingOutMonths: [5],
    harvestMonths: [7, 8, 9, 10],
    preCultivation: true,
    light: 'full_sun',
    water: 'regular',
    soil: 'Næringsrig, veldrænende. Tåler ikke fugt om vinteren.',
  },
  sections: [
    {
      key: 'intro',
      title: 'Om sorten',
      body:
        'Café au Lait er én af de mest fotograferede dahliaer i verden — og med god grund. Dens enorme krem-rosa-blomster (op til 25 cm) skifter let i farvespil afhængigt af temperatur og lys. En klassiker til brudebuketter, eftersommer-buketter og store haver.',
    },
    {
      key: 'forspiring',
      title: 'Forspiring af knolde',
      body:
        'Læg knoldene i potter med let fugtig jord i marts–april ved 12–15 °C. Plant lavt så den øverste del af knolden lige stikker op. Vand sparsomt indtil spiringen. Når skuddene er 10 cm høje, kan de nedknibes for at få buskede planter.',
    },
    {
      key: 'udplantning',
      title: 'Udplantning og opbinding',
      body:
        'Plant ud efter isdamene i sol med veldrænet jord. Hold 60–80 cm afstand. Bind op fra dag ét — dahliaer vokser hurtigt og bukker under egen vægt uden støtte. Brug en kraftig pind eller bambusstok midt i knoldens placering.',
    },
    {
      key: 'pleje',
      title: 'Pluk for at få flere blomster',
      body:
        'Plukke ofte — jo mere du plukker, jo mere bliver der. Skær lange stilke ind til de første bladsæt for at fremme nye knopper. Vand dybt 1–2 gange om ugen. Gød med komposttea eller en kalium-rig blomstergødning hver 14. dag fra første knop.',
    },
    {
      key: 'overvintring',
      title: 'Overvintring af knolde',
      body:
        'Grav knoldene op efter første nattefrost (oktober–november). Lad dem tørre i et par dage, rens jord af, og opbevar dem i tør sand eller tørvesmuld i en frostfri kælder ved 5–10 °C. Tjek dem hver måned vinteren igennem for skimmel eller udtørring.',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir knolde i potte', recommendedMonths: [3, 4], priority: 'medium' },
    { taskType: 'plant_out', title: 'Plant ud i bedet', recommendedMonths: [5], priority: 'high' },
    { taskType: 'harvest', title: 'Pluk blomster løbende', recommendedMonths: [7, 8, 9, 10], priority: 'medium' },
    { taskType: 'maintenance', title: 'Grav op og overvintr knolde', recommendedMonths: [10, 11], priority: 'high' },
  ],
  primaryImageId: '/images/plantekort/plantekort-dahlia-cafe-au-lait.jpg',
  visibility: 'public',
}

const POTALOT_HVIDLOG: Guide = {
  ...baseGuide(),
  id: 'demo-guide-hvidlog-therados',
  plantName: 'Hvidløg',
  variety: 'Therados',
  latinName: 'Allium sativum',
  primaryCategoryId: 'loeg',
  summary:
    'Hårdfør efterårshvidløg, der lægges i jord i oktober og høstes næste år. Stærkere smag og bedre holdbarhed end forårslagte sorter.',
  tags: ['efterårslagt', 'krydderi', 'hårdfør'],
  quickFacts: {
    sowingMonths: [],
    directSowingMonths: [10, 11],
    plantingOutMonths: [],
    harvestMonths: [7, 8],
    preCultivation: false,
    light: 'full_sun',
    water: 'regular',
    soil: 'Løs, veldrænende muldjord. Helst ikke tung lerjord.',
  },
  sections: [
    {
      key: 'intro',
      title: 'Om sorten',
      body:
        'Therados er en pålidelig efterårshvidløg med hvide, regelmæssige hoveder og 8–12 store fed. Vinterperioden i jord giver bedre rod-udvikling og højere udbytte sammenlignet med forårslagte sorter.',
    },
    {
      key: 'plantning',
      title: 'Plantning om efteråret',
      body:
        'Plant i oktober–november, omkring 4 uger før første frost. Bryd hovedet i enkeltfed kun lige før plantning. Plant 5 cm dybt med fladsiden nedad og 15 cm afstand. Dæk med et lag halm eller løv for at beskytte mod kraftig frost.',
    },
    {
      key: 'pleje',
      title: 'Pleje gennem forår og sommer',
      body:
        'Hvidløg har brug for lidt — det er en taknemmelig afgrøde. Hold jorden ukrudtsfri og vand kun ved langvarig tørke. Fjern blomsterstænglerne (scapes) når de dukker op i juni — det sender al energi i hovedet og giver større fed.',
    },
    {
      key: 'host',
      title: 'Høst og tørring',
      body:
        'Høst når de nederste 3–4 blade er gulnet (juli–august). Træk forsigtigt op om morgenen. Hæng hovederne med top og rod i et tørt, luftigt og skygget rum i 3–4 uger. Først derefter klippes rødderne af. Holdbart i 6–9 måneder ved 10 °C og lav fugtighed.',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Læg hvidløgsfed i jord', recommendedMonths: [10, 11], priority: 'high' },
    { taskType: 'pruning', title: 'Fjern blomsterstængler (scapes)', recommendedMonths: [6], priority: 'medium' },
    { taskType: 'harvest', title: 'Høst når toppen gulner', recommendedMonths: [7, 8], priority: 'high' },
  ],
  visibility: 'public',
}

// ── 2 EGNE GUIDES (visibility: 'private') ────────────────────────

const EGEN_TOMAT_TILPASNING: Guide = {
  ...baseGuide(),
  id: 'demo-guide-tomat-sm-min',
  plantName: 'Tomat',
  variety: 'San Marzano',
  latinName: 'Solanum lycopersicum',
  // Afledt af Potalot-guiden → giver lineage-tekst "Baseret på Potalot-guiden"
  parentGuideId: POTALOT_TOMAT.id,
  primaryCategoryId: 'fro',
  summary:
    'Min tilpassede udgave: jeg planter senere (start juni) fordi mit drivhus først bliver varmt da, og jeg knibber kun en gang om ugen.',
  tags: ['min tilpasning'],
  quickFacts: {
    sowingMonths: [4, 5],
    directSowingMonths: [],
    plantingOutMonths: [6],
    harvestMonths: [8, 9, 10],
    preCultivation: true,
    light: 'full_sun',
    water: 'regular',
    soil: 'Som Potalot-guiden — men jeg blander tang i toppen om sommeren.',
  },
  sections: [
    {
      key: 'intro',
      title: 'Mine erfaringer med sorten',
      body:
        'Jeg har dyrket San Marzano i 3 år nu. Mit drivhus er små og bliver først rigtig varmt i juni, så jeg har skubbet hele cyklussen en måned. Det fungerer godt — mindre risiko for tidlig udtørring.',
    },
    {
      key: 'pleje',
      title: 'Sådan justerer jeg pleje',
      body:
        'Jeg tyver kun én gang om ugen i stedet for hver 5. dag. Det giver lidt mere bladmasse, men frugterne bliver alligevel kødfulde. Vander altid om morgenen, aldrig efter solnedgang.',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir indenfor (april–maj)', recommendedMonths: [4, 5], priority: 'high' },
    { taskType: 'plant_out', title: 'Udplant i drivhus (juni)', recommendedMonths: [6], priority: 'high' },
    { taskType: 'harvest', title: 'Høst modne frugter', recommendedMonths: [8, 9, 10], priority: 'high' },
  ],
  primaryImageId: '/images/plantekort/plantekort-tomat-san-marzano.png',
  visibility: 'private',
}

const EGEN_SUKKERAERT: Guide = {
  ...baseGuide(),
  id: 'demo-guide-sukkeraert-min',
  plantName: 'Sukkerært',
  variety: 'Sugar Snap',
  latinName: 'Pisum sativum var. macrocarpon',
  parentGuideId: null,
  primaryCategoryId: 'fro',
  summary:
    'Mine egne notater fra første sæson med sukkerært. Næste år vil jeg så tidligere og sætte hegnet op før spiring — ikke efter.',
  tags: ['egne erfaringer'],
  quickFacts: {
    sowingMonths: [3, 4],
    directSowingMonths: [3, 4],
    plantingOutMonths: [],
    harvestMonths: [6, 7],
    preCultivation: false,
    light: 'full_sun',
    water: 'regular',
    soil: 'Almindelig havejord. Tilfører jeg ikke ekstra gødning.',
  },
  sections: [
    {
      key: 'erfaring',
      title: 'Hvad jeg har lært',
      body:
        'Sæt hegnet/snorrene op INDEN spiring — ikke efter. Min første sæson satte jeg dem op for sent og rankerne blev forviklede i hinanden. Plantede 15 cm afstand, det var måske lidt for tæt — 20 cm næste år.',
    },
    {
      key: 'hoest',
      title: 'Høst-rytme',
      body:
        'Pluk hver 2.–3. dag når bælgene begynder. Hvis jeg ventede en uge blev de seje. Bedst når bælgen er prall men før ærterne svulmer.',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Direkte såning', recommendedMonths: [3, 4], priority: 'high' },
    { taskType: 'harvest', title: 'Pluk bælge hver 2.–3. dag', recommendedMonths: [6, 7], priority: 'medium' },
  ],
  primaryImageId: '/images/plantekort/plantekort-sukkeraert-sugar-snap.jpg',
  visibility: 'private',
}

// ── 1 AI-UDKAST (visibility: 'private', men flagget via DEMO_AI_GUIDE_IDS) ──

const AI_AGURK: Guide = {
  ...baseGuide(),
  id: 'demo-guide-agurk-ai',
  plantName: 'Agurk',
  variety: 'Marketmore',
  latinName: 'Cucumis sativus',
  primaryCategoryId: 'fro',
  summary:
    'Automatisk genereret udkast om Marketmore. Genereret automatisk; gennemgå og tilpas efter dine forhold.',
  tags: [],
  difficulty: 'medium',
  quickFacts: {
    sowingMonths: [4, 5],
    directSowingMonths: [],
    plantingOutMonths: [6],
    harvestMonths: [7, 8, 9],
    preCultivation: true,
    light: 'full_sun',
    water: 'high',
    soil: 'Næringsrig, veldrænende.',
  },
  sections: [
    {
      key: 'intro',
      title: 'Om sorten',
      body:
        'Marketmore er en klassisk, pålidelig friland-agurk med jævne, mørkegrønne frugter. Velegnet til både drivhus og varmt friland.',
    },
    {
      key: 'pleje',
      title: 'Pleje gennem sæsonen',
      body:
        'Vand dybt og regelmæssigt — agurker har et stort vandbehov. Bind ranker op til snor eller net for at give bedre luftcirkulation. Gød hver 14. dag fra første blomst.',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir indenfor', recommendedMonths: [4, 5], priority: 'medium' },
    { taskType: 'plant_out', title: 'Plant ud i drivhus', recommendedMonths: [6], priority: 'high' },
    { taskType: 'harvest', title: 'Pluk agurker løbende', recommendedMonths: [7, 8, 9], priority: 'medium' },
  ],
  primaryImageId: '/images/plantekort/plantekort-agurk-marketmore.png',
  visibility: 'private',
}

// ════════════════════════════════════════════════════════════════
// EKSPORTER
// ════════════════════════════════════════════════════════════════

export const DEMO_POTALOT_GUIDES: Guide[] = [POTALOT_TOMAT, POTALOT_DAHLIA, POTALOT_HVIDLOG]
export const DEMO_EGNE_GUIDES: Guide[] = [EGEN_TOMAT_TILPASNING, EGEN_SUKKERAERT]
export const DEMO_AI_GUIDES: Guide[] = [AI_AGURK]

/**
 * IDs der i demo-laget skal vises som AI-udkast i stedet for "Egen guide".
 * Real-data path bruger ikke denne — alle private guides vises som
 * "Egen guide" indtil AI-generering rent faktisk er bygget og schemaet
 * får et eksplicit origin-felt.
 */
export const DEMO_AI_GUIDE_IDS: ReadonlySet<string> = new Set([AI_AGURK.id])

export const ALL_DEMO_GUIDES: Guide[] = [
  ...DEMO_POTALOT_GUIDES,
  ...DEMO_EGNE_GUIDES,
  ...DEMO_AI_GUIDES,
]
