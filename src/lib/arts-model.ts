/**
 * Artsmodellen — hvad ER arten, og hvad er blot en TYPE under den?
 *
 * Problemet den løser: en pose registreret som `Bønner · Cobra` fandt
 * hverken guiden (`boenne`) eller frøkortet (`stangboenne-cobra`), og en
 * pose registreret som `Stangbønne · Cobra` fandt frøkortet, men ikke
 * guiden. Tre navne — Bønner, Bønne, Stangbønne — for én og samme plante,
 * og intet lag i appen kendte sammenhængen.
 *
 * ── ARKITEKTURREGLEN (ANNA-LÅST 28/7 2026) ─────────────────────────────
 * "Art med typer under, når forskellene mellem typer primært handler om
 * vækst, pleje og anvendelse inden for samme overordnede plante. Fx tomat
 * (busk/ranke), selleri (blad/knold), rose, hortensia. Selvstændig art, når
 * brugeren forventer en HELT anden plante med sit eget dyrkningsforløb."
 *
 * Bønne falder klart i første kategori: `boenne`-guiden ER skrevet som én
 * art (Phaseolus vulgaris) med sektionen "Buskbønne eller stangbønne?" —
 * forskellen er støtte, plads og høsttid, ikke en anden plante. Derfor:
 *
 *     ARTEN er Bønne. Stangbønne og Buskbønne er TYPER under den.
 *
 * ── Hvad var i stykker ─────────────────────────────────────────────────
 * Typelaget fandtes allerede to steder — i guidens prosa og i frøkortenes
 * filnavne (`stangboenne-cobra.png`, `buskboenne-provider.png`) — men
 * ingen resolver kendte det. Guideopslag, billedopslag og Frøbankens
 * gruppering slog alle op på den rå tekst, brugeren havde skrevet. Derfor
 * er det HER typen bor, og ikke i en special-case for Cobra.
 *
 * ── To slags viden, holdt skarpt adskilt ───────────────────────────────
 *
 *   1. ARTSALIAS (`aliaser`) — ren stavemåde. "Bønner" er flertal af
 *      "Bønne". Det siger INTET om væksttype, og må aldrig komme til det:
 *      en pose der bare siger "Bønner" kan lige så godt være en buskbønne.
 *
 *      Et artsalias er en EKSPLICIT UNDTAGELSE, ikke en generel
 *      normalisering (samme ansvarlighed som [sorts-alias.ts]s afviste
 *      F1-regel). Det må kun skrives ind, når begge dele holder:
 *        a) navnet betegner den SAMME botaniske art, og
 *        b) ingen relevant dyrkningsforskel går tabt ved at slå dem sammen.
 *      Latinsk navn må gerne bruges som ekstra valideringssignal — men
 *      ALDRIG som automatik: to danske navne må ikke lægges sammen alene
 *      fordi de deler latinsk navn. Stangbønne, Jordbærmajs, Hirse og
 *      lignende hører derfor IKKE her uden hver sin dokumentation.
 *
 *   2. TYPE (`typer` + `SORTS_TYPER`) — en påstand om væksttype. Den kommer
 *      kun to steder fra: brugeren skrev den selv ("Stangbønne"), eller
 *      Potalot ved det om den konkrete SORT ("Cobra er en stangbønne").
 *      Aldrig gættet, aldrig afledt af arten alene.
 *
 * Samme ansvarlighed som [sorts-alias.ts]: hver post bærer en `begrundelse`,
 * fordi den er en påstand om virkeligheden. Kan påstanden ikke skrives ned,
 * hører posten ikke hjemme her. `scripts/test-arts-model.ts` håndhæver at
 * hver sorts-type peger på et frøkort, der FAKTISK ligger på disken — så en
 * type-påstand aldrig kan blive en pæn hensigt uden dækning.
 *
 * ── Fem brugere ────────────────────────────────────────────────────────
 *   1. Frøkort      resolve-potalot-image → 'Bønner · Cobra' finder
 *                   /images/frokort/stangboenne-cobra.png
 *   2. Guideopslag  froebank-autofill.slaaGuiderOp → 'Stangbønne · Cobra'
 *                   finder artsguiden 'boenne'
 *   3. Gruppering   froebank-grupper.sortsNoegle → 'Bønner Cobra' og
 *                   'Stangbønne Cobra' er ÉN sort i Frøbanken
 *   4. Guide-links  resolve-guide-href → "Se guide" rammer bønneguiden
 *   5. Guide-kobling actions/guides → ingen overflødig AI-guide, og et
 *                   evt. AI-udkast hænger under den rigtige artsguide
 *
 * Brugerens egen tekst ændres ALDRIG. Posen må gerne blive ved med at hedde
 * præcis det, der står på den; Potalot ved bare internt, hvad den svarer til.
 */

/** Én væksttype under en art ("Stangbønne" under "Bønne"). */
export interface ArtsType {
  /** Typens kanoniske navn, som Potalot staver det. */
  navn: string
  /** Andre stavemåder brugeren kan finde på posen. */
  aliaser: string[]
  /** Hvorfor er dette en type og ikke en selvstændig art? */
  begrundelse: string
}

/** Én art med de typer, der hører under den. */
export interface ArtsPost {
  /** Potalots kanoniske artsnavn ("Bønne") — matcher artsguidens plantenavn. */
  art: string
  /** Brugerens stavemåder af ARTEN. Rent sprog — aldrig en typepåstand. */
  aliaser: string[]
  /** Væksttyper under arten. Tom liste = arten har ingen navngivne typer. */
  typer: ArtsType[]
  /** Hvorfor er dette én art med typer frem for flere arter? */
  begrundelse: string
}

/**
 * Arterne med navngivne typer.
 *
 * En art hører kun hjemme her, når den bærer viden appen ellers ikke har:
 * enten navngivne TYPER (som Bønne), eller mindst ét ARTSALIAS, brugeren
 * faktisk kan finde på at skrive (som Agurk). Typenavne tages kun med, når
 * de FAKTISK optræder i brugerens verden — på poser, i frøkortenes filnavne
 * eller i guidens egen tekst. En art uden nogen af delene fungerer uændret
 * uden en post.
 */
export const ARTS_MODEL: ArtsPost[] = [
  {
    art: 'Bønne',
    aliaser: ['Bønner'],
    begrundelse:
      'Artsguiden `boenne` (Phaseolus vulgaris) dækker eksplicit begge ' +
      'væksttyper og har sektionen "Buskbønne eller stangbønne?". ' +
      'Forskellen er støtte, plads og høsttid — samme plante, samme ' +
      'dyrkningsforløb. Jf. den låste arkitekturregel (art med typer).',
    typer: [
      {
        navn: 'Stangbønne',
        aliaser: ['Stangbønner', 'Klatrebønne', 'Klatrebønner'],
        begrundelse:
          'Den klatrende væksttype af Phaseolus vulgaris. Danske frøposer ' +
          'skriver både "Stangbønne" og "Klatrebønne"; Potalots egen ' +
          'teknikguide hedder "Sådan støtter du ærter og klatrebønner". ' +
          'Frøkortene ligger som /images/frokort/stangboenne-*.png.',
      },
      {
        navn: 'Buskbønne',
        aliaser: ['Buskbønner'],
        begrundelse:
          'Den lave væksttype af Phaseolus vulgaris — samme art, ingen ' +
          'høj støtte. Frøkortene ligger som ' +
          '/images/frokort/buskboenne-*.png.',
      },
    ],
  },
  {
    art: 'Agurk',
    aliaser: ['Agurker', 'Skoleagurk', 'Skoleagurker'],
    begrundelse:
      'Agurk (Cucumis sativus) er arten. "Skoleagurk" er ikke en art, men ' +
      'en dansk markedsføringsbetegnelse for de korte, tyndskallede ' +
      'salatagurker, der sælges til skolehaver og altankasser — samme ' +
      'plante, samme dyrkningsforløb, samme guide (`agurk`). Poserne bag ' +
      'fejlen (Skoleagurk · Beit Alpha og Skoleagurk · Snack F1) bærer ' +
      'begge latin_name Cucumis sativus, hvilket bekræfter arten. ' +
      'Sammenlægningen koster ingen dyrkningsviden: Potalot har intet ' +
      'skoleagurk-lag i guider, frøkort eller kalenderregler, og der findes ' +
      'ingen anden art ved det navn. Bemærk grænsen: Jungleagurk ' +
      '(Melothria scabra) er en ANDEN art med sin egen guide og er ' +
      'bevidst holdt uden for.',
    typer: [],
  },
]

/**
 * Væksttypen for en KONKRET sort.
 *
 * Det er her forskellen på "høflig optimisme" og viden ligger: at en pose
 * siger "Bønner" fortæller intet om væksttype — men at sorten hedder Cobra
 * gør, for Cobra ER en stangbønne. Uden en post her får posen INGEN
 * typepåstand, og så finder den heller ikke et typenavngivet frøkort. Det
 * er den rigtige opførsel: forkert billede er værre end intet billede.
 *
 * Hver post er verificeret mod Potalots eget bibliotek — frøkortet med det
 * pågældende typenavn ligger på disken. Testen håndhæver det.
 */
export interface SortsType {
  /** Artens kanoniske navn ("Bønne"). */
  art: string
  /** Sortsnavnet ("Cobra"). */
  sort: string
  /** Typens kanoniske navn ("Stangbønne") — skal findes under arten. */
  type: string
  /** Hvorfor ved vi, at netop denne sort er denne type? */
  begrundelse: string
}

export const SORTS_TYPER: SortsType[] = [
  {
    art: 'Bønne',
    sort: 'Cobra',
    type: 'Stangbønne',
    begrundelse:
      "Cobra er en fransk klatrebønne, der bliver 2-2,5 m høj og kræver " +
      'støtte. Potalots eget frøkort ligger som ' +
      '/images/frokort/stangboenne-cobra.png og er registreret i ' +
      "POTALOT_IMAGE_SETS_BY_ID under 'stangboenne-cobra'.",
  },
  {
    art: 'Bønne',
    sort: 'Blauhilde',
    type: 'Stangbønne',
    begrundelse:
      'Blauhilde er en blåbælget klatrebønne. Verificeret mod ' +
      '/images/frokort/stangboenne-blauhilde.png.',
  },
  {
    art: 'Bønne',
    sort: 'Provider',
    type: 'Buskbønne',
    begrundelse:
      'Provider er en lav busktype uden behov for høj støtte. Verificeret ' +
      'mod /images/frokort/buskboenne-provider.png.',
  },
  {
    art: 'Bønne',
    sort: 'Purple Queen',
    type: 'Buskbønne',
    begrundelse:
      'Purple Queen er en lav busktype med violette bælge. Verificeret mod ' +
      '/images/frokort/buskboenne-purple-queen.png.',
  },
]

/**
 * Samme normalisering som billedresolverens `slugify`, guide-importens slug,
 * Frøbankens `normaliser` og sortsaliassets. De er byte-identiske, og
 * artsmodellen skal ramme dem alle — derfor genskabes reglen her frem for at
 * importere den ene af dem og binde modulet til ét lag.
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

/** Opslagskort: normaliseret navn → { art, type } */
interface NavnePost {
  art: ArtsPost
  type: ArtsType | null
}

const NAVNE_KORT = new Map<string, NavnePost>()
for (const post of ARTS_MODEL) {
  for (const navn of [post.art, ...post.aliaser]) {
    const n = normaliser(navn)
    if (n && !NAVNE_KORT.has(n)) NAVNE_KORT.set(n, { art: post, type: null })
  }
  for (const type of post.typer) {
    for (const navn of [type.navn, ...type.aliaser]) {
      const n = normaliser(navn)
      if (n && !NAVNE_KORT.has(n)) NAVNE_KORT.set(n, { art: post, type })
    }
  }
}

const SORTS_TYPE_KORT = new Map(
  SORTS_TYPER.map(s => [`${normaliser(s.art)}|${normaliser(s.sort)}`, s]),
)

/** Resultatet af et artsopslag. Ukendte navne returneres uændret. */
export interface ArtsOpslag {
  /** Potalots kanoniske artsnavn ("Bønne") — brugerens eget navn hvis ukendt. */
  art: string
  /** Normaliseret artsslug ("boenne"). */
  artSlug: string
  /** Typenavnet hvis brugerens tekst NAVNGAV en type, ellers null. */
  type: string | null
  /** Normaliseret typeslug ("stangboenne"), ellers null. */
  typeSlug: string | null
  /** Kendte artsmodellen navnet? Falsk = alt returneres, som brugeren skrev. */
  kendt: boolean
}

/**
 * Slå brugerens artstekst op i modellen.
 *
 * "Bønner" → { art: 'Bønne', type: null }      (kun en stavemåde)
 * "Stangbønne" → { art: 'Bønne', type: 'Stangbønne' }
 * "Tomat" → { art: 'Tomat', type: null, kendt: false }  (uændret)
 */
export function slaaArtOp(navn: string | null | undefined): ArtsOpslag {
  const raa = (navn ?? '').trim()
  const n = normaliser(raa)
  const fund = n ? NAVNE_KORT.get(n) : undefined
  if (!fund) {
    return { art: raa, artSlug: n, type: null, typeSlug: null, kendt: false }
  }
  return {
    art: fund.art.art,
    artSlug: normaliser(fund.art.art),
    type: fund.type?.navn ?? null,
    typeSlug: fund.type ? normaliser(fund.type.navn) : null,
    kendt: true,
  }
}

/**
 * Potalots kanoniske artsnavn for brugerens tekst — i visningsform, så det
 * kan sammenlignes med `plant_name` på en guide. Ukendte navne returneres
 * uændret (trimmet).
 */
export function kanoniskArtsNavn(navn: string | null | undefined): string {
  return slaaArtOp(navn).art
}

/** Kanonisk artsslug ("Bønner" → "boenne"). Ukendte navne normaliseres blot. */
export function kanoniskArtsSlug(navn: string | null | undefined): string {
  return slaaArtOp(navn).artSlug
}

/**
 * Posens væksttype — eller null, når Potalot ikke ved det.
 *
 * Rækkefølgen er ikke tilfældig: viden om SORTEN vinder over brugerens
 * artsfelt, fordi den er en efterprøvet kendsgerning om planten og er ens
 * for alle. Skriver en bruger "Buskbønne · Cobra", er posen stadig en Cobra
 * — og skal ligge i samme mappe som hendes andre Cobra-poser. Brugerens
 * egen tekst står uændret på posen; det er kun det INTERNE opslag, der
 * bruger den efterprøvede type.
 *
 * Kender vi hverken sorten eller et typenavn i artsfeltet, returneres null:
 * en pose der bare siger "Bønner" får ingen typepåstand.
 */
export function typeSlugForPose(
  navn: string | null | undefined,
  sort: string | null | undefined,
): string | null {
  const opslag = slaaArtOp(navn)
  const fraSort = SORTS_TYPE_KORT.get(`${opslag.artSlug}|${normaliser(sort)}`)
  if (fraSort) return normaliser(fraSort.type)
  return opslag.typeSlug
}

/** Eksporteret til testen, så model og kaldere deler præcis én regel. */
export const normaliserArtsDel = normaliser
