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
    tagline: 'Den frodige måned',
    description: 'Alt vokser hurtigere end du kan følge med. Vand, gød, og høst de første salater.',
  },
  7: {
    tagline: 'Højsommer',
    description: 'Tomater rødmer, agurker buldrer afsted. Hold styr på vandingen og pas på drivhusvarmen.',
  },
  8: {
    tagline: 'Høstens hjerte',
    description: 'Bønner, squash, bær. Konservering, syltning, frysning — gem mens overskuddet er der.',
  },
  9: {
    tagline: 'Sensommerens høst',
    description: 'Æbler, blommer, de sidste tomater. Tid til at samle frø til næste år.',
  },
  10: {
    tagline: 'Efterårets ro',
    description: 'Løg i jorden, bede ryddes. Tæk de skrøbelige før vinteren kommer.',
  },
  11: {
    tagline: 'Hvilemåneden',
    description: 'Lyset svinder. Hav-værktøjet ind, planlæg næste sæson over en kop te.',
  },
  12: {
    tagline: 'Jul i haven',
    description: 'Stille. Lad jorden hvile, saml kogler og hyld bringes ind.',
  },
}
