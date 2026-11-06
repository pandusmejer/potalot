/**
 * MVP 1.0 — central og REVERSIBEL konfiguration (fase 0).
 *
 * Potalot MVP'en viser fire hovedområder med Frøbanken som centrum. Alt
 * andet (Havebog, Guides-biblioteket, Idétavle, Grupper, Havelandskab …) er
 * SKJULT — ikke slettet. Kode, data, billeder og guides ligger urørt.
 *
 * Sådan genaktiveres den fulde app:
 *   Sæt miljøvariablen NEXT_PUBLIC_MVP_MODE=off (lokalt i .env.local, i drift
 *   i Netlify) og byg/genstart. Så er navigation, landing og alle ruter
 *   præcis som før MVP'en. Ingen kode skal ændres.
 *
 * Enkeltdele kan også åbnes hver for sig: fjern en rute fra
 * MVP_SKJULTE_RUTER, eller tilføj et punkt i MVP_NAV.
 *
 * VIGTIGT: filen må IKKE importere noget. Den læses af både proxy.ts
 * (kører før appen) og klient-komponenter, så den skal forblive rene
 * konstanter og funktioner.
 */

/** MVP er slået TIL som standard. Kun den eksplicitte værdi 'off' slår den fra. */
export const MVP_MODE = process.env.NEXT_PUBLIC_MVP_MODE !== 'off'

/** Standardlandingsside i MVP'en — brugeren lander i Min frøbank. */
export const MVP_LANDING = '/froebank'

/** Stabile nøgler til navigationspunkterne (ikonet vælges i bottom-nav). */
export type MvpNavId = 'froebank' | 'planter' | 'opgaver' | 'spoerg'

export interface MvpNavPunkt {
  id: MvpNavId
  href: string
  label: string
}

/** MVP'ens fire primære navigationspunkter, i visningsrækkefølge. */
export const MVP_NAV: readonly MvpNavPunkt[] = [
  { id: 'froebank', href: '/froebank', label: 'Min frøbank' },
  { id: 'planter', href: '/mine-planter', label: 'Mine planter' },
  { id: 'opgaver', href: '/kalender', label: 'Opgaver' },
  { id: 'spoerg', href: '/spoerg', label: 'Spørg Potalot' },
]

/**
 * Sektioner der er skjult i MVP'en. En rute matcher, når stien ER præfikset
 * eller ligger under det. Besøg omdirigeres til MVP_LANDING (proxy.ts).
 *
 * Bevidst IKKE med i fase 0:
 *   - /guides: guide-siderne er linkmål fra frøposer og planter. Biblioteket
 *     er ude af navigationen, men ruterne står åbne, til de sider der linker
 *     dertil er forenklet (fase 1-3).
 *   - /profil, /indstillinger, /onboarding, /admin: bevares uændret.
 */
export const MVP_SKJULTE_RUTER: readonly string[] = [
  '/havebog',
  '/idetavle',
  '/grupper',
  '/havelandskab',
]

/** Er stien skjult i MVP'en? Forsiden (/) er Havebog og tæller med. */
export function erSkjultIMvp(pathname: string): boolean {
  if (!MVP_MODE) return false
  if (pathname === '/') return true
  return MVP_SKJULTE_RUTER.some(
    (rute) => pathname === rute || pathname.startsWith(rute + '/'),
  )
}

/** Skjulte menupunkter og genveje uden for bundnavigationen. */
export const MVP_SKJUL = {
  /** "Min idétavle" i profilmenuen. */
  idetavleIProfilmenu: MVP_MODE,
  /** Mikrofonknappen i topbaren — noterne lander i Havebog, som er skjult. */
  diktafonITopbar: MVP_MODE,
} as const
