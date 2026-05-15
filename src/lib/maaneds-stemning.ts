/**
 * Stemningstekster pr. måned — bruges i kalenderens måneds-hero.
 * Hver indgang har en tagline (kort kerne-følelse) og en kort beskrivelse
 * (1-2 sætninger om hvad der typisk sker i haven).
 */

export interface MaanedsStemning {
  tagline: string
  description: string
}

export const MAANEDS_STEMNING: Record<number, MaanedsStemning> = {
  1: {
    tagline: 'Drømme, frø og frossen jord',
    description: 'Haven sover på overfladen, men planerne begynder allerede at spire. Januar handler om frøposer, varme drømme om sommer og små projekter i vindueskarmen, mens verden udenfor mest ligner våd cement.',
  },
  2: {
    tagline: 'Lyset vender langsomt tilbage',
    description: 'Dagene bliver længere, og det første forår prikker forsigtigt til haven. Chili, tomater og tidlige blomster kan sås, mens vintergækkerne minder os om, at naturen trods alt stadig gider forsøge.',
  },
  3: {
    tagline: 'Nu vågner haven',
    description: 'Jorden begynder at løsne sig, drivhuset kalder, og de første rigtige forårstegn vælter frem. Der skal sås, beskæres og ryddes op, mens optimismen stiger hurtigere end temperaturen.',
  },
  4: {
    tagline: 'Alt spirer. Også ukrudtet.',
    description: 'April er lyse aftener, kolde nætter og grønne skud overalt. Køkkenhaven starter for alvor, blomsterne vælter frem, og vejret skifter personlighed flere gange om dagen.',
  },
  5: {
    tagline: 'Sommerens dør står på klem',
    description: 'Maj er måneden hvor haven går fra håb til handling. Tomaterne vil ud, georginerne vil i jorden, og ukrudtet har allerede lagt aggressive planer. Sol, regn og milde nætter sætter fart på det hele.',
  },
  6: {
    tagline: 'Nu eksploderer det',
    description: 'Juni er drivhusduft, lange aftener og planter i fuld fart. De første høster begynder, blomsterne tager over, og haven kræver pludselig opmærksomhed hver eneste dag.',
  },
  7: {
    tagline: 'Høst, varme og vildskab',
    description: 'Tomaterne modner, blomsterne topper, og køkkenhaven giver igen med begge hænder. Juli er højsommer, tørke, overflod og den måned hvor squashplanter mister al selvkontrol.',
  },
  8: {
    tagline: 'Overflod med et strejf af efterår',
    description: 'Haven bugner stadig, men lyset ændrer sig langsomt. Frø samles, grøngødning sås, og nye afgrøder starter op til efterår og vinter, mens georginer og sensommerblomster tager scenen.',
  },
  9: {
    tagline: 'Lun jord og tunge kurve',
    description: 'September er æbler, dugvåde morgener og den perfekte plantetid. Haven giver stadig masser tilbage, men tempoet falder langsomt, mens efteråret begynder at snige sig ind mellem bedene.',
  },
  10: {
    tagline: 'Græskar, blade og sidste høst',
    description: 'Efteråret tager over med farver, regn og kolde morgener. Græskar høstes, løg lægges, og haven gøres klar til vinter, mens blade og tåge langsomt overtager scenen.',
  },
  11: {
    tagline: 'Haven trækker vejret dybt',
    description: 'Nu falder tempoet for alvor. Bedene dækkes til, redskaber pakkes væk, og vinteren begynder at kunne mærkes i jorden. Haven lukker langsomt ned, men livet under overfladen arbejder videre.',
  },
  12: {
    tagline: 'Stilhed, frost og vinterlys',
    description: 'December er den stille måned. Haven hviler under regn, rim og korte dage, mens fuglene fylder haven med liv omkring foderbrætterne. Inde begynder nye planer allerede at tage form.',
  },
}
