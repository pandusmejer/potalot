/**
 * Sæsonråd — kurateret månedsindhold til Kalenderens Inspiration-mappe
 * (fane 2, "Sæsonråd"). Ren data, ingen UI.
 *
 * ── Hvad det ER ──────────────────────────────────────────────────────────
 * Redaktionel almanak-copy, ét sæt pr. måned. Ikke personaliseret og ikke
 * afledt af brugerens data — tabben lover heller ikke andet: overskriften
 * er "Få mere ud af <måned>", ikke "til dig". Rækkefølgen er kuratorens,
 * så topkortene er bevidst rangeret, ikke tilfældige.
 *
 * ── Hvad det IKKE må blive ───────────────────────────────────────────────
 * Der må ALDRIG være en måneds-fallback. Filen lå tidligere sammen med en
 * (nu slettet) `Inspiration`-komponent, hvis linje
 *     CURATED_INSPIRATION[month] ?? CURATED_INSPIRATION[5]
 * ville have vist MAJ-råd året rundt — præcis KAL-0108-fejlen, som blev
 * rettet i selve mappen. Kalderen skal falde til en TOM liste; har en måned
 * intet indhold, siger Potalot ingenting. Se inspiration-folder.tsx.
 *
 * Teksterne er bevidst skrevet uden at påstå en betingelse Potalot ikke
 * kender: "Vand grundigt VED BEHOV", "Høst dem PÅ EN TØR DAG", "…HVIS de
 * skal overvintre". Den formulering skal bevares ved redigering.
 */

export interface KurateretItem {
  title: string
  text: string
}

export const CURATED_INSPIRATION: Record<number, KurateretItem[]> = {
  1: [
    { title: 'Læg planen for året', text: 'Skitsér bede, rotation, og hvad du vil dyrke for første gang.' },
    { title: 'Gennemgå Frøbanken', text: 'Se, hvad du allerede har, hvad der mangler, og hvilke frø du vil bruge først.' },
    { title: 'Forspir det langsomme', text: 'Chili og aubergine kræver et forspring nu.' },
  ],
  2: [
    { title: 'Begynd forspiring', text: 'Tomat, peberfrugt og chili kan starte indenfor.' },
    { title: 'Skitsér sæsonen', text: 'Klargør bedplaner og sædskifte, før foråret tager fart.' },
    { title: 'Vask redskaberne', text: 'Rene knive og bakker giver sundere spirer.' },
  ],
  3: [
    { title: 'Klar drivhuset', text: 'Vask ruder, luft ud, fyld bedene op.' },
    { title: 'Så de hårdføre', text: 'Spinat, radise og ærter kan ud i koldhus.' },
    { title: 'Forspir de varmekrævende', text: 'Squash, agurk og tomat kan starte indenfor.' },
  ],
  4: [
    { title: 'Hærd forspirede planter af', text: 'Lad dem stå ude lidt længere dag for dag, så de vænner sig til vind og lys.' },
    { title: 'Direkte såning', text: 'Gulerod, radise, salat og ærter kan i jorden nu.' },
    { title: 'Forbered jorden', text: 'Riv jorden, læg kompost på, og planlæg rækkerne.' },
  ],
  5: [
    { title: 'Så noget hurtigt voksende', text: 'Radise, salat og bønner kan stadig nå at give høst.' },
    { title: 'Start sensommerens planer', text: 'Så grønkål, pak choi og vinterportulak nu.' },
    { title: 'Giv krydderurterne mere plads', text: 'Persille, basilikum og dild trives når de står frit.' },
  ],
  6: [
    { title: 'Vand dybt og roligt', text: 'Bedre én lang vanding end mange overfladiske.' },
    { title: 'Tyv tomaterne', text: 'Fjern små sideskud løbende, før de vokser sig store.' },
    { title: 'Så til vinteren', text: 'Grønkål og kålroer kan nå at modnes i god tid.' },
  ],
  7: [
    { title: 'Pluk ofte', text: 'Høst ærter og bønner løbende, og tag salaten, mens den er frisk og sprød.' },
    { title: 'Tør krydderurter', text: 'Høst dem på en tør dag, når de dufter kraftigt.' },
    { title: 'Giv de sarte lidt skygge', text: 'Beskyt spirebakker og nyudplantede planter mod den skarpeste middagssol.' },
  ],
  8: [
    { title: 'Saml dine bedste frø', text: 'Saml modne frøstande fra planter, du gerne vil dyrke igen.' },
    { title: 'Plant til efterår', text: 'Vinterportulak og feldsalat kan nå at slå rødder.' },
    { title: 'Vand grundigt ved behov', text: 'August kan stadig være tør, især i krukker og nyplantede bede.' },
  ],
  9: [
    { title: 'Sæt grøngødning', text: 'Honningurt, boghvede eller rug — jorden takker dig til foråret.' },
    { title: 'Plant vinterhvidløg', text: 'Sæt feddene i efteråret, mens jorden stadig er til at arbejde med.' },
    { title: 'Saml løvkompost', text: 'Gratis jordforbedring for næste sæson.' },
  ],
  10: [
    { title: 'Tag det sarte ind', text: 'Flyt frostfølsomme krukker og planter i læ eller ind, hvis de skal overvintre.' },
    { title: 'Plant træer og buske', text: 'Jorden er stadig varm — perfekt til at slå rødder.' },
    { title: 'Læg løg i jord', text: 'Tulipaner og forårsløg vil have et godt forspring.' },
  ],
  11: [
    { title: 'Pak jorden ind', text: 'Et lag løv eller halm holder jorden levende.' },
    { title: 'Notér året', text: 'Hvad lykkedes? Hvad vil du justere?' },
  ],
  12: [
    { title: 'Drøm om næste sæson', text: 'Læs frøkataloger, og skitsér nye bede.' },
    { title: 'Pas på krukkerne', text: 'Tjek dræn, beskyt mod frostskader.' },
    { title: 'Lad jorden hvile', text: 'Det vigtigste i december er ofte at gøre ingenting.' },
  ],
}
