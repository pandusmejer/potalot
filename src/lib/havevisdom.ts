/**
 * Havevisdom — lånt erfaring til Havebogens niveau 0 (V6).
 *
 * Når brugeren endnu ingen egen historie har, læner Havebogen sig
 * op ad fællesskabets erfaring: "Indtil vi kender din have, kan du
 * læne dig op ad andres erfaringer."
 *
 * STEMME-REGLER (havebog.md V6):
 *   - ALDRIG "VIDSTE DU AT..." / "FAKTA" / "TIP" — det er ikke et
 *     blogindlæg, ikke internet anno 2012
 *   - Skrives som havevisdom, erfaring, observation
 *   - Ærligheds-reglen: ingen fabrikerede procenter. Kvalitative
 *     formuleringer ("mange dyrkere", "de fleste") eller tal
 *     forankret i hortikulturel fakta ("110-130 dage efter såning")
 *
 * Progressionen: efterhånden som brugeren bygger egen historie,
 * træder disse linjer i baggrunden (niveau 1-3 overtager) — jo
 * længere brugeren dyrker, desto mindre fællesskab, desto mere
 * "dig".
 */

export interface LaantErfaring {
  /** Til "På denne dag"-tom-tilstand — hvad sker der typisk netop nu */
  paaDenneDag: string
  /** Til Historik-tom-tilstand — typiske tidslinjer og rytmer */
  historik: string
  /** Til Kapitel 1 for nye brugere — havens øjeblik, fællesskabs-form */
  ligeNu: string
}

const LAANT_ERFARING_BY_MONTH: LaantErfaring[] = [
  // Januar
  {
    paaDenneDag: 'På denne tid af året planlægger mange dyrkere sæsonen med frøkataloger og sidste års noter.',
    historik: 'De fleste dyrkningshistorier begynder i januar — med en plan, længe før det første frø rører jord.',
    ligeNu: 'Mange dyrkere bruger januar på at bestille frø og tegne årets bede.',
  },
  // Februar
  {
    paaDenneDag: 'På denne tid af året sår mange dyrkere chili og peberfrugt indendørs — de langsomste sorter først.',
    historik: 'Chili og peberfrugt hører til sæsonens tidligste såninger — typisk 10-21 dage om at spire ved stuevarme.',
    ligeNu: 'De tidligste såninger står i vindueskarme landet over netop nu.',
  },
  // Marts
  {
    paaDenneDag: 'På denne tid af året forspirer mange dyrkere deres tomater — marts er den klassiske tomatmåned.',
    historik: 'Tomater sået i marts giver typisk høst fra sidst i juli — omkring 110-130 dage fra frø til frugt.',
    ligeNu: 'Marts er forspirings-måneden — vindueskarmene fyldes med såbakker.',
  },
  // April
  {
    paaDenneDag: 'På denne tid af året prikler mange dyrkere deres forspirede planter om i egne potter.',
    historik: 'April er priklemåneden — de fleste forspirede planter flyttes til egne potter, når andet bladpar viser sig.',
    ligeNu: 'Mange dyrkere prikler og udplanter de hårdføre sorter i disse uger.',
  },
  // Maj
  {
    paaDenneDag: 'På denne tid af året hærder mange dyrkere deres planter af — et par timer ude ad gangen, mere dag for dag.',
    historik: 'Maj er overgangsmåneden: planter der har levet indendørs siden marts, vænnes langsomt til livet udenfor.',
    ligeNu: 'Afhærdning fylder i de fleste haver netop nu — tålmodigheden i maj betaler sig i juli.',
  },
  // Juni
  {
    paaDenneDag: 'På denne tid af året begynder mange dyrkere at hærde tomater og chili af før udplantning.',
    historik: 'Den typiske danske dyrker høster de første tomater 110-130 dage efter såning — for marts-såninger vil det sige fra sidst i juli.',
    ligeNu: 'De fleste varmekrævende sorter kommer i jorden i disse uger — jorden er varm nok nu.',
  },
  // Juli
  {
    paaDenneDag: 'På denne tid af året høster mange dyrkere deres første tomater — og binder op løbende.',
    historik: 'Juli er den måned hvor de fleste haver vender: fra pleje til høst.',
    ligeNu: 'Højsommerens rytme er vanding, opbinding og de første høster.',
  },
  // August
  {
    paaDenneDag: 'På denne tid af året står de fleste køkkenhaver i fuld produktion — høst lidt ad gangen og ofte.',
    historik: 'August er hovedhøstmåneden i de fleste danske haver — det der blev sået i marts, fylder kurvene nu.',
    ligeNu: 'Mange dyrkere sår efterårssalat og spinat nu, mens hovedhøsten ruller.',
  },
  // September
  {
    paaDenneDag: 'På denne tid af året samler mange dyrkere frø fra deres bedste planter til næste sæson.',
    historik: 'September er frøsamlingens måned — det er her næste års have begynder.',
    ligeNu: 'Sensommeren handler om at høste færdigt og gemme frø på tørre dage.',
  },
  // Oktober
  {
    paaDenneDag: 'På denne tid af året graver mange dyrkere deres dahlia-knolde op før den første nattefrost.',
    historik: 'Oktober lukker sæsonen for de fleste — knolde graves op, og bedene dækkes til vinter.',
    ligeNu: 'De sidste afgrøder kommer ind, og mange dyrkere rydder bede i disse uger.',
  },
  // November
  {
    paaDenneDag: 'På denne tid af året sætter mange dyrkere hvidløg — den tålmodiges afgrøde, der først høstes til sommer.',
    historik: 'Hvidløg sat i november står i jorden i over et halvt år — sæsonens længste løfte.',
    ligeNu: 'Haven går i hvile, men hvidløg og forårsløg kommer i jorden netop nu.',
  },
  // December
  {
    paaDenneDag: 'På denne tid af året evaluerer mange dyrkere sæsonen — hvad virkede, og hvad skal prøves igen.',
    historik: 'December er eftertankens måned: de bedste dyrkere lærer mere af noterne end af kataloget.',
    ligeNu: 'Haven hviler — og mange dyrkere planlægger allerede næste sæson.',
  },
]

/**
 * Lånt erfaring for en given måned (1-12).
 */
export function laantErfaring(month: number): LaantErfaring {
  const m = Math.max(1, Math.min(12, month))
  return LAANT_ERFARING_BY_MONTH[m - 1]
}

/**
 * Dagens havevisdom — niveau 0-puljen til Kapitel 1 ("I dag i haven").
 *
 * V10.1 (Annas museums-kritik): rotations-mekanikken fandtes, men
 * puljen sultede — to demo-linjer og én månedlig visdomslinje gør
 * ikke fem dage i træk forskellige. Her er en rigtig pulje af
 * almen havevisdom, sæson-opdelt, som Kapitel 1 kan rotere igennem
 * dag for dag.
 *
 * STEMME-REGLER (samme som laantErfaring): aldrig "vidste du at"/
 * "tip"/"fakta". Observation og håndværk, ikke blogindlæg. Ærligheds-
 * reglen: kvalitative formuleringer, ingen fabrikerede procenter.
 * Niveau 0 betyder ALMEN — ingen påstande om brugerens egne planter
 * (de hører til niveau 1-3, opdagelsesmotoren).
 *
 * Sæson-opdeling så en vinterlinje aldrig dukker op i juli. Inden
 * for sæsonen er rækkefølgen ligegyldig — Kapitel 1 vælger dagens
 * linje deterministisk ud fra dagsnummer.
 */
const HAVEVISDOM_FORAAR: string[] = [
  'Jorden skal være lun, før de varmekære frø spirer villigt.',
  'Forspirede planter trives bedst, når de vænnes langsomt til livet udenfor.',
  'Et tyndt lag kompost nu giver næring sæsonen igennem.',
  'Tålmodighed i foråret betaler sig om sommeren — koldskudte planter henter sjældent det tabte.',
  'De fleste fejl i foråret handler om at have for travlt.',
  'Havearbejde har en dokumenteret positiv effekt på trivsel — også de dage, hvor intet spirer endnu.',
  'Sås der lidt ad gangen med et par ugers mellemrum, holder høsten længere.',
]
const HAVEVISDOM_SOMMER: string[] = [
  'Tomater giver mere, hvis sideskuddene nippes løbende.',
  'Vanding tidligt om morgenen fordamper mindre end vanding midt på dagen.',
  'En have passet ti minutter om dagen trives bedre end en have passet en time om ugen.',
  'De fleste salater bliver bitre, når de går i stok — høst hellere for tidligt end for sent.',
  'Bier og svirrefluer finder lettere de haver, hvor noget altid blomstrer.',
  'Frø sat til lige nu når stadig at give høst inden efteråret.',
  'En tur i haven om aftenen afslører mere end et hurtigt blik om morgenen.',
]
const HAVEVISDOM_EFTERAAR: string[] = [
  'Frø fra årets bedste planter er ofte de bedste at gemme til næste år.',
  'Et bed dækket med blade eller halm bevarer livet i jorden vinteren over.',
  'Efteråret er den bedste tid at plante det, der skal stå klar til foråret.',
  'Det meste af årets læring ligger i, hvad der gik anderledes end ventet.',
  'Løg sat nu blomstrer som det første, når foråret vender tilbage.',
  'En sidste høst smager ofte bedst — den er ventet længst.',
]
const HAVEVISDOM_VINTER: string[] = [
  'De bedste sæsoner planlægges, mens haven hviler.',
  'Frøkataloger om vinteren er halvdelen af glæden ved at dyrke.',
  'Jorden hviler nu — det må gartneren også gerne.',
  'En plan tegnet i januar spirer ofte bedre end et indfald i maj.',
  'Vinteren er tiden til at læse årets noter, før de glemmes.',
  'De hårdføre krydderurter i vindueskarmen holder haven i live indtil foråret.',
]

/**
 * Sæsonens visdomspulje (1-12). Forår: mar-maj, sommer: jun-aug,
 * efterår: sep-nov, vinter: dec-feb.
 */
export function havevisdomPulje(month: number): string[] {
  const m = Math.max(1, Math.min(12, month))
  if (m >= 3 && m <= 5) return HAVEVISDOM_FORAAR
  if (m >= 6 && m <= 8) return HAVEVISDOM_SOMMER
  if (m >= 9 && m <= 11) return HAVEVISDOM_EFTERAAR
  return HAVEVISDOM_VINTER
}

/**
 * Blik fremad (V15: ildstedets sidste takt). Hvad der venter,
 * hvad mange dyrkere går i gang med nu — den fremadrettede linje
 * der lukker "havens stemme" med forventning frem for status.
 * Almen og sand; ingen påstande om brugerens egne planter.
 */
const FORVENTNING_FORAAR = [
  'Snart er nætterne lune nok til, at de varmekære planter kan komme ud.',
  'Om kort tid eksploderer haven — maj og juni er årets hurtigste måneder.',
  'De første udplantninger nærmer sig; haven står på spring.',
]
const FORVENTNING_SOMMER = [
  'Mange dyrkere begynder allerede nu at planlægge efterårets afgrøder.',
  'Om få uger er det tid til at så efterårssalat og asiatisk bladgrønt.',
  'Højsommeren er tæt på — snart topper både høst og blomstring.',
]
const FORVENTNING_EFTERAAR = [
  'Nu er det tid til at tænke på, hvad der skal dække jorden vinteren over.',
  'Snart kan forårsløgene komme i jorden — det første, der vågner næste år.',
  'De sidste høster gemmes; haven gør sig klar til at hvile.',
]
const FORVENTNING_VINTER = [
  'Om få måneder begynder de første såninger på vindueskarmen.',
  'Det er nu, årets plan og frøbestilling tager form.',
  'Foråret er tættere på, end det føles — de tidligste chilier sås snart.',
]

export function forventningsLinje(month: number, dagNr: number): string {
  const m = Math.max(1, Math.min(12, month))
  const pulje =
    m >= 3 && m <= 5 ? FORVENTNING_FORAAR
    : m >= 6 && m <= 8 ? FORVENTNING_SOMMER
    : m >= 9 && m <= 11 ? FORVENTNING_EFTERAAR
    : FORVENTNING_VINTER
  return pulje[Math.abs(dagNr) % pulje.length]
}
