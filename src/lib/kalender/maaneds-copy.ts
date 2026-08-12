/**
 * Månedscopy — kanonisk kilde til kalenderens prosa + månedens gøremål.
 *
 * Skrevet af Anna (verbatim). Én kilde til:
 *  - shortText  → preview / kort / måneds-hero / månedsskifter
 *  - longText   → månedsdetail / "se alle gøremål"
 *  - tasks      → månedens gøremål (universelle admin-opgaver, IKKE brugerens
 *                 personlige opgaver fra Planter/Frøbank)
 *
 * Denne fil er statisk med vilje: gøremålene bor egentlig i DB
 * (`general_garden_tasks`), men den tabel er tom, og vi seeder ikke live-DB
 * ad-hoc. Filen fungerer derfor som den kanoniske prosa OG som statisk kilde/
 * fallback for gøremålene, indtil (hvis nogensinde) admin-DB tages i brug.
 */

export type GardenTaskCategory =
  | 'jord'
  | 'saaning'
  | 'hoest'
  | 'pleje'
  | 'beskyttelse'
  | 'planlaegning'

export interface MonthlyGardenTask {
  title: string
  description: string
  category?: GardenTaskCategory
}

export interface MonthlyGardenCopy {
  month: number
  monthName: string
  shortText: string
  longText: string
  tasks: MonthlyGardenTask[]
}

/** Visuelle labels til kategori-chips. Ikke "greb". */
export const CATEGORY_LABELS: Record<GardenTaskCategory, string> = {
  jord: 'Jord',
  saaning: 'Såning',
  hoest: 'Høst',
  pleje: 'Pleje',
  beskyttelse: 'Beskyt',
  planlaegning: 'Plan',
}

export const MONTHLY_GARDEN_COPY: Record<number, MonthlyGardenCopy> = {
  1: {
    month: 1,
    monthName: 'Januar',
    shortText:
      'Januar er stille, men haven sover ikke helt. Nu kan du planlægge, rydde op og give både jord, frø og redskaber en bedre start på året.',
    longText:
      'I januar arbejder havefolk mest med overblik. Jorden hviler, lyset vender langsomt tilbage, og de fleste planter klarer sig bedst uden for meget indblanding. Brug måneden på at sortere frø, tjekke redskaber og lægge de første planer. Når du gør det nu, møder du foråret med færre halve poser, sløve sakse og panikindkøb.',
    tasks: [
      {
        title: 'Gennemgå dine frø',
        description:
          'Se frøposerne igennem, og notér, hvad du allerede har, hvad du vil bruge først, og hvad du mangler.',
        category: 'planlaegning',
      },
      {
        title: 'Rengør potter og bakker',
        description:
          'Vask potter, såbakker og planteskilte, så du mindsker risikoen for sygdomme, når forspiringen begynder.',
        category: 'pleje',
      },
      {
        title: 'Tjek redskaberne',
        description:
          'Slib beskæresakse, rens haveredskaber, og gør det let at komme i gang, når jorden igen kalder.',
        category: 'pleje',
      },
      {
        title: 'Planlæg årets første såninger',
        description:
          'Skriv ned, hvad du vil forspire først, og hvornår du realistisk har plads og lys til det.',
        category: 'planlaegning',
      },
    ],
  },
  2: {
    month: 2,
    monthName: 'Februar',
    shortText:
      'Februar begynder at røre på sig. Lyset vender tilbage, og de første frø, knolde og beskæringer kan finde vej ind i årets plan.',
    longText:
      'I februar mærker både havefolk og planter, at sæsonen nærmer sig. Dagslyset tager til, men kulden holder stadig haven tilbage. Nu handler det om at starte forsigtigt: nogle frø kan forkultiveres, æble- og pæretræer kan beskæres på milde, frostfrie dage, og du kan gøre klar til den travle del af foråret. Når du holder igen med det meste og starter det rigtige, får planterne en roligere begyndelse.',
    tasks: [
      {
        title: 'Start de langsomme frø',
        description:
          'Forspir chili, peberfrugt og andre langsomme afgrøder, hvis du har lys og varme nok.',
        category: 'saaning',
      },
      {
        title: 'Beskær frugttræer på milde dage',
        description: 'Beskær æble- og pæretræer, når vejret er tørt og frostfrit.',
        category: 'pleje',
      },
      {
        title: 'Gør drivhus eller vindueskarm klar',
        description: 'Ryd plads, vask overflader, og find bakker, jord og skilte frem.',
        category: 'planlaegning',
      },
      {
        title: 'Tjek overvintrende planter',
        description:
          'Se efter udtørring, skimmel og skadedyr hos planter, der står i læ eller indendørs.',
        category: 'beskyttelse',
      },
    ],
  },
  3: {
    month: 3,
    monthName: 'Marts',
    shortText:
      'Marts åbner sæsonen på klem. Nu kan du så de første robuste frø, forbedre jorden og begynde at gøre haven klar til vækst.',
    longText:
      'I marts begynder haven at skifte tempo. Jorden er stadig kold mange steder, men lyset giver planterne mere kraft. Nu kan du starte de første såninger, rydde vinterens rester og give jorden kompost eller anden forbedring. Gå langsomt frem, for tidlig iver giver sjældent stærkere planter. Haven belønner den, der kigger på vejret før frøposen.',
    tasks: [
      {
        title: 'Så de første robuste afgrøder',
        description:
          'Så fx spinat, radiser og salat på lune steder, hvis jorden er tjenlig.',
        category: 'saaning',
      },
      {
        title: 'Forbedr jorden',
        description:
          'Læg kompost eller jordforbedring ud, så bedene får ny næring før hovedsæsonen.',
        category: 'jord',
      },
      {
        title: 'Klargør bede',
        description:
          'Fjern visne rester, løsn forsigtigt jorden, og gør plads til de første såninger.',
        category: 'jord',
      },
      {
        title: 'Start forspiring inde',
        description:
          'Forspir tomat, kål, krydderurter og blomster, hvis de passer til din plan og plads.',
        category: 'saaning',
      },
    ],
  },
  4: {
    month: 4,
    monthName: 'April',
    shortText:
      'April sætter fart på haven. Nu spirer frøene, ukrudtet vågner, og de første planter skal have lys, luft og ro til at vokse.',
    longText:
      'I april vokser haven mere synligt fra uge til uge. De første spirer dukker op, stauderne bryder frem, og ukrudtet benytter enhver fri plet, fordi naturen åbenbart aldrig tager fri. Brug måneden på at så, prikle, luge og beskytte sarte planter mod kolde nætter. Når du giver planterne en god begyndelse nu, får du mindre oprydning senere.',
    tasks: [
      {
        title: 'Prikl forspirede planter om',
        description:
          'Giv småplanter mere plads, når de står tæt eller har fået de første rigtige blade.',
        category: 'pleje',
      },
      {
        title: 'Så direkte i bedene',
        description: 'Så robuste grøntsager og blomster, når jorden er lun nok.',
        category: 'saaning',
      },
      {
        title: 'Lug tidligt',
        description:
          'Fjern småt ukrudt, før det får rødder nok til at blive et fritidsprojekt.',
        category: 'pleje',
      },
      {
        title: 'Beskyt mod kolde nætter',
        description: 'Dæk sarte planter med fiberdug, hvis vejret lover frost eller hård kulde.',
        category: 'beskyttelse',
      },
    ],
  },
  5: {
    month: 5,
    monthName: 'Maj',
    shortText:
      'Maj er udplantning, tempo og tålmodighed på samme tid. Planterne vil frem, men kolde nætter kan stadig sætte dem tilbage.',
    longText:
      'I maj går haven fra forberedelse til alvor. Mange forspirede planter kan snart komme ud, men de skal vænne sig gradvist til forholdene udenfor. Nu skal du holde øje med nætterne, vande nyplantede planter og give støtte til det, der hurtigt vokser sig højt. Maj lokker havefolk til at gøre alt på én gang, hvilket selvfølgelig er effektivt, hvis målet er at blive træt og bagefter gøre halvdelen om.',
    tasks: [
      {
        title: 'Hærd planter af',
        description:
          'Sæt forspirede planter ud i korte perioder, så de vænner sig til vind, sol og køligere luft.',
        category: 'pleje',
      },
      {
        title: 'Plant ud efter vejret',
        description:
          'Plant tomater, chili og frostfølsomme sommerblomster ud, når nætterne er milde nok.',
        category: 'saaning',
      },
      {
        title: 'Vand nyplantede planter',
        description:
          'Giv nyplantede planter vand regelmæssigt, mens rødderne finder vej i jorden.',
        category: 'pleje',
      },
      {
        title: 'Sæt støtte op tidligt',
        description: 'Bind høje stauder, tomater og klatreplanter op, før de vælter eller knækker.',
        category: 'pleje',
      },
    ],
  },
  6: {
    month: 6,
    monthName: 'Juni',
    shortText:
      'Juni er haven i fuld vækst. Nye skud tager fart, blomsterne folder sig ud, og de første afgrøder melder sig.',
    longText:
      'I juni bruger planterne vand, næring og plads i et tempo, der næsten virker fornærmende over for kalenderen. Nu hjælper du haven bedst ved at holde rytmen: vand før tørken bider, bind høje planter op, og høst lidt ad gangen, så planterne bliver ved. Juni belønner små gentagne indsatser mere end store heroiske redningsaktioner.',
    tasks: [
      {
        title: 'Tjek vand, næring og støtte',
        description:
          'Juni er vækstmåned. Se især til tørstige planter, planter i krukker og dem, der vokser højt eller bærer tungt.',
        category: 'pleje',
      },
      {
        title: 'Hold øje med tørke og varme',
        description: 'Krukker, kapillærkasser og nyplantede planter tørrer hurtigst ud.',
        category: 'beskyttelse',
      },
      {
        title: 'Høst lidt ad gangen',
        description:
          'Pluk salat, krydderurter og de første grøntsager, når de er høstklare.',
        category: 'hoest',
      },
      {
        title: 'Så i flere omgange',
        description: 'Så fx salat, radiser eller bønner igen, så du får høst over længere tid.',
        category: 'saaning',
      },
    ],
  },
  7: {
    month: 7,
    monthName: 'Juli',
    shortText:
      'Juli er høst, varme og tempo. Nu skal du plukke ofte, vande klogt og hjælpe planterne gennem sommerens mest intense uger.',
    longText:
      'I juli arbejder haven hårdt. Planterne sætter frugt, blomsterne topper, og varmen kan hurtigt gøre krukker, kål og nyplantede bede tørstige. Høst lidt og ofte, så planterne bliver ved med at give. Vand dybt i stedet for hele tiden at småsjatte, og så nyt til sensommeren, mens der stadig er lys og varme nok.',
    tasks: [
      {
        title: 'Høst ofte',
        description:
          'Høst løbende det, der er klar, så du får råvarerne, mens kvaliteten er bedst.',
        category: 'hoest',
      },
      {
        title: 'Vand grundigt ved behov',
        description: 'Giv færre, grundige vandinger frem for små sjatter på overfladen.',
        category: 'pleje',
      },
      {
        title: 'Så til sensommeren',
        description: 'Så fx spinat, salat, radiser eller asiatiske bladgrøntsager til senere høst.',
        category: 'saaning',
      },
      {
        title: 'Hold øje med skadedyr',
        description: 'Tjek især kål, bønner, salat og unge planter for snegle, lus og larver.',
        category: 'beskyttelse',
      },
    ],
  },
  8: {
    month: 8,
    monthName: 'August',
    shortText:
      'August bugner, men sæsonen begynder at skifte. Nu handler det om at høste, holde fugten og så det sidste til sensommer og efterår.',
    longText:
      'I august får havefolk både overflod og begyndende efterår i samme kurv. Tomater, bønner, blomster og krydderurter kræver stadig opmærksomhed, mens de første planter takker af. Høst regelmæssigt, fjern det der er sygt eller færdigt, og så nye hold der kan nå at give noget endnu. August er ikke slutningen på sæsonen, bare den del hvor haven begynder at tale lavere.',
    tasks: [
      {
        title: 'Høst og ryd op løbende',
        description: 'Pluk modne afgrøder, og fjern planterester, der skygger eller spreder sygdom.',
        category: 'hoest',
      },
      {
        title: 'Så igen',
        description: 'Så hurtige afgrøder som spinat, salat, radiser eller dild til sensommerbrug.',
        category: 'saaning',
      },
      {
        title: 'Hold jorden dækket',
        description:
          'Brug kompost, afklip eller grønt plantemateriale, så jorden ikke tørrer unødigt ud.',
        category: 'jord',
      },
      {
        title: 'Tag stiklinger og frø',
        description:
          'Saml frø fra udvalgte planter, og tag stiklinger fra urter eller blomster, du vil gemme.',
        category: 'planlaegning',
      },
    ],
  },
  9: {
    month: 9,
    monthName: 'September',
    shortText:
      'September samler sæsonen op. Du kan høste det sidste, så vintergrønt og begynde at gøre jorden klar til ro.',
    longText:
      'I september skifter haven tydeligt karakter. Lyset bliver blødere, nætterne køligere, og mange planter bruger de sidste kræfter på frugt, frø og blomster. Nu kan du høste, sortere, plante løg og så grønt, der kan klare efteråret. Giv jorden noget tilbage, når du rydder bede, så næste sæson ikke starter med en udpint madpakke.',
    tasks: [
      {
        title: 'Høst det modne',
        description:
          'Pluk tomater, bønner, æbler, krydderurter og blomster, mens kvaliteten stadig er god.',
        category: 'hoest',
      },
      {
        title: 'Så efterårsgrønt',
        description: 'Så fx spinat, vintersalat eller grøngødning, hvis vejret og pladsen passer.',
        category: 'saaning',
      },
      {
        title: 'Plant forårsløg',
        description: 'Læg blomsterløg, så de kan nå at etablere sig før vinteren.',
        category: 'saaning',
      },
      {
        title: 'Giv jorden kompost',
        description: 'Læg kompost på tomme bede, så jorden får nyt liv efter sommerens dyrkning.',
        category: 'jord',
      },
    ],
  },
  10: {
    month: 10,
    monthName: 'Oktober',
    shortText:
      'Oktober rydder op uden at lukke haven ned. Nu kan du plante, beskytte og gøre jorden klar til vinterens langsomme arbejde.',
    longText:
      'I oktober trækker haven vejret langsommere. Bladene falder, jorden holder stadig lidt varme, og mange planter kan flyttes eller plantes med mindre stress. Brug måneden på at lægge løg, plante buske og stauder, samle blade og beskytte det sarte. Når du rydder op, så lad noget blive tilbage til jordliv og smådyr. Haven har ikke brug for at ligne et nyvasket køkken.',
    tasks: [
      {
        title: 'Plant stauder, buske og træer',
        description:
          'Efterårsjorden giver rødderne tid til at etablere sig før næste vækstsæson.',
        category: 'saaning',
      },
      {
        title: 'Saml blade til jorddække',
        description: 'Brug blade i bede eller kompost, så de bliver til næring i stedet for affald.',
        category: 'jord',
      },
      {
        title: 'Beskyt sarte planter',
        description: 'Flyt krukker i læ, og dæk planter, der ikke tåler frost.',
        category: 'beskyttelse',
      },
      {
        title: 'Læg de sidste forårsløg',
        description: 'Sæt tulipaner, narcisser og andre løg, før jorden bliver for kold.',
        category: 'saaning',
      },
    ],
  },
  11: {
    month: 11,
    monthName: 'November',
    shortText:
      'November gør haven stille. Nu kan du beskytte, samle, rydde nænsomt og lade jorden arbejde videre under dækket.',
    longText:
      'I november går haven ind i den våde, mørke del af året. Det meste vokser langsomt eller slet ikke, men jorden lever stadig. Beskyt krukker, tøm slanger, saml løse ting og giv bede et lag blade eller kompost. Ryd op med måde, for visne stængler og blade giver ly, næring og struktur. Perfekt orden er sjældent havens bedste ven, hvilket åbenbart stadig overrasker folk.',
    tasks: [
      {
        title: 'Frostsikr krukker og beholdere',
        description: 'Tøm slanger, vandkander og beholdere, og flyt frostsarte krukker i læ.',
        category: 'beskyttelse',
      },
      {
        title: 'Dæk bar jord',
        description: 'Læg blade, kompost eller andet organisk materiale på tomme bede.',
        category: 'jord',
      },
      {
        title: 'Lad noget stå',
        description: 'Behold visne stængler og frøstande, hvor de kan give ly og føde til smådyr.',
        category: 'pleje',
      },
      {
        title: 'Ryd redskaber væk',
        description: 'Rens og tør redskaber, så de ikke ruster eller ligger glemt i regnen.',
        category: 'pleje',
      },
    ],
  },
  12: {
    month: 12,
    monthName: 'December',
    shortText:
      'December er ro, eftersyn og små beslutninger. Haven kræver ikke meget, men du kan gøre næste sæson lettere allerede nu.',
    longText:
      'I december behøver havefolk ikke presse haven frem. Den mørke måned egner sig bedre til at kigge tilbage, justere planer og holde øje med frost, vind og våde krukker. Brug tiden på at notere, hvad der virkede, hvad der blev for meget, og hvad du gerne vil dyrke igen. Næste sæson starter bedre, når du ikke prøver at huske alting i marts som en optimist med jord under neglene.',
    tasks: [
      {
        title: 'Kig tilbage på sæsonen',
        description:
          'Notér hvilke sorter, placeringer og metoder der fungerede, mens du stadig kan huske det.',
        category: 'planlaegning',
      },
      {
        title: 'Tjek frost og vind',
        description: 'Se til krukker, dækkede planter og løse ting efter blæst eller frost.',
        category: 'beskyttelse',
      },
      {
        title: 'Planlæg næste års dyrkning',
        description: 'Vælg få vigtige ændringer, så planen bliver brugbar og ikke bare smuk på papir.',
        category: 'planlaegning',
      },
      {
        title: 'Bestil frø eller gem dem på ønskelisten',
        description: 'Lav en rolig liste over sorter, du mangler, før forårets frøpanik begynder.',
        category: 'planlaegning',
      },
    ],
  },
}

/** Alle 12 måneder som liste (jan → dec). */
export const MONTHLY_GARDEN_COPY_LIST: MonthlyGardenCopy[] = Object.values(
  MONTHLY_GARDEN_COPY,
).sort((a, b) => a.month - b.month)
