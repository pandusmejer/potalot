/**
 * Dansk copy-integritet — vagt om korrektur-batch 2 (2/9 2026).
 *
 * Batchen rettede konkrete sprogfejl og hårdkodet copy. Denne test findes,
 * fordi præcis de fejl realistisk kan genopstå: nye formularer skriver
 * "8 tegn" i hånden, ny sæsoncopy får et årstal med, og "Fx." er en vane.
 *
 * Tre slags tjek:
 *   1. kodeordskravet har ÉN sandhedskilde — UI og validering kan ikke
 *      komme til at sige to forskellige tal
 *   2. sæson-templates indeholder ingen hårdkodede årstal
 *   3. statisk scanning af src/ efter de rettede sprogfejl
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { authFejlBesked } from '@/lib/auth-fejl'
import { KODEORD_MIN_TEGN, KODEORD_KRAV_TEKST, KODEORD_FOR_KORT } from '@/lib/kodeord'
import { SEASONAL_CHALLENGES } from '@/lib/seasonal-challenges'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}

/** Alle .ts/.tsx-filer under src/, undtagen de auto-genererede datasæt. */
function srcFiler(dir = 'src'): string[] {
  const ud: string[] = []
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn)
    if (statSync(sti).isDirectory()) {
      if (navn === 'node_modules') continue
      ud.push(...srcFiler(sti))
    } else if (/\.tsx?$/.test(navn) && !/\.generated\.ts$/.test(navn)) {
      ud.push(sti)
    }
  }
  return ud
}

const ALLE = srcFiler()

/**
 * Kommentarer er ikke brugertekst. Udviklernoter må skrive "max 4" og
 * "en tidsbaseret hilsen" — vagten gælder det brugeren læser, så vi
 * fjerner blok- og linjekommentarer før scanningen (linjenumre bevares).
 */
function udenKommentarer(kilde: string): string[] {
  const linjer = kilde.split('\n')
  let iBlok = false
  return linjer.map(linje => {
    let ud = ''
    for (let i = 0; i < linje.length; i++) {
      if (iBlok) {
        if (linje.startsWith('*/', i)) { iBlok = false; i++ }
        continue
      }
      if (linje.startsWith('/*', i)) { iBlok = true; i++; continue }
      // "//" starter en kommentar — men ikke midt i "https://".
      if (linje.startsWith('//', i) && linje[i - 1] !== ':') break
      ud += linje[i]
    }
    return ud
  })
}

// ---------------------------------------------------------------- kodeord

console.log('\n[Kodeordskravet har én sandhedskilde]')
{
  tjek('krav-teksten nævner konstantens tal', KODEORD_KRAV_TEKST.includes(String(KODEORD_MIN_TEGN)))
  tjek('fejlbeskeden nævner konstantens tal', KODEORD_FOR_KORT.includes(String(KODEORD_MIN_TEGN)))

  const FORMULARER = [
    'src/components/auth/signup-form.tsx',
    'src/components/auth/reset-password-form.tsx',
    'src/components/profil/change-password-form.tsx',
  ]
  for (const f of FORMULARER) {
    const kilde = udenKommentarer(readFileSync(f, 'utf8')).join('\n')
    tjek(`${f}: ingen hårdkodet tegnlængde i copy`, !/\d+ tegn/.test(kilde),
      (kilde.match(/.*\d+ tegn.*/) ?? [''])[0].trim())
    tjek(`${f}: minLength kommer fra konstanten`,
      !/minLength=\{\d+\}/.test(kilde) && kilde.includes('KODEORD_MIN_TEGN'))
  }
}

console.log('\n[Supabase bestemmer sit eget minimum — vi ekkoer det, gætter ikke]')
{
  const FALLBACK = 'Kunne ikke logge ind.'
  tjek('serverens tal går igennem (6)',
    authFejlBesked({ message: 'Password should be at least 6 characters.' }, FALLBACK)
      === 'Kodeordet skal være på mindst 6 tegn.')
  tjek('serverens tal går igennem (12)',
    authFejlBesked({ message: 'Password should be at least 12 characters.' }, FALLBACK)
      === 'Kodeordet skal være på mindst 12 tegn.')
  tjek('uden tal falder vi tilbage på Potalots eget krav',
    authFejlBesked({ message: 'Password should be at least the required length' }, FALLBACK)
      === `Kodeordet skal være på mindst ${KODEORD_MIN_TEGN} tegn.`)
  tjek('øvrige kendte fejl er uændrede',
    authFejlBesked({ message: 'User already registered' }, FALLBACK)
      === 'Der findes allerede en konto med den mail.')
  tjek('ukendt fejl lækker ikke den tekniske streng',
    authFejlBesked({ message: 'AuthApiError: 500 unexpected_failure' }, FALLBACK) === FALLBACK)
}

// ------------------------------------------------------------------- årstal

console.log('\n[Sæson-templates genbruges hvert år — ingen hårdkodede årstal]')
for (const c of SEASONAL_CHALLENGES) {
  const tekst = `${c.title} ${c.description} ${c.prompt}`
  const fund = tekst.match(/\b(19|20)\d{2}\b/)
  tjek(`${c.slug}`, fund === null, fund ? `fandt "${fund[0]}" i brugerteksten` : '')
}

// -------------------------------------------------------------- sprogfejl

console.log('\n[Rettede sprogfejl må ikke genopstå]')
{
  const FORBUDT: Array<{ moenster: RegExp; hvorfor: string }> = [
    { moenster: /\bF?fx\./i, hvorfor: '"fx" skrives uden punktum (Docs/content/potalot-terminologi.md)' },
    { moenster: /\bF\.eks\./i, hvorfor: 'Potalot-standarden er "fx"' },
    { moenster: /et hilsen/i, hvorfor: 'hilsen er fælleskøn: "en hilsen"' },
    { moenster: /blomsterne er på sit/i, hvorfor: 'flertal: "på deres højeste"' },
    { moenster: /Voks din frøbank/i, hvorfor: 'unaturligt dansk — "Udvid din frøbank"' },
    { moenster: /\bprocessere\b/i, hvorfor: 'brug "behandle"' },
    { moenster: /'Tom AI-svar'/, hvorfor: 'intetkøn: "Tomt AI-svar"' },
    { moenster: /\}MB\b/, hvorfor: 'enheden skrives med mellemrum: "maks. 8 MB"' },
    { moenster: /\bmax \d/, hvorfor: 'dansk forkortelse er "maks."' },
  ]
  for (const { moenster, hvorfor } of FORBUDT) {
    const traef: string[] = []
    for (const f of ALLE) {
      for (const [nr, linje] of udenKommentarer(readFileSync(f, 'utf8')).entries()) {
        if (moenster.test(linje)) traef.push(`${f}:${nr + 1}  ${linje.trim().slice(0, 100)}`)
      }
    }
    tjek(`${moenster.source} — ${hvorfor}`, traef.length === 0, traef.join('\n      '))
  }
}

console.log(`\n${fejlet === 0 ? '✓' : '✗'} dansk-copy: ${bestaaet} bestået, ${fejlet} fejlet\n`)
process.exit(fejlet === 0 ? 0 : 1)
