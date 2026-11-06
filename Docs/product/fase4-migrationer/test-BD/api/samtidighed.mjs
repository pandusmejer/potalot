// API- og SAMTIDIGHEDSTEST af migration B og D mod en ISOLERET Supabase-branch (PostgREST/GoTrue/supabase-js).
// Rører ALDRIG produktion: scriptet afbryder, hvis URL'en ikke indeholder BRANCH_REF.
//
// Forudsætninger (se BD-migrationsplan.md, trin "Branch-test"):
//   1. Midlertidig branch oprettet (kræver særskilt godkendelse + omkostning ≈ $0,013/time).
//   2. Replika + 00072 (A) + 00074 (B) + 00076 (D) anvendt på branchen.
//   3. Testbrugere oprettet (test-A/api/lav-brugere.mjs → legitimation.json i den mappe, du kører fra).
//
// Kør:  BRANCH_REF=<ref> SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=… node samtidighed.mjs
//
// Hvad den beviser, som PGlite IKKE kan (PGlite er én forbindelse):
//   · 40 PARALLELLE kald mod grænse 30 giver præcis 30 tilladt / 10 afvist — også når rækken ikke findes endnu
//     (INSERT-konflikt-stien) og når den findes (UPDATE-stien).
//   · Hver tilladt reservation får et UNIKT antal 1..30 (ingen to kald fik "det sidste").
//   · Svarformen via PostgREST er en liste af { tilladt, brugt } — det koden (afgoerKvote) forventer.

import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire('/Users/mejervind/potalot/package.json')
const { createClient } = require('@supabase/supabase-js')

const REF = process.env.BRANCH_REF
const URL_ = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_ANON_KEY
if (!REF || !URL_?.includes(REF)) throw new Error('Afbrudt: BRANCH_REF mangler, eller URL peger ikke på test-branchen')

const leg = JSON.parse(readFileSync(join(process.cwd(), 'legitimation.json'), 'utf8'))
const ny = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
async function login(navn) {
  const c = ny()
  const { data, error } = await c.auth.signInWithPassword({ email: leg[navn].email, password: leg[navn].password })
  if (error) throw new Error(`login ${navn}: ${error.message}`)
  return { c, id: data.user.id }
}

let ok = 0, fejl = 0
const log = []
const tjek = (navn, b, d = '') => { b ? ok++ : fejl++; log.push(`  ${b ? '✓' : '✗'} ${navn}${!b && d ? ` — ${d}` : ''}`) }
const kort = (e) => (e ? `${e.code ?? ''} ${e.message ?? ''}`.trim() : '')
const sek = (t) => log.push(`\n${t}`)

const LOFT = 30
const PARALLELLE = 40
const owner = await login('owner'), alice = await login('alice'), bob = await login('bob'), carol = await login('carol')
const anon = ny()

async function parallelt(bruger, n = PARALLELLE, graense = LOFT) {
  const svar = await Promise.all(Array.from({ length: n }, () => bruger.c.rpc('reserver_gartner_spoergsmaal', { p_graense: graense })))
  return svar
}
function opsummer(svar) {
  const fejlede = svar.filter((s) => s.error)
  const raekker = svar.filter((s) => !s.error).map((s) => (Array.isArray(s.data) ? s.data[0] : s.data))
  const tilladt = raekker.filter((r) => r?.tilladt === true)
  const afvist = raekker.filter((r) => r?.tilladt === false)
  return { fejlede, tilladt, afvist, unikke: new Set(tilladt.map((r) => r.brugt)) }
}

sek('D — svarform via PostgREST')
{
  const r = await bob.c.rpc('reserver_gartner_spoergsmaal', { p_graense: 5 })
  tjek('rpc returnerer en liste med { tilladt, brugt } (koden: afgoerKvote)', !r.error && Array.isArray(r.data) && r.data.length === 1 && r.data[0].tilladt === true && typeof r.data[0].brugt === 'number', kort(r.error) + JSON.stringify(r.data))
}

sek(`D — ${PARALLELLE} PARALLELLE kald mod grænse ${LOFT}, bruger uden række i dag (INSERT-konflikt-stien)`)
{
  const o = opsummer(await parallelt(carol))
  tjek(`ingen kald fejlede (${o.fejlede.length})`, o.fejlede.length === 0, kort(o.fejlede[0]?.error))
  tjek(`PRÆCIS ${LOFT} tilladt`, o.tilladt.length === LOFT, `fik ${o.tilladt.length}`)
  tjek(`PRÆCIS ${PARALLELLE - LOFT} afvist`, o.afvist.length === PARALLELLE - LOFT, `fik ${o.afvist.length}`)
  tjek(`de tilladte fik hver et UNIKT antal 1..${LOFT} (ingen delte "det sidste")`, o.unikke.size === LOFT && Math.min(...o.unikke) === 1 && Math.max(...o.unikke) === LOFT)
  tjek('alle afviste fik brugt = 30', o.afvist.every((r) => r.brugt === LOFT))
}

sek(`D — ${PARALLELLE} parallelle kald, 29 allerede brugt (kun ÉT kald må få det sidste)`)
{
  for (let i = 0; i < 29; i++) await alice.c.rpc('reserver_gartner_spoergsmaal', { p_graense: LOFT })
  const o = opsummer(await parallelt(alice))
  tjek('præcis 1 tilladt (nr. 30) og resten afvist', o.tilladt.length === 1 && o.tilladt[0].brugt === 30 && o.afvist.length === PARALLELLE - 1 && o.fejlede.length === 0, `tilladt=${o.tilladt.length} afvist=${o.afvist.length} fejl=${o.fejlede.length}`)
}

sek('D — flere brugere samtidigt (isolering under last)')
{
  const [a, b, c] = await Promise.all([parallelt(owner, 35), parallelt(bob, 35), parallelt(carol, 35)])
  const oa = opsummer(a), ob = opsummer(b), oc = opsummer(c)
  // owner: ny i dag → 30 tilladt; bob har brugt 1 (svarformstesten) → 29 tilladt; carol har brugt 30 → 0 tilladt
  tjek('owner (ny): præcis 30 af 35 tilladt', oa.tilladt.length === 30 && oa.fejlede.length === 0, `${oa.tilladt.length}`)
  tjek('bob (1 brugt): præcis 29 af 35 tilladt', ob.tilladt.length === 29 && ob.fejlede.length === 0, `${ob.tilladt.length}`)
  tjek('carol (30 brugt): 0 af 35 tilladt', oc.tilladt.length === 0 && oc.afvist.length === 35, `${oc.tilladt.length}`)
}

sek('D — konfigurerbar grænse via parameter (ingen migration)')
{
  const r = await Promise.all(Array.from({ length: 10 }, () => carol.c.rpc('reserver_gartner_spoergsmaal', { p_graense: 100 })))
  const o = opsummer(r)
  tjek('en højere grænse (100) giver carol 10 ekstra spørgsmål straks (30 → 40)', o.tilladt.length === 10 && Math.max(...o.unikke) === 40, `${o.tilladt.length}`)
}

sek('D — adgangskontrol via PostgREST')
{
  let r = await anon.rpc('reserver_gartner_spoergsmaal', { p_graense: 30 })
  tjek('anon (uden JWT) kan ikke kalde funktionen', !!r.error, JSON.stringify(r))
  r = await alice.c.from('ai_dagsforbrug').select('*')
  tjek('alice kan ikke læse tælleren (fejl, ingen rækker)', !!r.error || (r.data ?? []).length === 0, JSON.stringify(r))
  r = await alice.c.from('ai_dagsforbrug').update({ antal: 0 }).eq('user_id', alice.id).select()
  tjek('alice kan ikke nulstille tælleren', !!r.error || (r.data ?? []).length === 0, JSON.stringify(r))
  r = await alice.c.from('ai_dagsforbrug').delete().eq('user_id', alice.id).select()
  tjek('alice kan ikke slette tælleren', !!r.error || (r.data ?? []).length === 0, JSON.stringify(r))
  r = await alice.c.from('ai_dagsforbrug').insert({ user_id: alice.id, dato: '2026-01-01', antal: 0 })
  tjek('alice kan ikke indsætte i tælleren', !!r.error, JSON.stringify(r))
  r = await anon.from('ai_dagsforbrug').select('*')
  tjek('anon kan ikke læse tælleren', !!r.error || (r.data ?? []).length === 0, JSON.stringify(r))
  const efter = opsummer(await parallelt(alice, 3))
  tjek('alices tæller er uændret af angrebene (stadig afvist ved grænsen)', efter.tilladt.length === 0 && efter.afvist.length === 3)
}

sek('B — samtykke via PostgREST')
{
  let r = await alice.c.from('profiles').select('ai_personlig_kontekst, ai_personlig_kontekst_aendret').eq('id', alice.id)
  tjek('standard: alice har samtykke = false og intet tidsstempel', !r.error && r.data?.[0]?.ai_personlig_kontekst === false && r.data?.[0]?.ai_personlig_kontekst_aendret === null, kort(r.error) + JSON.stringify(r.data))
  r = await alice.c.from('profiles').update({ ai_personlig_kontekst: true }).eq('id', alice.id).select('ai_personlig_kontekst, ai_personlig_kontekst_aendret')
  tjek('alice kan slå sit samtykke TIL; databasen sætter tidsstemplet', !r.error && r.data?.[0]?.ai_personlig_kontekst === true && !!r.data?.[0]?.ai_personlig_kontekst_aendret, kort(r.error) + JSON.stringify(r.data))
  const tid1 = r.data?.[0]?.ai_personlig_kontekst_aendret
  r = await alice.c.from('profiles').update({ display_name: 'Alice' }).eq('id', alice.id).select('ai_personlig_kontekst_aendret')
  tjek('en urelateret opdatering ændrer ikke tidsstemplet', !r.error && r.data?.[0]?.ai_personlig_kontekst_aendret === tid1, kort(r.error))
  r = await alice.c.from('profiles').update({ ai_personlig_kontekst_aendret: '2000-01-01T00:00:00Z' }).eq('id', alice.id).select()
  tjek('alice kan IKKE forfalske tidsstemplet (403 / 42501)', !!r.error && r.error.code === '42501', kort(r.error))
  r = await alice.c.from('profiles').update({ ai_personlig_kontekst: true }).eq('id', bob.id).select('id')
  tjek('alice kan IKKE ændre bobs samtykke (0 rækker)', !r.error && (r.data ?? []).length === 0, kort(r.error) + JSON.stringify(r.data))
  r = await bob.c.from('profiles').select('ai_personlig_kontekst').eq('id', bob.id)
  tjek('…og bobs samtykke er stadig false', !r.error && r.data?.[0]?.ai_personlig_kontekst === false)
  r = await alice.c.from('profiles').update({ ai_personlig_kontekst: true, is_admin: true }).eq('id', alice.id).select()
  tjek('blandet opdatering (samtykke + is_admin) afvises i sin helhed (A intakt)', !!r.error && r.error.code === '42501', kort(r.error))
  r = await alice.c.from('profiles').update({ ai_personlig_kontekst: false }).eq('id', alice.id).select('ai_personlig_kontekst')
  tjek('tilbagetrækning: samtykket er false med det samme', !r.error && r.data?.[0]?.ai_personlig_kontekst === false, kort(r.error))
  r = await anon.from('profiles').update({ ai_personlig_kontekst: true }).eq('id', alice.id).select()
  tjek('anon kan ikke ændre samtykke', !!r.error || (r.data ?? []).length === 0, JSON.stringify(r))
  r = await alice.c.from('profiles').update({ display_name: 'Alice', location_name: '8220 Brabrand', latitude: 56.153, longitude: 10.106 }).eq('id', alice.id).select('location_name')
  tjek('appens eksisterende profilskrivning (placering) virker uændret', !r.error && r.data?.[0]?.location_name === '8220 Brabrand', kort(r.error))
}

console.log(log.join('\n'))
console.log(`\n${ok} bestået, ${fejl} fejlet`)
process.exit(fejl > 0 ? 1 : 0)
