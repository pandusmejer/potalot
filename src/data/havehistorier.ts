/**
 * HAVEHISTORIER — Potalots redaktionelle læsestof til Havebogens venteværelse.
 *
 * Et selvstændigt indholdslag VED SIDEN AF dyrkningsguiderne. Guides svarer på
 * "hvordan gør jeg?"; Havehistorier undersøger et spørgsmål, en myte eller et
 * dilemma — "hvorfor er det sådan, og er det nu også rigtigt?".
 *
 * KONTRAKT: Docs/product/havehistorier.md (+ havehistorier.schema.json).
 * Denne fil er den eneste sandhed for hvilke historier der findes — tjek den
 * FØR du producerer en ny, så samme emne ikke opstår under tre slugs.
 *
 * Regel (billedkontrakt-mønsteret): ChatGPT/deep-research PRODUCERER en historie
 * som JSON matchende schemaet; et menneske/Claude MODTAGER, renser citat-støj,
 * optimerer og REGISTRERER den her. reviewRequired: true indtil et menneske har
 * kontrolleret fakta.
 *
 * ⚠️ IKKE live i produktflade endnu. Render kun via den gatede stilprøve
 * /admin/qa/havehistorier. Integration i havebog-kuratoren er et senere sprint.
 */

export type HavehistorieSerie =
  | 'myten'
  | 'ven-eller-fjende'
  | 'fremmed-i-haven'
  | 'herfra'
  | 'det-usynlige'
  | 'haven-diskuterer'

export interface HavehistorieSection {
  heading: string
  /** Markdown-let prosa: afsnit adskilt af \n\n, GFM-tabeller og *kursiv*. */
  content: string
}

export interface RelateretGuide {
  slug: string
  title: string
  description: string
}

export interface Havehistorie {
  slug: string
  contentType: 'gardenStory'
  series: HavehistorieSerie
  title: string
  /** 1-2 sætninger. Vises på venteværelse-kortet — hold den kort. */
  summary: string
  readingTimeMinutes: number
  /** Måneder med særlig sæsonrelevans (1-12). [] = relevant hele året. */
  seasonMonths: number[]
  /** Slugs på eksisterende arter/guides historien knytter sig til. */
  relatedSpecies: string[]
  tags: string[]
  /** Det korte svar — læseren skal kunne forstå konklusionen af dette alene. */
  shortAnswer: string
  sections: HavehistorieSection[]
  /** Konkrete kendetegn læseren kan observere i egen have. [] hvis ikke relevant. */
  lookFor: string[]
  /** Praktisk oversættelse til brugerens situation. */
  gardenAdvice: string
  relatedGuides: RelateretGuide[]
  /** Fulde URL'er til kilder. Mindst to uafhængige faglige kilder. */
  sourceLinks: string[]
  /** true indtil et menneske har fakta-kontrolleret historien. */
  reviewRequired: boolean
}

/** Brugervendte serie-etiketter (eyebrow på kort + artikel). */
export const SERIE_LABEL: Record<HavehistorieSerie, string> = {
  myten: 'Myten',
  'ven-eller-fjende': 'Ven eller fjende?',
  'fremmed-i-haven': 'Fremmed i haven',
  herfra: 'Herfra',
  'det-usynlige': 'Det usynlige',
  'haven-diskuterer': 'Haven diskuterer',
}

export const HAVEHISTORIER: Havehistorie[] = [
  {
    "slug": "skal-alle-lupiner-doe",
    "contentType": "gardenStory",
    "series": "myten",
    "title": "Skal alle lupiner dø?",
    "summary": "Mangebladet lupin er invasiv i Danmark, men spørgsmålet bliver for groft, hvis man lader farven alene afgøre dommen. Haveejere bør først skelne mellem art, voksested og spredningsrisiko, og derefter vælge mellem artsbestemmelse, frøkontrol eller egentlig bekæmpelse.",
    "readingTimeMinutes": 7,
    "seasonMonths": [
      5,
      6,
      7,
      8,
      9
    ],
    "relatedSpecies": [
      "lupin"
    ],
    "tags": [
      "invasive-arter",
      "mangebladet-lupin",
      "artsbestemmelse",
      "hjemmehoerende-arter",
      "haveetik",
      "vejkanter"
    ],
    "shortAnswer": "Nej. Haveejere bør rette indsatsen mod mangebladet lupin, især når den står tæt på næringsfattig natur, vejkanter, grøfter, heder, overdrev eller andre steder, hvor frø kan slippe ud. Hvis du dyrker en ukendt staudelupin, bør du enten artsbestemme den eller behandle den som potentiel mangebladet lupin og i det mindste fjerne frøstandene før modning. I Danmark regner myndighederne mangebladet lupin som invasiv, men de pålægger ikke private en generel lovpligtig bekæmpelse på samme måde som for kæmpebjørneklo.",
    "sections": [
      {
        "heading": "Kort overblik",
        "content": "Lupiner er ikke bare en farve i juni. Når haveejere og myndigheder diskuterer dem, diskuterer de i praksis, om en haveplante får lov at slippe ud og ændre naturen uden for hegnet. De danske myndigheder peger specifikt på mangebladet lupin, Lupinus polyphyllus, fordi den kan fiksere kvælstof, danne tætte bestande og ændre levesteder, hvor andre planter ellers klarer sig på mager jord.\n\nDerfor bør haveejere ikke starte med et moralsk slagord, men med tre spørgsmål: Hvilken art står her? Hvor står den? Og hvor let kan den sprede sig herfra? Når man svarer på de tre spørgsmål, bliver det tydeligt, at en plante i et kontrolleret bed og en frøsættende bestand i kanten af et overdrev ikke er samme sag."
      },
      {
        "heading": "Hvilken lupin står du med",
        "content": "Hvis du vil kende mangebladet lupin i praksis, skal du kigge på mere end blomsterfarven. I danske arts- og myndighedskilder beskriver fagfolk arten som en flerårig urt på omtrent 50 til 120, nogle steder 150, centimeter med hjulformede blade og typisk 10 til 16 spidse småblade. Blomsterne sidder i lange, oprette klaser, og de hårede bælge rummer typisk 5 til 9 kugleformede frø.\n\nGul lupin er den letteste danske forveksling at sortere fra, fordi den som navnet antyder blomstrer gult, bliver omtrent halvt så høj og har færre småblade. Fåbladet lupin, som engelsksprogede kilder kalder wild lupine, bliver typisk lavere og bærer blade med op til 11 småblade. Alaska-lupin bærer ofte 6 til 8 smalle småblade. Småbladstal overlapper dog delvist mellem arterne, så haveejere bør ikke lade ét enkelt blad afgøre hele sagen.\n\nDu bør også være varsom med handelsnavne. Miljøstyrelsens faktaark bruger direkte synonymerne havelupin og staudelupin om mangebladet lupin, og SGAV skriver, at mangebladet lupin fortsat sælges som staude og i frøblandinger til havebrug. Derfor er navnet på posen eller planteskiltet ikke i sig selv nok til at frikende planten."
      },
      {
        "heading": "Sammenlign lupinerne før du beslutter dig",
        "content": "Tabellen her er tænkt som haveejerens første stop, ikke som en fuld botanisk nøgle. Når du er i tvivl, bør du lade voksested og spredningsrisiko veje tungt og handle forsigtigt, før planten når at sætte modne frø.\n\n| Art eller navn | Invasiv status i Danmark | Typiske levesteder | Anbefalet handling |\n| --- | --- | --- | --- |\n| Mangebladet lupin, *Lupinus polyphyllus* | Opført som invasiv i Danmark på SGAVs oversigt over invasive arter. Ikke blandt arterne på den nationale liste med handelsforbud. | Haver, vejrabatter, skrænter, grøfter, ruderater, brakmarker, løvhegn og også heder og overdrev, hvor den kan true hjemmehørende arter. | Fjern eller hold den stramt nede, hvis den står nær naturfølsomme arealer eller sætter frø. Grav små bestande op, eller slå før blomstring og igen senere på sæsonen. |\n| Andre *Lupinus*-arter registreret i DK, fx gul lupin, Alaska-lupin, fåbladet lupin og hybriden Alaska-lupin × mangebladet lupin | Arter.dk registrerer dem i Danmark, men SGAVs oversigt over invasive planter nævner ikke dem som selvstændige invasive arter på samme måde som mangebladet lupin. | Varierer med art; ofte haver, forsøgs- eller frømarker, forvildede fund og spredte bestandstyper. | Artsbestem først. Undgå frøsætning, hvis du er i tvivl, især tæt på vejkanter og naturarealer. |\n| Almindelige staudelupiner i havehandel | Ikke en botanikers art, men et handelsnavn. I danske myndighedskilder bruges staudelupin og havelupin som navne på mangebladet lupin. | Staudebede, cottagehaver, frøblandinger og gaveplanter. | Behandl navnet som usikkert. Hvis planten ligner mangebladet lupin, bør du som minimum fjerne frøstande og helst få arten bestemt. |\n| Fåbladet lupin, *Lupinus perennis*, ofte kaldet wild lupine | Ikke opført som invasiv på SGAVs danske oversigt. Arter registrerer arten i Danmark, men uden samme invasive status som mangebladet lupin. | Tørre, lette jorde; i dyrkning ofte prærie- og naturprægede bede. | Brug artsnavnet, ikke kælenavnet. Hvis du dyrker den med sikker artsbestemmelse i et bed, er situationen en anden end for mangebladet lupin, men du bør stadig holde øje med spredning. |\n\nTabellen sammenfatter danske myndigheds- og artsdatabasekilder for status og levesteder, og den bruger autoritative planteprofiler til at skelne mellem de mest sandsynlige forvekslinger, når danske beskrivelser mangler detaljer for de sjældnere arter."
      },
      {
        "heading": "Derfor er mangebladet lupin et naturproblem",
        "content": "Når mangebladet lupin breder sig i et følsomt område, ændrer den ikke kun farvepaletten. Planten samarbejder med kvælstoffikserende bakterier og kan derfor løfte næringsniveauet i jorden. Det giver en konkret fordel til konkurrencestærke arter og et konkret tilbageslag til planter, som folk ellers forbinder med mager jord, heder, overdrev og andre næringsfattige steder. Det er især derfor, danske myndigheder og forskere ser den som et problem uden for selve staudebedet.\n\nFagfolk har også målt biologiske følgevirkninger, som ikke kan ses på et billede af en blomsterstribe. Miljøstyrelsens faktaark vurderer påvirkningen af hjemmehørende arter som høj og henviser til studier, hvor både plantediversitet og tæthed og diversitet af leddyr falder. I et finsk studie, som faktaarket også bygger på, fandt forskerne omkring 46 procent færre leddyr i invaderede lokaliteter, især fordi biller, fluer, sommerfugle og myrer blev færre, mens nogle humlebier blev flere.\n\nDet sidste punkt er vigtigt, fordi mange mennesker stopper analysen, når de ser bier på blomsten. Mangebladet lupin kan godt levere nektar til enkelte bestøvere og samtidig gøre den samlede natur fattigere. Haveejere bør derfor ikke bruge argumentet om bier som eneste grund til at lade den brede sig."
      },
      {
        "heading": "Sådan spreder den sig og sådan bekæmper du den",
        "content": "Mangebladet lupin kom til Europa som prydplante og blev senere brugt til erosionsbekæmpelse, jordforbedring og grøngødning. I Danmark sælger handlen den stadig som både frø og planter, og myndighedernes egne data viser, at arten er meget almindelig i landet. Det betyder, at spredningen ikke kun hører vejkanter og naturforvaltning til; helt almindelige haver fungerer også som kilde, når planterne får lov at sætte frø.\n\nPlanten spreder sig på flere måder. Frøene slynges ud, når bælgene springer op, og danske kilder angiver, at frø kan flyve et par meter fra moderplanten. Planten breder sig også vegetativt via underjordiske udløbere. Frøbanken kan ifølge de danske kilder være kortere under nogle forhold, men den kan også holde i op til 50 år, så et par sæsoners forsømmelse kan give lang hale på problemet. Internationale invasionskilder peger desuden på haveaffald og forurenet jord som dokumenterede spredningsveje.\n\nNår du skal bekæmpe planten, er målet først og fremmest at stoppe frø. SGAV anbefaler at rykke hele planten op før frømodning i sensommeren, og styrelsen anbefaler ved slåning to årlige slåninger i 3 til 5 år, først før blomstring i maj-juni og igen to måneder senere. Natur360s vejkantvejledning giver næsten samme rytme og understreger, at slåning altid skal ske før frøsætning. Små bestande er derfor oplagte at grave op, mens større bestande kræver vedholdenhed, ikke enkeltstående symbolklip."
      },
      {
        "heading": "Hvad loven faktisk siger",
        "content": "De danske regler er mere nuancerede end mange opslag på sociale medier giver indtryk af. SGAV arbejder i dag med to juridisk bindende lister, EU-listen og den nationale liste, og derudover med en bredere liste over arter, som opfører sig invasivt i Danmark. Mangebladet lupin står på den brede danske oversigt over invasive arter, men ikke på SGAVs nationale liste over ni arter med handelsforbud. Samme myndighedsside understreger også, at kæmpebjørneklo er den eneste invasive planteart med lovpligtig bekæmpelse. Det betyder ikke, at mangebladet lupin er harmløs; det betyder, at ansvaret i høj grad ligger hos den enkelte haveejer, kommune og naturforvalter.\n\nEtisk set er svaret derfor heller ikke behold alt eller fjern alt. Hvis du dyrker en sikker, ikke-invasiv art i et bed uden frøsætning og uden risiko for spredning til naturen, står du i en anden situation end den haveejer, der lader mangebladet lupin sætte frø langs et hegn op til vejkant, grøft eller et sandet naturareal. Ansvarlig havepraksis begynder her med artsbestemmelse, fortsætter med frøkontrol og ender kun med total fjernelse dér, hvor risikoen faktisk er høj."
      }
    ],
    "lookFor": [
      "10-16 smalle småblade i et hjulformet blad",
      "blomster i blå, lilla, pink eller hvid, men ikke gul",
      "hårede bælge, som tørrer ind og senere springer op",
      "selvsåede planter uden for bedet, især mod vej, grøft eller hegn",
      "tætte bestande på let eller sandet jord nær næringsfattig vegetation"
    ],
    "gardenAdvice": "Hvis du har mangebladet lupin i haven, så stop frøsætningen denne sæson, også selv om du først vil artsbestemme eller beslutte dig endeligt bagefter. Står planten tæt på vejkant, grøft, hede, overdrev eller andre næringsfattige arealer, bør du grave hele planten op eller følge SGAVs slåningsrytme over flere år. Kender du ikke arten med sikkerhed, bør du behandle høje, ikke-gule staudelupiner som potentielt risikable, indtil du har fået dem bestemt. Undgå at flytte frø, rodrester og jord fra planten til nye steder.",
    "relatedGuides": [],
    "sourceLinks": [
      "https://arter.dk/taxa/76802",
      "https://sgavmst.dk/arter/artsforvaltning/invasive-arter/forebyggelse-og-bekaempelse/mangebladet-lupin",
      "https://sgavmst.dk/media/p4xk3drk/mangebladet-lupin.pdf",
      "https://sgavmst.dk/arter/artsforvaltning/invasive-arter/de-invasive-arter",
      "https://natur360.dk/onewebmedia/Downloads/Drejebog_vejkantsforvaltning_vs3_LowRes.pdf",
      "https://link.springer.com/article/10.1007/s10530-020-02316-3",
      "https://link.springer.com/article/10.1007/s10530-021-02652-y",
      "https://www.utupub.fi/bitstream/handle/10024/155140/Ramula%26Sorvari_final.pdf?sequence=1",
      "https://www.rhs.org.uk/plants/57482/lupinus-perennis/details",
      "https://www.rhs.org.uk/plants/10571/lupinus-nootkatensis/details"
    ],
    "reviewRequired": true
  },
]

export function getHavehistorie(slug: string): Havehistorie | undefined {
  return HAVEHISTORIER.find(h => h.slug === slug)
}
