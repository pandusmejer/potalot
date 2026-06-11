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
