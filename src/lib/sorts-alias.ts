/**
 * Kanoniske sortsaliasser — ét sted, tre brugere.
 *
 * Problemet: brugerens pose og Potalots bibliotek staver samme sort
 * forskelligt. Squash 'Eight Ball' sælges også som 'Eight Ball F1'; posen
 * skriver hybridbetegnelsen med, frøkortet gør ikke. Uden et alias finder
 * posen aldrig sit frøkort, og Frøbanken viser to mapper for én sort.
 *
 * ── LÅST REGEL (Anna, 25/8 2026) ────────────────────────────────────────
 * Aliasserne er EKSPLICITTE og verificeret pr. sort. Der er bevidst ingen
 * generel regel af typen `replace(/-f[12]$/, '')`: "F1" kan være en reel
 * del af sortsidentiteten, og en universel afkortning ville kunne give
 * `Sort X F1` både billede og gruppedata fra en FAKTISK anden `Sort X`.
 * Grundreglen står ved magt — forkert billede er værre end intet billede.
 *
 * Eksakt match vinder ALTID før alias: aliaset er en ekstra kandidat, der
 * kun bruges når den nøjagtige stavemåde ikke findes.
 *
 * Hvert alias bærer en `begrundelse`, fordi et alias er en påstand om at
 * to navne betegner den SAMME plante. Kan påstanden ikke skrives ned, hører
 * aliaset ikke hjemme her.
 *
 * ── Tre brugere ─────────────────────────────────────────────────────────
 *   1. Frøkort      resolve-potalot-image → 'Eight Ball F1' finder
 *                   /images/frokort/squash-eight-ball.png
 *   2. Gruppering   froebank-grupper.sortsNoegle → 'Eight Ball' og
 *                   'Eight Ball F1' bliver ÉN sort i Frøbanken
 *   3. Oprettelse   froebank-autofill.slaaGuiderOp + importens sortsnøgle
 *                   → Potalot genkender den indtastede betegnelse
 *
 * Brugerens egen tekst ændres ALDRIG. Posen må gerne blive ved med at hedde
 * præcis det, der står på den; Potalot ved bare internt, hvad den svarer til.
 */

/** Ét verificeret synonym inden for ÉN art. */
export interface SortsAlias {
  /** Artsnavn, som brugeren skriver det ("Squash"). */
  art: string
  /** Sortsnavnet på brugerens pose ("Eight Ball F1"). */
  fra: string
  /** Potalots kanoniske sortsnavn ("Eight Ball"). */
  til: string
  /** Hvorfor er de to den samme sort? Verificeret, ikke gættet. */
  begrundelse: string
}

/**
 * Aliasserne. Kun sorter hvor synonymet er efterprøvet — og hvor målet
 * FINDES i Potalots bibliotek. Et alias der peger på ingenting hjælper
 * ingen; testen (`scripts/test-sorts-alias.ts`) håndhæver begge dele.
 */
export const SORTS_ALIASER: SortsAlias[] = [
  {
    art: 'Squash',
    fra: 'Eight Ball F1',
    til: 'Eight Ball',
    begrundelse:
      "'Eight Ball' ER en F1-hybrid — flere leverandører skriver hybrid" +
      'betegnelsen med på posen, Potalots frøkort gør ikke. Der findes ingen ' +
      'anden squash-sort ved navn Eight Ball, så synonymet er entydigt. ' +
      'Verificeret mod /images/frokort/squash-eight-ball.png.',
  },
]

/**
 * Samme normalisering som billedresolverens `slugify`, guide-importens
 * slug og Frøbankens `normaliser`. De tre er byte-identiske, og aliasset
 * skal ramme dem alle — derfor genskabes reglen her frem for at importere
 * den ene af dem og binde modulet til et lag.
 *
 * æøå håndteres FØR NFD, da å ellers dekomponeres til 'a' i stedet for 'aa'.
 */
function normaliser(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const ALIAS_KORT = new Map(
  SORTS_ALIASER.map(a => [`${normaliser(a.art)}|${normaliser(a.fra)}`, normaliser(a.til)]),
)

/**
 * Sortens kanoniske slug inden for arten.
 *
 * Tager rå navne (som brugeren skrev dem) og returnerer det NORMALISEREDE
 * sortsnavn Potalot kender. Findes der intet alias, returneres sortens egen
 * normaliserede form — så kaldere altid kan bruge resultatet direkte.
 */
export function kanoniskSortsSlug(
  art: string | null | undefined,
  sort: string | null | undefined,
): string {
  const a = normaliser(art)
  const s = normaliser(sort)
  if (!a || !s) return s
  return ALIAS_KORT.get(`${a}|${s}`) ?? s
}

/** Findes der overhovedet et alias for denne art+sort? */
export function harSortsAlias(
  art: string | null | undefined,
  sort: string | null | undefined,
): boolean {
  const a = normaliser(art)
  const s = normaliser(sort)
  if (!a || !s) return false
  return ALIAS_KORT.has(`${a}|${s}`)
}

/** Eksporteret til testen, så alias og kaldere deler præcis én regel. */
export const normaliserAliasDel = normaliser
