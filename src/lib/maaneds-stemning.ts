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
    tagline: 'Vinterhvile',
    description: 'Haven sover. Tid til frøkataloger, planlægning og at sortere frøposerne.',
  },
  2: {
    tagline: 'Vinterens slutspil',
    description: 'Forspiringen begynder for de tidligste sorter. Lyset vender langsomt.',
  },
  3: {
    tagline: 'Forspiringens måned',
    description: 'Tomater, chili og peberfrugt i karme. Tjek varmen — frøene har brug for stabilitet.',
  },
  4: {
    tagline: 'Forårets start',
    description: 'Jorden vågner. Kolde planter kan friland-sås, de varmekrævende klargøres indenfor.',
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
