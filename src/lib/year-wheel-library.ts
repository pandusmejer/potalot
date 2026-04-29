/**
 * Bibliotek af generelle haveopgaver pr. måned. Spec sektion 9.
 *
 * Disse er ikke plante-specifikke — de er almene gøremål alle haver
 * har gavn af på et givent tidspunkt. Brugeren kan tilføje dem
 * til Mine opgaver med ét klik (eller bulk).
 */

export type YearWheelCategory =
  | 'jord' | 'saaning' | 'plantning' | 'beskaering' | 'vanding' | 'goedning'
  | 'plaene' | 'skadedyr' | 'hoest' | 'drivhus' | 'krukker' | 'frugt-baer'
  | 'pryd' | 'haek' | 'dyreliv' | 'vinterklargoering' | 'planlaegning'

export type YearWheelPriority = 'high' | 'medium' | 'low'

export type YearWheelTimeWindow =
  | 'early_month' | 'mid_month' | 'late_month' | 'all_month'
  | 'after_frost' | 'when_soil_ready' | 'when_growth_starts' | 'before_frost'

export interface YearWheelTask {
  id: string
  month: number          // 1-12
  title: string
  description: string
  category: YearWheelCategory
  priority: YearWheelPriority
  timeWindow: YearWheelTimeWindow
  tip?: string
}

export const CATEGORY_LABELS: Record<YearWheelCategory, string> = {
  jord: 'Jord',
  saaning: 'Såning',
  plantning: 'Plantning',
  beskaering: 'Beskæring',
  vanding: 'Vanding',
  goedning: 'Gødning',
  plaene: 'Plæne',
  skadedyr: 'Skadedyr',
  hoest: 'Høst',
  drivhus: 'Drivhus',
  krukker: 'Krukker',
  'frugt-baer': 'Frugt og bær',
  pryd: 'Pryd',
  haek: 'Hæk',
  dyreliv: 'Dyreliv',
  vinterklargoering: 'Vinterklargøring',
  planlaegning: 'Planlægning',
}

export const TIME_WINDOW_LABELS: Record<YearWheelTimeWindow, string> = {
  early_month: 'Tidligt i måneden',
  mid_month: 'Midt i måneden',
  late_month: 'Sent i måneden',
  all_month: 'Hele måneden',
  after_frost: 'Efter første nattefrost',
  when_soil_ready: 'Når jorden er tjenlig',
  when_growth_starts: 'Når væksten starter',
  before_frost: 'Inden første nattefrost',
}

export const PRIORITY_LABELS: Record<YearWheelPriority, string> = {
  high: 'Høj',
  medium: 'Middel',
  low: 'Lav',
}

export const YEAR_WHEEL_TASKS: YearWheelTask[] = [
  // ============ JANUAR ============
  { id: 'yw-01-01', month: 1, title: 'Planlæg dyrkningsåret', description: 'Skitsér hvad du vil dyrke, hvor, og i hvilken rækkefølge.', category: 'planlaegning', priority: 'medium', timeWindow: 'all_month', tip: 'Brug en plan for at undgå at samme bed dyrkes med samme art år efter år.' },
  { id: 'yw-01-02', month: 1, title: 'Bestil frø', description: 'Lav indkøbslisten og bestil før de populære sorter er udsolgt.', category: 'planlaegning', priority: 'high', timeWindow: 'early_month' },
  { id: 'yw-01-03', month: 1, title: 'Tjek frølager', description: 'Smid udløbne frø ud, kassér poser med dårlig kvalitet.', category: 'planlaegning', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-01-04', month: 1, title: 'Beskær frugttræer', description: 'Frostfri dage er gode til vinterbeskæring af æble, pære og blomme.', category: 'beskaering', priority: 'medium', timeWindow: 'all_month', tip: 'Undgå dage med stærk frost — sårene heler dårligt.' },
  { id: 'yw-01-05', month: 1, title: 'Rens redskaber', description: 'Skarp saks, ren spade. Slib og olié inden sæsonen.', category: 'vinterklargoering', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-01-06', month: 1, title: 'Beskyt mod sneknæk', description: 'Ryst sne af buske og grene så de ikke knækker.', category: 'vinterklargoering', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-01-07', month: 1, title: 'Foder til vilde fugle', description: 'Hold fuglefoderautomater fyldt — vinteren er hård.', category: 'dyreliv', priority: 'low', timeWindow: 'all_month' },

  // ============ FEBRUAR ============
  { id: 'yw-02-01', month: 2, title: 'Forspir chili og peber', description: 'Tidlig forspiring giver længere sæson — chili tager 5-6 mdr fra frø til frugt.', category: 'saaning', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-02-02', month: 2, title: 'Rengør drivhuset', description: 'Vask ruder indvendigt, fjern skrald, klargør borde.', category: 'drivhus', priority: 'high', timeWindow: 'late_month' },
  { id: 'yw-02-03', month: 2, title: 'Beskær frugttræer', description: 'Sidste chance for vinterbeskæring inden saften stiger.', category: 'beskaering', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-02-04', month: 2, title: 'Beskær buske som blomstrer på årets skud', description: 'Sommerflox, hortensia paniculata, sommerfluebusk.', category: 'beskaering', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-02-05', month: 2, title: 'Tjek frostbeskyttelse', description: 'Tjek vinterdække på roser og staudere efter sneens vægt.', category: 'vinterklargoering', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-02-06', month: 2, title: 'Bestil resterende frø', description: 'Hvis du ikke nåede det i januar — last call.', category: 'planlaegning', priority: 'medium', timeWindow: 'early_month' },

  // ============ MARTS ============
  { id: 'yw-03-01', month: 3, title: 'Forspir tomat og aubergine', description: 'Tomater forspires 6-8 uger før udplantning — start nu.', category: 'saaning', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-03-02', month: 3, title: 'Forspir kål og porre', description: 'Sås indendørs eller i koldhus.', category: 'saaning', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-03-03', month: 3, title: 'Ryd bede for vinter-affald', description: 'Fjern visne stængler og blade — men efterlad noget til insekter.', category: 'jord', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-03-04', month: 3, title: 'Spred kompost', description: 'Fordel kompost i bede når jorden er tjenlig.', category: 'jord', priority: 'high', timeWindow: 'when_soil_ready', tip: 'Undgå at arbejde våd jord — det ødelægger strukturen.' },
  { id: 'yw-03-05', month: 3, title: 'Beskær roser', description: 'Hovedbeskæring af buskroser når knopperne svulmer.', category: 'beskaering', priority: 'high', timeWindow: 'late_month' },
  { id: 'yw-03-06', month: 3, title: 'Plant løgblomster (sommerblomstrende)', description: 'Dahlia, gladiolus i krukker indendørs til forspiring.', category: 'plantning', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-03-07', month: 3, title: 'Tjek pH og næring i jorden', description: 'Tag jordprøver hvis du har problemer med vækst.', category: 'jord', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-03-08', month: 3, title: 'Klargør drivhus til såning', description: 'Vask, vand, klargør bordene og jord.', category: 'drivhus', priority: 'high', timeWindow: 'early_month' },

  // ============ APRIL ============
  { id: 'yw-04-01', month: 4, title: 'Direkte såning af kolde-tolerante grøntsager', description: 'Spinat, salat, radiser, ærter, gulerødder — direkte i jorden.', category: 'saaning', priority: 'high', timeWindow: 'when_soil_ready' },
  { id: 'yw-04-02', month: 4, title: 'Forspir agurk og squash', description: 'Indendørs eller i drivhus — disse vil ikke have kuldegrader.', category: 'saaning', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-04-03', month: 4, title: 'Plant kartofler', description: 'Læggekartofler kommer i jorden — chitterede er allerede klar.', category: 'plantning', priority: 'high', timeWindow: 'mid_month' },
  { id: 'yw-04-04', month: 4, title: 'Bekæmp ukrudt tidligt', description: 'Hak før de når at sætte frø. En times arbejde nu sparer fem timer i juni.', category: 'jord', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-04-05', month: 4, title: 'Tjek snegle', description: 'Tjek under sten og brædder. Læg fælder ud før de bliver mange.', category: 'skadedyr', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-04-06', month: 4, title: 'Start sæsongødskning', description: 'Tilfør langsom-virkende gødning til bede med stort næringsbehov.', category: 'goedning', priority: 'medium', timeWindow: 'mid_month' },
  { id: 'yw-04-07', month: 4, title: 'Klip plæne første gang', description: 'Når græsset er højt nok — sæt klingerne højt første gang.', category: 'plaene', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-04-08', month: 4, title: 'Plant stikkelsbær og ribs', description: 'Bare-rod-planter går i jorden så længe de stadig sover.', category: 'frugt-baer', priority: 'medium', timeWindow: 'early_month' },
  { id: 'yw-04-09', month: 4, title: 'Hærd forspirede planter', description: 'Begynd at sætte forspirede planter ud om dagen så de tilvænnes.', category: 'plantning', priority: 'high', timeWindow: 'late_month' },

  // ============ MAJ ============
  { id: 'yw-05-01', month: 5, title: 'Udplant tomater og agurker', description: 'Efter sidste forventede nattefrost — typisk efter 15. maj.', category: 'plantning', priority: 'high', timeWindow: 'after_frost' },
  { id: 'yw-05-02', month: 5, title: 'Direkte såning af bønner', description: 'Bondebønner allerede, brydbønner og pralbønner sidst i maj.', category: 'saaning', priority: 'high', timeWindow: 'mid_month' },
  { id: 'yw-05-03', month: 5, title: 'Vand nyplantede planter', description: 'Maj kan være tør — hold nyplantede fugtige indtil de er etablerede.', category: 'vanding', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-05-04', month: 5, title: 'Tjek for bladlus', description: 'Bladlus kommer med varmen. Tjek under blade på roser og kål.', category: 'skadedyr', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-05-05', month: 5, title: 'Klip hæk for første gang', description: 'Tidlig forsommer-klipning før fuglene yngler tungt.', category: 'haek', priority: 'medium', timeWindow: 'early_month', tip: 'Tjek for fuglereder før du klipper — er der reder, så vent.' },
  { id: 'yw-05-06', month: 5, title: 'Stik fra stauder', description: 'Mange stauder kan deles og formeres nu.', category: 'plantning', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-05-07', month: 5, title: 'Plant ud sommerblomster', description: 'Pelargonier, lobelia, petunia — efter sidste nattefrost.', category: 'krukker', priority: 'medium', timeWindow: 'after_frost' },
  { id: 'yw-05-08', month: 5, title: 'Luft drivhuset', description: 'Åbn vinduer og døre om dagen — lukker om aftenen.', category: 'drivhus', priority: 'high', timeWindow: 'all_month' },

  // ============ JUNI ============
  { id: 'yw-06-01', month: 6, title: 'Vand regelmæssigt', description: 'Hellere længe og dybt end ofte og overfladisk.', category: 'vanding', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-06-02', month: 6, title: 'Knib tomatside-skud', description: 'Stor-tomater knibes — buske ikke. Hold dem til 1-2 hovedstammer.', category: 'beskaering', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-06-03', month: 6, title: 'Høst første jordbær', description: 'Plads aller tilfredsstillende del af haveåret.', category: 'hoest', priority: 'medium', timeWindow: 'mid_month' },
  { id: 'yw-06-04', month: 6, title: 'Gød tomater og peber ugentligt', description: 'Frugtbærende grøntsager i drivhus har stort kalium-behov.', category: 'goedning', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-06-05', month: 6, title: 'Klip plæne ugentligt', description: 'Hold græsset omkring 5 cm — ikke kortere i tørke.', category: 'plaene', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-06-06', month: 6, title: 'Bekæmp ukrudt før blomstring', description: 'Hak ukrudt mens det er småt — én ukrudtsplante = 1000 frø.', category: 'jord', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-06-07', month: 6, title: 'Tjek for meldug og skimmel', description: 'Roser, agurker, courgetter — fjern angrebne blade tidligt.', category: 'skadedyr', priority: 'medium', timeWindow: 'all_month' },

  // ============ JULI ============
  { id: 'yw-07-01', month: 7, title: 'Høst regelmæssigt', description: 'Mange grøntsager (squash, agurk, bønner) sætter mere når der høstes ofte.', category: 'hoest', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-07-02', month: 7, title: 'Vand i tørke', description: 'Juli er ofte tør. Vand morgen eller aften, ikke midt på dagen.', category: 'vanding', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-07-03', month: 7, title: 'Klip lavendel efter blomstring', description: 'Klip lette tilbage til kompakt form — undgå at klippe i gammelt ved.', category: 'beskaering', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-07-04', month: 7, title: 'Så efterårssalat', description: 'Anden runde salat, spinat, radiser til efteråret.', category: 'saaning', priority: 'medium', timeWindow: 'mid_month' },
  { id: 'yw-07-05', month: 7, title: 'Klip hæk anden gang', description: 'Sommerklipning — fugleyngel-sæson er som regel slut.', category: 'haek', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-07-06', month: 7, title: 'Gød krukker hver uge', description: 'Krukker har lille jordvolumen — næring vaskes hurtigt ud.', category: 'goedning', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-07-07', month: 7, title: 'Tjek for kålsommerfugl', description: 'Fjern æg på undersiden af kålblade. Brug net hvis mange.', category: 'skadedyr', priority: 'medium', timeWindow: 'all_month' },

  // ============ AUGUST ============
  { id: 'yw-08-01', month: 8, title: 'Høst tomater regelmæssigt', description: 'Pluk når de er modne — ikke for tidligt, ikke for sent.', category: 'hoest', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-08-02', month: 8, title: 'Plant jordbær til næste år', description: 'Augusts plantning giver bedst høst næste år.', category: 'frugt-baer', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-08-03', month: 8, title: 'Så grønne efterafgrøder', description: 'Olie-rædike eller honningurt på tomme bede — bedre jord til næste år.', category: 'jord', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-08-04', month: 8, title: 'Vand grundigt i varme', description: 'Sommerens hede har slidt på jorden — vand dybt.', category: 'vanding', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-08-05', month: 8, title: 'Toptap tomatplanter', description: 'Knip toppen så planten lægger energi i de eksisterende frugter.', category: 'beskaering', priority: 'medium', timeWindow: 'mid_month' },
  { id: 'yw-08-06', month: 8, title: 'Plant efterårsblomster i krukker', description: 'Lyng, asters, prydkål — hold farve i haven til langt ind i efteråret.', category: 'krukker', priority: 'low', timeWindow: 'late_month' },

  // ============ SEPTEMBER ============
  { id: 'yw-09-01', month: 9, title: 'Tag æbler hjem', description: 'Plukke når de slipper let. Lagring kræver kølige, fugtige rum.', category: 'hoest', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-09-02', month: 9, title: 'Plant blomsterløg', description: 'Tulipan, narcis, krokus — i jorden inden frosten.', category: 'plantning', priority: 'high', timeWindow: 'all_month' },
  { id: 'yw-09-03', month: 9, title: 'Plant nye buske og træer', description: 'Bare-rod og POT-planter etablerer sig godt i kølig, fugtig jord.', category: 'plantning', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-09-04', month: 9, title: 'Indsaml frø', description: 'Tør frø af egne planter til næste år.', category: 'planlaegning', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-09-05', month: 9, title: 'Klip plæne sidste gang', description: 'Sæt klingerne lidt højere før vinteren.', category: 'plaene', priority: 'medium', timeWindow: 'late_month' },
  { id: 'yw-09-06', month: 9, title: 'Beskyt drivhus mod efterårstorm', description: 'Tjek glasruder og fastgørelse før de første efterårsstorme.', category: 'drivhus', priority: 'medium', timeWindow: 'all_month' },

  // ============ OKTOBER ============
  { id: 'yw-10-01', month: 10, title: 'Plant blomsterløg færdig', description: 'Sidste chance før jorden bliver for kold og våd.', category: 'plantning', priority: 'high', timeWindow: 'early_month' },
  { id: 'yw-10-02', month: 10, title: 'Riv blade fra plæne', description: 'Blade kvæler græsset — riv eller klip dem til kompostbunken.', category: 'plaene', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-10-03', month: 10, title: 'Klargør krukker til vinter', description: 'Sårbare krukker ind under tag — andre dækkes mod frost.', category: 'krukker', priority: 'high', timeWindow: 'before_frost' },
  { id: 'yw-10-04', month: 10, title: 'Grav nye bede', description: 'Vintertimerne tager fat på jorden så strukturen forbedres til foråret.', category: 'jord', priority: 'low', timeWindow: 'late_month' },
  { id: 'yw-10-05', month: 10, title: 'Skær stauder ned', description: 'Mange kan klippes til 10-20 cm — andre lader man stå til insekter.', category: 'beskaering', priority: 'medium', timeWindow: 'late_month', tip: 'Lad solhat, salvie og andre med strukturelle frøstande stå.' },
  { id: 'yw-10-06', month: 10, title: 'Plant hvidløg', description: 'Hvidløg vil have kulde for at danne fed — plant nu.', category: 'plantning', priority: 'medium', timeWindow: 'mid_month' },
  { id: 'yw-10-07', month: 10, title: 'Indsaml æbler og pærer', description: 'Tag mest mulig hjem — fald frugt rådner og tiltrækker hvepse.', category: 'hoest', priority: 'medium', timeWindow: 'all_month' },

  // ============ NOVEMBER ============
  { id: 'yw-11-01', month: 11, title: 'Dæk roser til vinter', description: 'Hyld jord op om basen og dæk med granris.', category: 'vinterklargoering', priority: 'high', timeWindow: 'before_frost' },
  { id: 'yw-11-02', month: 11, title: 'Tøm vandhaner og slanger', description: 'Vand der fryser i rør sprænger dem.', category: 'vinterklargoering', priority: 'high', timeWindow: 'before_frost' },
  { id: 'yw-11-03', month: 11, title: 'Beskyt sårbare træer mod gnav', description: 'Vild og mus gnaver bark — sæt manchetter omkring frugttræer.', category: 'vinterklargoering', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-11-04', month: 11, title: 'Riv resterne af løv', description: 'Sidste blade — eller lad dem ligge på bedene som vinterdække.', category: 'jord', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-11-05', month: 11, title: 'Tjek opbevarede grøntsager', description: 'Kartofler, rødbeder, gulerødder — fjern råddent inden det smitter.', category: 'hoest', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-11-06', month: 11, title: 'Sæt fuglefoderet op', description: 'Fugle har brug for ekstra hjælp fra første frost.', category: 'dyreliv', priority: 'low', timeWindow: 'all_month' },

  // ============ DECEMBER ============
  { id: 'yw-12-01', month: 12, title: 'Beskyt mod sneknæk', description: 'Ryst sne af stedsegrønne træer og hække.', category: 'vinterklargoering', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-12-02', month: 12, title: 'Tjek vinterdække', description: 'Efter storme — sørg for at alt sidder, hvor det skal.', category: 'vinterklargoering', priority: 'medium', timeWindow: 'all_month' },
  { id: 'yw-12-03', month: 12, title: 'Læs frøkataloger', description: 'Drøm om næste sæson. Tag noter til januarbestillingen.', category: 'planlaegning', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-12-04', month: 12, title: 'Foder fugle dagligt', description: 'I koldeste tid har vilde fugle stort behov for energi.', category: 'dyreliv', priority: 'low', timeWindow: 'all_month' },
  { id: 'yw-12-05', month: 12, title: 'Vurder årets høst', description: 'Hvad gik godt? Hvad skal anderledes? Skriv det ned.', category: 'planlaegning', priority: 'low', timeWindow: 'late_month' },
]
