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
import { IMPORTED_GUIDES } from './guides-imported'

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
      kind: 'guide',
      key: 'guide-knibning',
      slug: 'knibning-af-tomater',
      title: 'Sådan kniber du tomater',
      description:
        'Ranketomater som San Marzano danner løbende sideskud. Lær hvordan du styrer væksten og får mest muligt ud af planten.',
    },
    {
      key: 'host',
      title: 'Høst og opbevaring',
      body:
        'Pluk når frugterne er fuldt røde og let bløde. San Marzano kan plukkes lidt grønne og modnes på køkkenbordet hvis efteråret bliver koldt. Hold dem ved stuetemperatur — aldrig køleskab. Til konservering: blanchér 30 sekunder, pillet skinn af, og rull på glas eller frys.',
    },
    {
      kind: 'next',
      key: 'next-guide',
      title: 'Sammenlign med Roma',
      description:
        'Roma og San Marzano bliver ofte nævnt i samme åndedrag. Begge er klassiske pastatomater, men de adskiller sig i vækst, smag og anvendelse.',
      slug: 'demo-guide-tomat-roma',
      label: 'Læs om Roma',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir indenfor', recommendedMonths: [3, 4], priority: 'high' },
    { taskType: 'repot', title: 'Ompot til større potte', recommendedMonths: [4, 5], priority: 'medium' },
    { taskType: 'plant_out', title: 'Udplant i drivhus eller mod sydvæg', recommendedMonths: [5, 6], priority: 'high' },
    { taskType: 'pruning', title: 'Tyv tomatplanterne', recommendedMonths: [6, 7, 8], priority: 'medium' },
    { taskType: 'harvest', title: 'Høst modne frugter', recommendedMonths: [7, 8, 9], priority: 'high' },
  ],
  primaryImageId: '/images/plantekort/tomat-san-marzano.jpg',
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
    {
      kind: 'related',
      key: 'related-dahliaer',
      title: 'Andre dahliaer du måske vil se',
      items: [
        {
          slug: 'demo-guide-dahlia-karma-choc',
          heading: 'Karma Choc',
          description: 'Dyb burgunderrød dahlia med ekstra lang stilk — favorit til snitblomster.',
        },
        {
          slug: 'demo-guide-dahlia-linda-baby',
          heading: 'Linda’s Baby',
          description: 'Lille pompon-dahlia i blød rosa. Ideel til mindre buketter og krukker.',
        },
        {
          slug: 'demo-guide-dahlia-bishop',
          heading: 'Bishop of Llandaff',
          description: 'Mørkblade-dahlia med signalrøde enkeltblomster. Klassiker fra 1920’erne.',
        },
      ],
    },
    {
      kind: 'next',
      key: 'next-guide',
      title: 'Lær at overvintre dahliaer',
      description:
        'Café au Lait belønner den der gemmer knoldene varsomt om vinteren. Få styr på temperatur, fugt og opbevaring så de samme planter blomstrer igen næste år.',
      slug: 'overvintring-af-dahliaer',
      label: 'Sådan overvintrer du dahliaer',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir knolde i potte', recommendedMonths: [3, 4], priority: 'medium' },
    { taskType: 'plant_out', title: 'Plant ud i bedet', recommendedMonths: [5], priority: 'high' },
    { taskType: 'harvest', title: 'Pluk blomster løbende', recommendedMonths: [7, 8, 9, 10], priority: 'medium' },
    { taskType: 'maintenance', title: 'Grav op og overvintr knolde', recommendedMonths: [10, 11], priority: 'high' },
  ],
  primaryImageId: '/images/plantekort/dahlia-cafe-au-lait.jpg',
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

// Midlertidig demo-version af Agurk-artsguide.md indtil import-script lander.
const POTALOT_AGURK: Guide = {
  ...baseGuide(),
  guideLevel: 'species',
  parentGuideId: null,
  id: 'demo-guide-agurk-arts',
  plantName: 'Agurk',
  variety: null,
  latinName: 'Cucumis sativus',
  primaryCategoryId: 'fro',
  subcategoryId: 'groentsager',
  summary:
    'Agurk er en hurtigtvoksende og produktiv grøntsag, der trives i varme omgivelser. Med den rette mængde vand, næring og sol kan få planter levere et imponerende udbytte gennem hele sommeren.',
  tags: ['drivhus', 'friland', 'sommergrøntsag', 'køkkenhave', 'produktiv', 'spisekammer', 'selvforsyning'],
  quickFacts: {
    sowingMonths: [4, 5],
    directSowingMonths: [5, 6],
    plantingOutMonths: [5, 6],
    harvestMonths: [7, 8, 9],
    preCultivation: true,
    light: 'full_sun',
    water: 'regular',
    soil: 'Næringsrig, veldrænet og fugtighedsbevarende jord med højt indhold af organisk materiale.',
  },
  sections: [
    {
      key: 'om-planten',
      title: 'Om planten',
      body:
        'Agurk er en af køkkenhavens mest gavmilde planter. Giver du den varme, vand og næringsrig jord, kvitterer den med et imponerende udbytte gennem hele sommeren. Oprindeligt stammer agurken fra Sydasien, og i dag dyrkes den i et væld af sorter til både frisk brug og syltning. De fleste trives bedst i drivhus eller på en varm og beskyttet plads på friland.',
    },
    {
      key: 'typer',
      title: 'Forskellige typer agurker',
      body:
        'Når man taler om agurker, mener man ofte den lange grønne drivhusagurk fra supermarkedet. Men agurker findes i mange forskellige former og størrelser.\nDe fleste sorter kan groft opdeles i nogle få grupper:\n• Drivhusagurker — lange, glatte agurker dyrket under glas.\n• Frilandsagurker — robuste sorter til det danske sommervejr.\n• Drue- og sylteagurker — mindre agurker velegnet til syltning.\n• Snackagurker — små, søde agurker til frisk spisning.\n• Specialsorter — gamle kulturarvssorter eller sorter med særlige former, farver og smagsnuancer.\nDe grundlæggende dyrkningsprincipper er de samme, men nogle sorter er bedre tilpasset bestemte formål og voksesteder end andre.',
    },
    {
      kind: 'fact',
      key: 'fact-drivhus-friland',
      title: 'Drivhusagurk eller frilandsagurk?',
      variant: 'comparison',
      columns: [
        {
          heading: 'Drivhusagurk',
          items: [
            'Trives bedst under glas',
            'Giver ofte lange glatte frugter',
            'Har brug for varme hele sæsonen',
            'Mange sorter er selvfertile',
          ],
        },
        {
          heading: 'Frilandsagurk',
          items: [
            'Mere robust over for dansk sommervejr',
            'Egner sig til bede og højbede',
            'Bestøves normalt af insekter',
            'Velegnet til syltning og frisk brug',
          ],
        },
      ],
    },
    {
      key: 'sma-haver',
      title: 'Agurker i små haver og vindueskarme',
      body:
        'Agurker forbindes ofte med drivhuse og køkkenhaver, men flere sorter egner sig også til dyrkning på altaner, terrasser og i lyse vinduer.\nI de senere år har mange dyrkere fået øjnene op for at lade slyngplanter vokse op ad snore eller espalier indendørs. Det giver ikke blot høst på begrænset plads, men kan også fungere som en levende grøn væg med spiselige frugter.\nIkke alle sorter egner sig til formålet, men kompakte sorter og snackagurker kan ofte dyrkes overraskende succesfuldt i store krukker og selvvandende beholdere.',
    },
    {
      key: 'forspiring',
      title: 'Forspiring eller direkte såning',
      body:
        'Agurker elsker varme. Derfor vælger mange at forspire dem indendørs i april eller maj for at få en tidligere høst.\nFrøene spirer hurtigt, og planterne vokser ofte overraskende hurtigt allerede de første uger. Pas på ikke at starte for tidligt. Store agurkeplanter på en vindueskarm bliver hurtigt besværlige at håndtere.\nPå lune voksesteder kan agurker også sås direkte, når jorden er blevet varm.',
    },
    {
      key: 'udplantning',
      title: 'Udplantning',
      body:
        'Agurker er følsomme over for kulde. Vent med udplantning til risikoen for nattefrost er ovre, og jorden har fået temperatur.\nPlanterne trives bedst i næringsrig jord med masser af kompost. Vælg en placering med læ, varme og så meget sol som muligt.\nAgurker kan dyrkes både i bede, højbede, krukker og forskellige former for selvvandende dyrkningssystemer. Fælles for dem alle er, at planterne har brug for rigelig adgang til både vand og næring gennem hele sæsonen.',
    },
    {
      key: 'pleje',
      title: 'Pleje gennem sæsonen',
      body:
        'Agurker vokser hurtigt og har et stort behov for både vand og næring.\nJævn vanding giver de bedste frugter. Hvis planterne skiftevis tørrer ud og druknes, kan frugterne blive bitre eller udvikle sig ujævnt.',
    },
    {
      kind: 'guide',
      key: 'guide-opbinding',
      slug: 'opbinding-af-agurker',
      title: 'Sådan opbinder du agurker',
      description:
        'Mange agurkesorter giver et bedre udbytte og fylder mindre, når de dyrkes op ad snor eller espalier.',
    },
    {
      kind: 'guide',
      key: 'guide-beskaering',
      slug: 'beskaering-af-agurker',
      title: 'Sådan beskærer du agurker',
      description:
        'Beskæring kan give bedre luft omkring planterne, mindske sygdomspres og gøre det lettere at styre væksten i drivhuset.',
    },
    {
      kind: 'guide',
      key: 'guide-knibning',
      slug: 'knibning-af-agurker',
      title: 'Sådan kniber du agurker',
      description:
        'Lær hvornår og hvordan du kniber sideskud og vækstpunkter, så planten bruger energien dér, hvor den giver mest værdi.',
    },
    {
      key: 'sygdomme',
      title: 'Sygdomme og udfordringer',
      body:
        'Agurker fortæller hurtigt, når noget er galt. Mangler de vand, hænger bladene. Mangler de varme, stopper væksten næsten fra den ene dag til den anden.\nDen mest almindelige udfordring er meldug sidst på sommeren. Sørg for god luft omkring planterne, høst løbende og undgå unødigt stress. Stærke planter klarer som regel sæsonen bedst.',
    },
    {
      key: 'bestoevning',
      title: 'Blomster og bestøvning',
      body:
        'Agurker danner både han- og hunblomster. Hunblomsterne kan kendes på den lille agurk, der sidder bag blomsten, mens hanblomsterne sidder direkte på stilken.\nMange moderne drivhusagurker er selvfertile eller partenokarpe. Det betyder, at de kan udvikle frugter uden bestøvning. Andre sorter er afhængige af pollen fra hanblomster og hjælp fra bier eller andre insekter.\nPå friland klarer bestøverne som regel arbejdet uden hjælp. I drivhus kan manglende bestøvning føre til små frugter, der stopper væksten eller falder af.',
    },
    {
      kind: 'guide',
      key: 'guide-bestoevning',
      slug: 'bestoevning-af-agurker',
      title: 'Sådan bestøver du agurker',
      description:
        'Lær forskellen på han- og hunblomster, og hvornår du eventuelt skal hjælpe naturen lidt på vej.',
    },
    {
      key: 'host',
      title: 'Høst',
      body:
        'Agurker høstes bedst løbende.\nJo flere frugter du plukker, desto flere nye vil planten typisk danne. Lader du mange agurker sidde og blive store, bruger planten energi på frøudvikling i stedet for nye frugter.',
    },
    {
      key: 'fejl',
      title: 'Typiske fejl',
      body:
        '• At være for ivrig om foråret. Agurker elsker varme og belønner sjældent den første udplantning.\n• At vande for lidt i varme perioder. Få planter reagerer så hurtigt på tørke som agurker.\n• At glemme, hvor store planterne bliver. Det, der ligner en lille plante i juni, kan ligne en jungle i august.\n• At lade frugterne hænge for længe. Regelmæssig høst giver som regel flere agurker.\n• At spare på næringen. Agurker er blandt køkkenhavens mest sultne planter.\n• At bekymre sig for sent om luftcirkulation. Tætte planter giver lettere problemer med meldug sidst på sæsonen.',
    },
    {
      key: 'potalot-note',
      title: 'Potalot-note',
      body:
        'Der findes grøntsager, som kræver tålmodighed. Agurker er ikke en af dem. Når først planten har fået fat, går der sjældent mange dage mellem hver høst.',
    },
    {
      kind: 'next',
      key: 'next-marketmore',
      title: 'Vælg en sort',
      description:
        'Nogle agurker er skabt til drivhuset, andre til friland. Nogle er bedst friske, andre til syltning.',
      slug: 'demo-guide-agurk-marketmore',
      label: 'Læs om Agurk Marketmore',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir agurker indendørs', recommendedMonths: [4, 5], priority: 'high' },
    { taskType: 'plant_out', title: 'Udplant når jorden er varm', recommendedMonths: [5, 6], priority: 'high' },
    { taskType: 'harvest', title: 'Høst løbende', recommendedMonths: [7, 8, 9], priority: 'medium' },
  ],
  primaryImageId: '/images/arts/agurk.jpg',
  visibility: 'public',
}

// Midlertidig demo-version af Tomat-artsguide.md indtil import-script lander.
const POTALOT_TOMAT_ARTS: Guide = {
  ...baseGuide(),
  guideLevel: 'species',
  parentGuideId: null,
  id: 'demo-guide-tomat-arts',
  plantName: 'Tomat',
  variety: null,
  latinName: 'Solanum lycopersicum',
  primaryCategoryId: 'fro',
  subcategoryId: 'groentsager',
  summary:
    'Tomater elsker varme, lys og en lang sæson. Starter du dem tidligt og giver dem stabile forhold, kan de belønne dig hele sommeren.',
  tags: ['drivhus', 'varmekraevende', 'klassiker', 'sommer', 'spisekammer'],
  quickFacts: {
    sowingMonths: [3, 4],
    directSowingMonths: [],
    plantingOutMonths: [5, 6],
    harvestMonths: [7, 8, 9],
    preCultivation: true,
    light: 'full_sun',
    water: 'regular',
    soil: 'Næringsrig, veldrænende muldjord med jævn fugt.',
  },
  sections: [
    {
      key: 'om-arten',
      title: 'Om arten',
      body:
        'Tomater stammer oprindeligt fra Sydamerika og dyrkes i dag over hele verden. Tomater findes i et enormt antal former, størrelser og farver. Nogle dyrkes for deres sødme, andre for deres høje udbytte eller særlige anvendelse i køkkenet.\nTomater er varmeelskende planter med en lang sæson. De fleste sorter trives bedst, når de får en tidlig start indendørs, masser af lys og en lun placering senere på året. I Danmark dyrker mange tomater i drivhus, men flere sorter kan også klare sig på en varm altan eller et læfyldt sted på friland.',
    },
    {
      kind: 'fact',
      key: 'fact-rank-busk',
      title: 'Tomater findes som to typer vækstformer',
      variant: 'comparison',
      columns: [
        {
          heading: 'Ranketomat',
          items: ['Vokser i højden hele sæsonen', 'Skal opbindes', 'Sideskud skal knibes'],
        },
        {
          heading: 'Busktomat',
          items: ['Lavtvoksende og kompakt', 'Velegnet til krukker', 'Kræver sjældent opbinding', 'Sideskud skal ikke knibes'],
        },
      ],
    },
    {
      key: 'sorter-formaal',
      title: 'Sortsvalg afhænger af formålet',
      body:
        'Tomater dyrkes til forskellige formål. Nogle sorter egner sig bedst til frisk spisning, andre til sauce, tørring eller konservering. Før du vælger sort, kan det derfor være en fordel at overveje, hvordan du ønsker at bruge høsten.',
    },
    {
      key: 'typer',
      title: 'Forskellige typer tomater',
      body:
        'Tomater findes i et væld af former, størrelser og smagsretninger. Selvom de grundlæggende dyrkes på samme måde, har de forskellige styrker i køkkenet og haven.\nDe fleste sorter kan groft opdeles i nogle få grupper:\n• Cherrytomater — små, søde tomater til frisk spisning.\n• Cocktailtomater — lidt større end cherrytomater med god balance mellem sødme og syre.\n• Salattomater — klassiske allround-tomater til madpakken og salatskålen.\n• Bøftomater — store, kødfulde tomater med få kerner.\n• Pastatomater — aflange tomater med fast frugtkød og lavt vandindhold.\n• Specialsorter — gamle kulturarvssorter eller sorter med særlige former, farver og smagsnuancer.\nDe grundlæggende dyrkningsprincipper er de samme, men valget af sort har stor betydning for både smag, udbytte og anvendelse.',
    },
    {
      key: 'arvesorter',
      title: 'Arvesorter, F1-hybrider og frøægte sorter',
      body:
        'Når du vælger tomater, støder du ofte på begreber som F1, arvesort eller frøægte.\n• F1-hybrider er krydsninger udviklet for at give ensartede planter, højt udbytte eller bedre sygdomsresistens.\n• Frøægte sorter (Open Pollinated) giver afkom, der ligner moderplanten, hvis du selv gemmer frø.\n• Arvesorter (Heirloom) er gamle, frøægte sorter, som ofte er blevet dyrket gennem generationer.\nDer findes fremragende tomater i alle tre grupper. Valget handler ofte om, hvad du vægter højest: udbytte, robusthed, smag eller muligheden for selv at gemme frø.',
    },
    {
      key: 'forspiring',
      title: 'Forspiring eller direkte såning',
      body:
        'I dansk klima bør de fleste tomater forspires indendørs.\nSø frøene i marts eller april i fugtig så- og priklejord. Frøene spirer typisk efter 5-10 dage ved temperaturer omkring 20-25 °C. For tidlig såning giver ofte lange og svage planter, mens for sen såning forkorter høstsæsonen.\nNår spirerne bryder frem, skal de have så meget lys som muligt, så planterne ikke bliver lange og svage. Når planterne har udviklet deres første rigtige bladpar, prikles de om i individuelle potter. Plant dem gerne en smule dybere, end de stod før. Tomater kan danne rødder langs stænglen, og det giver ofte en stærkere plante.',
    },
    {
      key: 'udplantning',
      title: 'Udplantning',
      body:
        'Vent med udplantning til nætterne er lune, og risikoen for frost er væk. Tomater bryder sig ikke om kulde. I drivhus kan du ofte plante ud tidligere end på friland, og i opvarmet drivhus endnu tidligere — men hold stadig øje med nattetemperaturerne.\nPlant tomater dybt i næringsrig jord og giv dem plads til luft omkring bladene. Ranketomater skal have støtte fra begyndelsen, så planten ikke vælter, når den sætter frugt.',
    },
    {
      kind: 'guide',
      key: 'guide-opbinding',
      slug: 'opbinding-af-tomater',
      title: 'Sådan opbinder du tomater',
      description: 'Lær hvordan du opbinder tomater og undgår knækkede planter.',
    },
    {
      key: 'pleje',
      title: 'Pleje gennem sæsonen',
      body:
        'Vand jævnt og roligt. Tomater trives dårligt, hvis de skiftevis tørrer ud og drukner. Ujævn vanding kan give revnede frugter og stressede planter.\nHøje ranketomater skal løbende bindes op og have fjernet sideskud.',
    },
    {
      kind: 'guide',
      key: 'guide-knibning',
      slug: 'knibning-af-tomater',
      title: 'Sådan kniber du tomater',
      description: 'Lær hvilke sideskud der skal fjernes, og hvornår det giver mening.',
    },
    {
      key: 'sygdomme',
      title: 'Sygdomme og udfordringer',
      body:
        'Tomater kan rammes af blandt andet kartoffelskimmel, griffelråd og revnede frugter. De fleste tomatproblemer skyldes dyrkningsforholdene og ikke selve planten. Stabil vanding, god luftcirkulation og passende næring forebygger langt de fleste udfordringer.',
    },
    {
      key: 'host',
      title: 'Høst',
      body:
        'Tomater smager allerbedst, når de får lov at modne på planten så længe som muligt. Høstes når de har fået fuld farve og slipper let fra stilken. Pluk løbende, så planten bruger energi på nye frugter. Mod slutningen af sæsonen kan du tage næsten modne tomater ind og lade dem eftermodne mørkt og ved stuetemperatur.',
    },
    {
      key: 'fejl',
      title: 'Typiske fejl',
      body:
        '• Utålmodighed og såning for tidligt på året\n• For lidt lys under forspiring giver lange, svage planter\n• For tidlig udplantning giver stressede planter\n• Ujævn vanding kan give revnede frugter\n• Manglende opbinding af høje sorter\n• Overgødskning med kvælstof giver mange blade og færre tomater',
    },
    {
      key: 'potalot-note',
      title: 'Potalot-note',
      body:
        'Tomater belønner den rolige gartner. Giv dem varme, lys og jævn pleje, så skal de nok gøre deres del.',
    },
    {
      kind: 'next',
      key: 'next-guide',
      title: 'Vælg en sort',
      description: 'Ikke alle tomater dyrkes ens. Udforsk nogle af de mest populære sorter.',
      slug: 'demo-guide-tomat-sm',
      label: 'Læs om Tomat San Marzano',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir tomater indendørs', recommendedMonths: [3, 4], priority: 'high' },
    { taskType: 'repot', title: 'Prikl tomatplanter om', recommendedMonths: [4, 5], priority: 'medium' },
    { taskType: 'plant_out', title: 'Plant tomater ud', recommendedMonths: [5, 6], priority: 'high' },
    { taskType: 'pruning', title: 'Knib sideskud på ranketomater', recommendedMonths: [5, 6, 7], priority: 'high' },
    { taskType: 'maintenance', title: 'Bind tomater op', recommendedMonths: [6, 7, 8], priority: 'medium' },
    { taskType: 'harvest', title: 'Høst tomater løbende', recommendedMonths: [7, 8, 9], priority: 'medium' },
  ],
  primaryImageId: '/images/arts/tomat.jpg',
  visibility: 'public',
}

// Thin placeholder så arts/chili.jpg kan ses indtil rigtig
// chili-artsguide.md skrives og importeres.
const POTALOT_CHILI: Guide = {
  ...baseGuide(),
  guideLevel: 'species',
  parentGuideId: null,
  id: 'demo-guide-chili-arts',
  plantName: 'Chili',
  variety: null,
  latinName: 'Capsicum',
  primaryCategoryId: 'fro',
  subcategoryId: 'groentsager',
  summary:
    'Chili er den lange-sæson-grøntsag. Forspires tidligt, plantes ud sent, høstes hele eftersommeren. Belønningen er ekstrem smagskoncentration — fra mild sødme til brændende heat.',
  tags: ['drivhus', 'varmekraevende', 'krydderi', 'lang-saeson'],
  quickFacts: {
    sowingMonths: [1, 2, 3],
    directSowingMonths: [],
    plantingOutMonths: [5, 6],
    harvestMonths: [8, 9, 10],
    preCultivation: true,
    light: 'full_sun',
    water: 'regular',
    soil: 'Næringsrig, veldrænende, gerne let sandet.',
  },
  sections: [
    {
      key: 'placeholder',
      title: 'Om arten',
      body:
        'Chili-artsguiden er endnu ikke skrevet i sin fulde form. Den kommer snart — med oprindelse, vækstform, og hvad der adskiller en mild paprika fra en brændende habanero.',
    },
    {
      key: 'potalot-note',
      title: 'Potalot-note',
      body:
        'Chili tester tålmodigheden allerede ved såningen. Den belønner den der venter — og dyrker den i drivhus eller den varmeste plet på terrassen.',
    },
  ],
  calendarRules: [
    { taskType: 'sowing', title: 'Forspir chili indendørs', recommendedMonths: [1, 2, 3], priority: 'high' },
    { taskType: 'plant_out', title: 'Udplant i drivhus', recommendedMonths: [5, 6], priority: 'high' },
    { taskType: 'harvest', title: 'Høst når frugterne har farve', recommendedMonths: [8, 9, 10], priority: 'medium' },
  ],
  primaryImageId: '/images/arts/chili.jpg',
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
  primaryImageId: '/images/plantekort/tomat-san-marzano.jpg',
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
  primaryImageId: '/images/plantekort/aert-sugar-snap.jpg',
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
  primaryImageId: '/images/plantekort/agurk-marketmore.jpg',
  visibility: 'private',
}

// ════════════════════════════════════════════════════════════════
// EKSPORTER
// ════════════════════════════════════════════════════════════════

export const DEMO_POTALOT_GUIDES: Guide[] = [POTALOT_TOMAT, POTALOT_DAHLIA, POTALOT_HVIDLOG, POTALOT_AGURK, POTALOT_TOMAT_ARTS, POTALOT_CHILI]
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

/**
 * App-vendt guide-samling.
 *
 * Imported guides (fra content/guides/*.md → guides-imported.ts) er
 * **primær kilde**. Demo-guides bruges som fallback for slugs som
 * importen endnu ikke dækker (fx hvidloeg, sukkeraert, AI-udkast).
 *
 * Når importen dækker alle render-stier, kan guides-demo.ts slettes
 * og denne konstant erstattes af IMPORTED_GUIDES direkte.
 */
export const ALL_GUIDES: Guide[] = (() => {
  // Dedup på plante+sort (ikke kun id): demo-guiderne har LEGACY-id'er
  // (`demo-guide-agurk-arts`), mens importen har rene slugs (`agurk`) — samme
  // plante, forskelligt id. Id-dedup alene lod dem vises DOBBELT i biblioteket.
  const keyOf = (g: Guide) => `${g.plantName}|${g.variety ?? ''}`.toLowerCase().trim()
  const importedIds = new Set(IMPORTED_GUIDES.map((g) => g.id))
  const importedKeys = new Set(IMPORTED_GUIDES.map(keyOf))
  const demoFallback = ALL_DEMO_GUIDES.filter((g) => {
    if (importedIds.has(g.id)) return false
    // Demo-POTALOT-guides som importen allerede dækker (samme plante+sort)
    // droppes → ingen dubletter. Egne guider + AI-udkast beholdes (eget lag,
    // vises ikke i biblioteket) selvom sorten også findes i importen.
    if (DEMO_POTALOT_GUIDES.includes(g) && importedKeys.has(keyOf(g))) return false
    return true
  })
  return [...IMPORTED_GUIDES, ...demoFallback]
})()
