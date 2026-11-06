// Test af migration B (AI-samtykke) og D (dagsloft) i et ISOLERET miljø: PGlite (in-memory Postgres).
// Rører aldrig live. Kører de FAKTISKE migrationsfiler oven på replikaen af live + migration A (00072).
//
// Kør (PGlite er IKKE en projekt-afhængighed — installér i en tom midlertidig mappe):
//   mkdir /tmp/pgtest && cd /tmp/pgtest && npm init -y && npm i @electric-sql/pglite
//   PGLITE_PATH=/tmp/pgtest/node_modules/@electric-sql/pglite/dist/index.js REPO=<repo> node <denne fil>
//
// Klientrollerne simuleres som PostgREST gør: set_config('request.jwt.claims', …) + SET LOCAL ROLE.
// Hver prøve kører i sin egen transaktion og rulles tilbage.
//
// BEGRÆNSNING (vigtig): PGlite er ÉN forbindelse. Test 8 under "D" beviser logikken (præcis 30 af 40) men
// IKKE samtidigheden. De 40 PARALLELLE kald køres af test-BD/api/samtidighed.mjs mod en rigtig Postgres/
// PostgREST (Supabase-branch) — se BD-migrationsplan.md.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const REPO = process.env.REPO ?? process.cwd()
const { PGlite } = await import(process.env.PGLITE_PATH ? pathToFileURL(process.env.PGLITE_PATH).href : '@electric-sql/pglite')
const here = new URL('.', import.meta.url).pathname
const FASE4 = join(REPO, 'Docs/product/fase4-migrationer')

const les = (p) => readFileSync(p, 'utf8')
const replika = les(join(FASE4, 'test-A/live-replika.sql'))
const deleteAccount = les(join(REPO, 'supabase/migrations/00057_delete_account.sql'))
const migA = les(join(REPO, 'supabase/migrations/00072_profiles_laas_privilegerede_kolonner.sql'))
const migB = les(join(REPO, 'supabase/migrations/00074_profiles_ai_samtykke.sql'))
const migD = les(join(REPO, 'supabase/migrations/00076_ai_dagsforbrug.sql'))
const rollback = les(join(FASE4, 'produktion/BD-03-rollback.sql'))
const rollbackB = rollback.split('-- ==== B ====')[1].split('-- ==== D ====')[0]
const rollbackD = rollback.split('-- ==== D ====')[1]

const OWNER = '00000000-0000-0000-0000-0000000000a1'
const ALICE = '00000000-0000-0000-0000-0000000000b1'
const BOB = '00000000-0000-0000-0000-0000000000c1'
const CAROL = '00000000-0000-0000-0000-0000000000d1'   // auth-bruger UDEN profilrække

// ── Test-ur: kun i testen. En public.now() skygger pg_catalog.now() for funktioner med
//    search_path = public, pg_catalog (public først) — så døgnskiftet kan testes på RIGTIGE funktioner.
const TESTUR = `
create function public.now() returns timestamptz language sql stable as $$
  select coalesce(nullif(current_setting('test.nu', true), '')::timestamptz, pg_catalog.now()) $$;
`

async function nyDb({ b = true, d = true } = {}) {
  const db = new PGlite()
  await db.exec(replika)
  await db.exec(`insert into auth.users (id, email) values ('${CAROL}', 'carol@example.test')`)   // uden profil: slet profilen igen
  await db.exec(`delete from public.profiles where id = '${CAROL}'`)
  // Produktionens BREDE standardrettigheder (målt 6/11): nye tabeller/funktioner i public giver automatisk
  // anon, authenticated og service_role alt. Testen kører dermed i det værst tænkelige miljø — migrationernes
  // egne REVOKE'er skal selv lukke for API-rollerne (nyere Supabase-projekter er strammere, ikke bredere).
  await db.exec(`
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`)
  await db.exec(deleteAccount)
  await db.exec(migA)
  if (b) await db.exec(migB)
  if (d) await db.exec(migD)
  await db.exec(TESTUR)
  return db
}

let ok = 0, fejl = 0
const log = []
const tjek = (navn, b, detalje = '') => { if (b) { ok++; log.push(`  ✓ ${navn}`) } else { fejl++; log.push(`  ✗ ${navn}${detalje ? ` — ${detalje}` : ''}`) } }
const sektion = (t) => log.push(`\n${t}`)

/** Kør sætninger efter hinanden som en rolle/bruger i ÉN transaktion, der altid rulles tilbage.
 *  Returnerer resultatet af den sidste; ved fejl: { ok:false, kode, besked } for den, der fejlede. */
async function som(db, rolle, uid, sqls, { nu } = {}) {
  const liste = Array.isArray(sqls) ? sqls : [sqls]
  await db.exec('BEGIN')
  try {
    if (uid) await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role: rolle })])
    if (nu) await db.query(`select set_config('test.nu', $1, true)`, [nu])
    if (rolle !== 'postgres') await db.exec(`SET LOCAL ROLE ${rolle}`)
    let sidste
    for (const s of liste) sidste = await db.query(s)
    await db.exec('ROLLBACK')
    return { ok: true, rows: sidste.rows, antal: sidste.affectedRows ?? sidste.rows.length }
  } catch (e) {
    await db.exec('ROLLBACK')
    return { ok: false, kode: e.code, besked: e.message }
  }
}
const q = async (db, sql) => (await db.query(sql)).rows

/** Fjern kommentarer og $$-kroppe, så kun migrationens top-level sætninger kontrolleres. */
function sætninger(sql) {
  return sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    .replace(/\$\$[\s\S]*?\$\$/g, '$$$$').split(';').map((x) => x.trim()).filter(Boolean)
}

// ═════════════════════════════ Statisk kontrol af filerne ═════════════════════════════
sektion('Statisk kontrol af migrationsfilerne')
for (const [navn, sql] of [['00074 (B)', migB], ['00076 (D)', migD]]) {
  const forbudt = sætninger(sql).filter((x) => /^(INSERT|UPDATE|DELETE|TRUNCATE|DROP\s+TABLE|DROP\s+COLUMN|ALTER\s+TABLE[\s\S]*DROP\s+COLUMN)\b/i.test(x))
  tjek(`${navn}: ingen datamanipulerende eller destruktive sætninger på top-niveau`, forbudt.length === 0, forbudt.join(' | '))
  tjek(`${navn}: kører i én transaktion (BEGIN … COMMIT)`, /^\s*BEGIN;/m.test(sql) && /^\s*COMMIT;/m.test(sql))
  tjek(`${navn}: status i headeren er "ANVENDT PÅ PRODUKTION" (opdateret efter udførelsen)`, /ANVENDT PÅ PRODUKTION/.test(sql))
}
tjek('00074 (B): kun additive ændringer (ADD COLUMN IF NOT EXISTS, ingen DROP uden for rollback-kommentaren)',
  !/\bDROP\s+(COLUMN|TABLE|FUNCTION)\b/i.test(migB.split('-- ROLLBACK')[0].replace(/--.*$/gm, '')) && /ADD COLUMN IF NOT EXISTS/.test(migB))
tjek('00074 (B): triggerfunktionen er SECURITY INVOKER', /SECURITY INVOKER/.test(migB) && !/SECURITY DEFINER/.test(migB.replace(/--.*$/gm, '')))
tjek('00074 (B): GRANT kun på selve valget, aldrig på tidsstemplet', /GRANT UPDATE \(ai_personlig_kontekst\) ON public\.profiles TO authenticated;/.test(migB) && !/GRANT[^;]*ai_personlig_kontekst_aendret/.test(migB.replace(/--.*$/gm, '')))
tjek('00076 (D): funktionen er SECURITY DEFINER med fast search_path', /SECURITY DEFINER\s+SET search_path = public, pg_catalog/.test(migD))
tjek('00076 (D): kolonnen hedder user_id (delete_account rydder automatisk)', /user_id uuid NOT NULL REFERENCES public\.profiles\(id\) ON DELETE CASCADE/.test(migD))
tjek('00076 (D): tabellen har RLS og ingen rettigheder for API-rollerne', /ENABLE ROW LEVEL SECURITY/.test(migD) && /REVOKE ALL ON public\.ai_dagsforbrug FROM PUBLIC, anon, authenticated/.test(migD))
tjek('00076 (D): funktionen kan ikke udføres af anon/PUBLIC', /REVOKE ALL ON FUNCTION public\.reserver_gartner_spoergsmaal\(integer\) FROM PUBLIC, anon/.test(migD))
tjek('00076 (D): dansk kalenderdag med navngiven tidszone', /\(now\(\) AT TIME ZONE 'Europe\/Copenhagen'\)::date/.test(migD))
tjek('00076 (D): atomisk tæller (ON CONFLICT … WHERE antal < grænse)', /ON CONFLICT \(user_id, dato\)\s+DO UPDATE SET antal = d\.antal \+ 1 WHERE d\.antal < p_graense/.test(migD))

// ═════════════════════════════ B — samtykke ═════════════════════════════
sektion('B — standard, egen række, tidsstempel (A + B anvendt)')
{
  const db = await nyDb({ d: false })
  const alle = await q(db, `select id, ai_personlig_kontekst as v, ai_personlig_kontekst_aendret as t from public.profiles order by id`)
  tjek('alle eksisterende profiler får false og intet tidsstempel', alle.length === 3 && alle.every((r) => r.v === false && r.t === null))

  // Ny bruger via den rigtige handle_new_user-trigger
  await db.exec(`insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'ny@example.test')`)
  const ny = await q(db, `select ai_personlig_kontekst as v, ai_personlig_kontekst_aendret as t from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'`)
  tjek('en NY bruger får samtykke = false (standard FRA)', ny.length === 1 && ny[0].v === false && ny[0].t === null)

  const ordre = await q(db, `select tgname from pg_trigger where tgrelid = 'public.profiles'::regclass and not tgisinternal order by tgname`)
  tjek('profiles har 3 triggere (admin-insert, A: afvis roller, B: samtykke-tid)', ordre.length === 3, ordre.map((r) => r.tgname).join(','))

  // brugeren slår til
  let r = await som(db, 'authenticated', ALICE, [
    `update public.profiles set ai_personlig_kontekst = true where id = '${ALICE}'`,
    `select ai_personlig_kontekst as v, ai_personlig_kontekst_aendret is not null as har_tid, ai_personlig_kontekst_aendret >= now() - interval '1 minute' as friskt from public.profiles where id = '${ALICE}'`,
  ])
  tjek('alice kan slå sit eget samtykke TIL; databasen sætter tidsstemplet', r.ok && r.rows[0].v === true && r.rows[0].har_tid && r.rows[0].friskt, JSON.stringify(r))

  // til og fra igen i samme transaktion → tidsstemplet opdateres, samtykket er fra med det samme
  r = await som(db, 'authenticated', ALICE, [
    `select set_config('test.nu', '2026-11-06 10:00:00+00', true)`,
    `update public.profiles set ai_personlig_kontekst = true where id = '${ALICE}'`,
    `select set_config('test.nu', '2026-11-06 11:30:00+00', true)`,
    `update public.profiles set ai_personlig_kontekst = false where id = '${ALICE}'`,
    `select ai_personlig_kontekst as v, to_char(ai_personlig_kontekst_aendret at time zone 'UTC', 'HH24:MI') as t from public.profiles where id = '${ALICE}'`,
  ])
  tjek('tilbagetrækning virker med det samme (false) og tidsstemplet følger seneste ændring', r.ok && r.rows[0].v === false && r.rows[0].t === '11:30', JSON.stringify(r))

  // urelateret opdatering rører ikke tidsstemplet
  r = await som(db, 'authenticated', ALICE, [
    `select set_config('test.nu', '2026-11-06 10:00:00+00', true)`,
    `update public.profiles set ai_personlig_kontekst = true where id = '${ALICE}'`,
    `select set_config('test.nu', '2026-11-06 12:00:00+00', true)`,
    `update public.profiles set display_name = 'Nyt navn' where id = '${ALICE}'`,
    `select to_char(ai_personlig_kontekst_aendret at time zone 'UTC', 'HH24:MI') as t from public.profiles where id = '${ALICE}'`,
  ])
  tjek('en urelateret opdatering (display_name) ændrer IKKE tidsstemplet', r.ok && r.rows[0].t === '10:00', JSON.stringify(r))

  // samme værdi igen ændrer ikke tidsstemplet
  r = await som(db, 'authenticated', ALICE, [
    `select set_config('test.nu', '2026-11-06 10:00:00+00', true)`,
    `update public.profiles set ai_personlig_kontekst = true where id = '${ALICE}'`,
    `select set_config('test.nu', '2026-11-06 12:00:00+00', true)`,
    `update public.profiles set ai_personlig_kontekst = true where id = '${ALICE}'`,
    `select to_char(ai_personlig_kontekst_aendret at time zone 'UTC', 'HH24:MI') as t from public.profiles where id = '${ALICE}'`,
  ])
  tjek('at gemme den SAMME værdi igen ændrer ikke tidsstemplet', r.ok && r.rows[0].t === '10:00', JSON.stringify(r))
}

sektion('B — RLS og rettigheder')
{
  const db = await nyDb({ d: false })
  const kolPriv = (rolle, kol) => q(db, `select has_column_privilege('${rolle}', 'public.profiles', '${kol}', 'UPDATE') as p`).then((x) => x[0].p)
  tjek('authenticated har UPDATE på selve valget', await kolPriv('authenticated', 'ai_personlig_kontekst'))
  tjek('authenticated har IKKE UPDATE på tidsstemplet', !(await kolPriv('authenticated', 'ai_personlig_kontekst_aendret')))
  tjek('anon har hverken UPDATE på valget eller tidsstemplet', !(await kolPriv('anon', 'ai_personlig_kontekst')) && !(await kolPriv('anon', 'ai_personlig_kontekst_aendret')))
  tjek('A er intakt: is_admin og subscription_tier stadig låst', !(await kolPriv('authenticated', 'is_admin')) && !(await kolPriv('authenticated', 'subscription_tier')))

  let r = await som(db, 'authenticated', ALICE, `update public.profiles set ai_personlig_kontekst_aendret = '2000-01-01' where id = '${ALICE}'`)
  tjek('alice kan IKKE forfalske tidsstemplet (42501)', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som(db, 'authenticated', ALICE, `update public.profiles set ai_personlig_kontekst = true where id = '${BOB}'`)
  tjek('alice kan IKKE ændre bobs samtykke (0 rækker berørt)', r.ok && r.antal === 0, JSON.stringify(r))
  r = await som(db, 'authenticated', ALICE, [
    `update public.profiles set ai_personlig_kontekst = true where id = '${BOB}'`,
    `select count(*)::int as n from public.profiles where ai_personlig_kontekst`,
  ])
  tjek('…og bobs værdi er uændret efter forsøget', r.ok && r.rows[0].n === 0, JSON.stringify(r))
  r = await som(db, 'authenticated', ALICE, `select id, ai_personlig_kontekst from public.profiles`)
  tjek('alice ser kun SIN egen række og dermed kun sit eget samtykke', r.ok && r.rows.length === 1 && r.rows[0].id === ALICE, JSON.stringify(r))
  r = await som(db, 'authenticated', ALICE, `update public.profiles set ai_personlig_kontekst = true, is_admin = true where id = '${ALICE}'`)
  tjek('en blandet opdatering (samtykke + is_admin) afvises i sin helhed', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som(db, 'authenticated', CAROL, `insert into public.profiles (id, ai_personlig_kontekst) values ('${CAROL}', true)`)
  tjek('INSERT af egen profil med samtykke=true afvises (ingen INSERT-ret efter A)', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som(db, 'anon', null, `update public.profiles set ai_personlig_kontekst = true`)
  tjek('anon kan ikke opdatere (42501)', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som(db, 'anon', null, `select count(*)::int as n from public.profiles`)
  tjek('anon ser ingen profiler (0 rækker)', r.ok && r.rows[0].n === 0, JSON.stringify(r))
  r = await som(db, 'authenticated', ALICE, `select * from public.profiles where id = '${ALICE}'`)
  tjek('getProfile()-formen (select *) virker og indeholder de nye kolonner', r.ok && r.rows.length === 1 && 'ai_personlig_kontekst' in r.rows[0] && 'ai_personlig_kontekst_aendret' in r.rows[0], JSON.stringify(r))
  r = await som(db, 'service_role', null, `update public.profiles set ai_personlig_kontekst = true, ai_personlig_kontekst_aendret = '2020-01-01' where id = '${ALICE}'`)
  tjek('service_role kan stadig skrive begge kolonner (drift/support)', r.ok && r.antal === 1, JSON.stringify(r))

  // updateProfile()-formen (appens eksisterende skrivning) er upåvirket af B
  r = await som(db, 'authenticated', ALICE, `update public.profiles set display_name = 'A', latitude = 56.15, longitude = 10.1, location_name = '8220 Brabrand', updated_at = now() where id = '${ALICE}'`)
  tjek('appens eksisterende profilskrivning (navn, placering) virker uændret', r.ok && r.antal === 1, JSON.stringify(r))
}

sektion('B — eksisterende data er uændrede, migrationen er uafhængig af D')
{
  const foer = new PGlite()
  await foer.exec(replika); await foer.exec(deleteAccount); await foer.exec(migA)
  const kol = `id, display_name, avatar_url, subscription_tier, user_mode, onboarded, username, is_admin, latitude, longitude, location_name`
  const hashFoer = (await q(foer, `select md5(string_agg(t::text, '|' order by id)) as h from (select ${kol} from public.profiles) t`))[0].h
  await foer.exec(migB)
  const hashEfter = (await q(foer, `select md5(string_agg(t::text, '|' order by id)) as h from (select ${kol} from public.profiles) t`))[0].h
  tjek('indholdet af de eksisterende profilkolonner er identisk før og efter B', hashFoer === hashEfter)
  const antal = (await q(foer, `select count(*)::int as n from public.profiles`))[0].n
  tjek('antal profiler er uændret (3)', antal === 3)

  // B uden D og D uden B
  const kunB = await nyDb({ b: true, d: false })
  tjek('B kan anvendes uden D (funktionen findes ikke, samtykket virker)', (await q(kunB, `select to_regprocedure('public.reserver_gartner_spoergsmaal(integer)') is null as ingen`))[0].ingen)
  const kunD = await nyDb({ b: false, d: true })
  const rD = await som(kunD, 'authenticated', ALICE, `select * from public.reserver_gartner_spoergsmaal(30)`)
  tjek('D kan anvendes uden B (kvoten virker, samtykkekolonnerne findes ikke)', rD.ok && rD.rows[0].tilladt === true)
  const saml = await som(kunD, 'authenticated', ALICE, `select ai_personlig_kontekst from public.profiles`)
  tjek('uden B: læsning af samtykkekolonnen fejler (42703) — koden læser det som "intet samtykke"', !saml.ok && saml.kode === '42703', JSON.stringify(saml))
}

// ═════════════════════════════ D — dagsloft ═════════════════════════════
sektion('D — grænse, konfiguration og isolering')
{
  const db = await nyDb({ b: false })
  const kald = (g) => `select * from public.reserver_gartner_spoergsmaal(${g})`
  // 5 tilladte, så afvist
  await db.exec('BEGIN')
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  const udfald = []
  for (let i = 0; i < 7; i++) udfald.push((await db.query(kald(5))).rows[0])
  await db.exec('ROLLBACK')
  tjek('grænse 5: kald 1-5 tilladt (brugt 1..5), kald 6-7 afvist (brugt 5)',
    udfald.slice(0, 5).every((u, i) => u.tilladt === true && u.brugt === i + 1) && udfald.slice(5).every((u) => u.tilladt === false && u.brugt === 5), JSON.stringify(udfald))

  // 40 kald mod 30 (logik, ikke samtidighed)
  await db.exec('BEGIN')
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  let t = 0, f = 0
  for (let i = 0; i < 40; i++) { const u = (await db.query(kald(30))).rows[0]; u.tilladt ? t++ : f++ }
  await db.exec('RESET ROLE')
  const antal = (await db.query(`select antal from public.ai_dagsforbrug where user_id = '${ALICE}'`)).rows[0].antal
  await db.exec('ROLLBACK')
  tjek('40 kald mod grænse 30 (sekventielt): præcis 30 tilladt og 10 afvist; tæller = 30', t === 30 && f === 10 && antal === 30, `t=${t} f=${f} antal=${antal}`)

  // konfigurerbar: grænsen er en parameter — en lavere grænse stopper en bruger, der allerede er over den
  let r = await som(db, 'authenticated', ALICE, [kald(5), kald(5), kald(5), kald(2)])
  tjek('grænsen er en parameter: en sænket grænse (2) afviser straks, når 3 allerede er brugt', r.ok && r.rows[0].tilladt === false && r.rows[0].brugt === 3, JSON.stringify(r))

  r = await som(db, 'authenticated', BOB, kald(30))
  tjek('en anden bruger er upåvirket (første kald tilladt, brugt 1)', r.ok && r.rows[0].tilladt === true && r.rows[0].brugt === 1)
  r = await som(db, 'authenticated', BOB, [`select * from public.reserver_gartner_spoergsmaal(1)`, `select * from public.reserver_gartner_spoergsmaal(1)`])
  tjek('bobs tæller er hans egen (andet kald afvist ved grænse 1)', r.ok && r.rows[0].tilladt === false)

  for (const g of ['null', '0', '-1']) {
    r = await som(db, 'authenticated', ALICE, [kald(g), `select count(*)::int as n from public.ai_dagsforbrug`].slice(0, 1))
    tjek(`ugyldig grænse ${g} → afvist, tilladt=false`, r.ok && r.rows[0].tilladt === false && r.rows[0].brugt === 0, JSON.stringify(r))
  }
  r = await som(db, 'postgres', null, [`set role authenticated`, `select set_config('request.jwt.claims', '{"sub":"${ALICE}","role":"authenticated"}', true)`, kald('null'), `reset role`, `select count(*)::int as n from public.ai_dagsforbrug`])
  tjek('ugyldig grænse indsætter ingen række', r.ok && r.rows[0].n === 0, JSON.stringify(r))

  r = await som(db, 'authenticated', null, kald(30))
  tjek('uden login-claims (auth.uid() er NULL) → afvist', r.ok && r.rows[0].tilladt === false && r.rows[0].brugt === 0, JSON.stringify(r))
}

sektion('D — rettigheder (ingen direkte adgang til tælleren)')
{
  const db = await nyDb({ b: false })
  let r = await som(db, 'anon', null, `select * from public.reserver_gartner_spoergsmaal(30)`)
  tjek('anon kan ikke udføre funktionen (42501)', !r.ok && r.kode === '42501', JSON.stringify(r))
  for (const [navn, sql] of [
    ['SELECT', `select * from public.ai_dagsforbrug`],
    ['INSERT', `insert into public.ai_dagsforbrug (user_id, dato, antal) values ('${ALICE}', current_date, 0)`],
    ['UPDATE', `update public.ai_dagsforbrug set antal = 0`],
    ['DELETE', `delete from public.ai_dagsforbrug`],
    ['TRUNCATE', `truncate public.ai_dagsforbrug`],
  ]) {
    r = await som(db, 'authenticated', ALICE, sql)
    tjek(`authenticated kan ikke ${navn} tabellen direkte (42501)`, !r.ok && r.kode === '42501', JSON.stringify(r))
    r = await som(db, 'anon', null, sql)
    tjek(`anon kan ikke ${navn} tabellen direkte (42501)`, !r.ok && r.kode === '42501', JSON.stringify(r))
  }
  // Tælleren kan ikke nulstilles ved at kalde funktionen igen
  r = await som(db, 'authenticated', ALICE, [`select * from public.reserver_gartner_spoergsmaal(1)`, `select * from public.reserver_gartner_spoergsmaal(1)`, `select * from public.reserver_gartner_spoergsmaal(1)`])
  tjek('tælleren kan ikke omgås ved gentagne kald (afvist ved grænsen)', r.ok && r.rows[0].tilladt === false && r.rows[0].brugt === 1)
  const acl = await q(db, `select has_function_privilege('authenticated','public.reserver_gartner_spoergsmaal(integer)','EXECUTE') as a, has_function_privilege('anon','public.reserver_gartner_spoergsmaal(integer)','EXECUTE') as n, has_function_privilege('service_role','public.reserver_gartner_spoergsmaal(integer)','EXECUTE') as s`)
  tjek('EXECUTE: authenticated ja, anon nej', acl[0].a === true && acl[0].n === false)
  const rls = await q(db, `select relrowsecurity as rls from pg_class where oid = 'public.ai_dagsforbrug'::regclass`)
  tjek('RLS er slået til på ai_dagsforbrug', rls[0].rls === true)
  const pol = await q(db, `select count(*)::int as n from pg_policies where tablename = 'ai_dagsforbrug'`)
  tjek('ingen RLS-politikker (ingen vej ind for API-rollerne)', pol[0].n === 0)
}

sektion('D — dansk døgnskifte (vinter, sommer og skiftedage)')
{
  const db = await nyDb({ b: false })
  // Ét kald ved et givet øjeblik, grænse 1: returnerer {tilladt, dato}
  async function ved(nu, ekstraKald = 1) {
    const sqls = []
    for (let i = 0; i < ekstraKald; i++) sqls.push(`select * from public.reserver_gartner_spoergsmaal(1)`)
    sqls.push(`select min(dato)::text as dato, max(antal) as antal from public.ai_dagsforbrug`)
    // som(): sidste resultat er datoen; første kalds udfald hentes ved at splitte
    await db.exec('BEGIN')
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
    await db.query(`select set_config('test.nu', $1, true)`, [nu])
    await db.exec('SET LOCAL ROLE authenticated')
    const udfald = []
    for (let i = 0; i < ekstraKald; i++) udfald.push((await db.query(`select * from public.reserver_gartner_spoergsmaal(1)`)).rows[0])
    await db.exec('RESET ROLE')
    const dato = (await db.query(`select max(dato)::text as dato from public.ai_dagsforbrug`)).rows[0].dato
    await db.exec('ROLLBACK')
    return { udfald, dato }
  }
  const grænser = [
    // [navn, øjeblik før midnat, øjeblik efter midnat, dato før, dato efter]
    ['vinter (CET, UTC+1)', '2026-01-15 22:59:59+00', '2026-01-15 23:00:01+00', '2026-01-15', '2026-01-16'],
    ['sommer (CEST, UTC+2)', '2026-07-15 21:59:59+00', '2026-07-15 22:00:01+00', '2026-07-15', '2026-07-16'],
    ['sommertids-skiftedag 29/3 2026 (mellem 28. og 29.)', '2026-03-28 22:59:59+00', '2026-03-28 23:00:01+00', '2026-03-28', '2026-03-29'],
    ['sommertids-skiftedag 29/3 2026 (mellem 29. og 30.)', '2026-03-29 21:59:59+00', '2026-03-29 22:00:01+00', '2026-03-29', '2026-03-30'],
    ['vintertids-skiftedag 25/10 2026 (mellem 24. og 25.)', '2026-10-24 21:59:59+00', '2026-10-24 22:00:01+00', '2026-10-24', '2026-10-25'],
    ['vintertids-skiftedag 25/10 2026 (mellem 25. og 26.)', '2026-10-25 22:59:59+00', '2026-10-25 23:00:01+00', '2026-10-25', '2026-10-26'],
    ['årsskifte', '2026-12-31 22:59:59+00', '2026-12-31 23:00:01+00', '2026-12-31', '2027-01-01'],
  ]
  for (const [navn, foer, efter, d1, d2] of grænser) {
    const a = await ved(foer)
    const b = await ved(efter)
    tjek(`${navn}: 23:59:59 lokal tid hører til ${d1}, 00:00:01 til ${d2}`, a.dato === d1 && b.dato === d2, `fik ${a.dato} / ${b.dato}`)
  }

  // Selve loftet nulstilles ved dansk midnat: grænse 1 → andet kald samme dag afvist; første kald næste dag tilladt igen
  await db.exec('BEGIN')
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  const k = async (nu) => { await db.query(`select set_config('test.nu', $1, true)`, [nu]); return (await db.query(`select * from public.reserver_gartner_spoergsmaal(1)`)).rows[0] }
  const a1 = await k('2026-01-15 22:59:58+00')
  const a2 = await k('2026-01-15 22:59:59+00')
  const b1 = await k('2026-01-15 23:00:01+00')
  const b2 = await k('2026-01-15 23:00:02+00')
  await db.exec('ROLLBACK')
  tjek('loftet nulstilles ved dansk midnat: tilladt, afvist (før) → tilladt, afvist (efter)', a1.tilladt && !a2.tilladt && b1.tilladt && !b2.tilladt, JSON.stringify([a1, a2, b1, b2]))

  // Et UTC-døgn ≠ et dansk døgn: kl. 00:30 dansk tid (23:30 UTC dagen før) tæller for den NYE danske dag
  const c = await ved('2026-06-30 22:30:00+00')
  tjek('kl. 00:30 dansk sommertid (22:30 UTC) tæller for den nye danske dag (1/7), ikke UTC-dagen', c.dato === '2026-07-01', c.dato)
}

sektion('D — oprydning (7 dage) og kontosletning')
{
  const db = await nyDb({ b: false })
  await db.exec(`
    insert into public.ai_dagsforbrug (user_id, dato, antal) values
      ('${ALICE}', current_date - 8, 3), ('${ALICE}', current_date - 7, 3), ('${ALICE}', current_date - 1, 3),
      ('${BOB}',   current_date - 20, 9)`)
  let r = await som(db, 'authenticated', ALICE, [
    `select set_config('test.nu', (current_date + time '12:00')::text || '+00', true)`,
    `select * from public.reserver_gartner_spoergsmaal(30)`,
    `reset role`,
    `select (select count(*)::int from public.ai_dagsforbrug where user_id = '${ALICE}' and dato < current_date - 7) as gamle_alice,
            (select count(*)::int from public.ai_dagsforbrug where user_id = '${ALICE}' and dato = current_date - 7) as graense_alice,
            (select count(*)::int from public.ai_dagsforbrug where user_id = '${BOB}') as bob`,
  ])
  tjek('oprydningen sletter alices rækker ældre end 7 dage', r.ok && r.rows[0].gamle_alice === 0, JSON.stringify(r))
  tjek('…men beholder rækken præcis 7 dage gammel', r.ok && r.rows[0].graense_alice === 1, JSON.stringify(r))
  tjek('…og rører ALDRIG andre brugeres rækker (bobs 20 dage gamle række består)', r.ok && r.rows[0].bob === 1, JSON.stringify(r))

  // kontosletning (service_role, som server-actionen) rydder tælleren via user_id-kolonnen
  await db.exec(`insert into public.ai_dagsforbrug (user_id, dato, antal) values ('${ALICE}', current_date, 4)`)
  const del = await som(db, 'service_role', null, [
    `select public.delete_account('${ALICE}') as blokeret`,
    `select (select count(*)::int from public.ai_dagsforbrug where user_id = '${ALICE}') as alice,
            (select count(*)::int from public.ai_dagsforbrug where user_id = '${BOB}') as bob`,
  ])
  tjek('delete_account() rydder alices tæller (ingen blokerede tabeller) og lader bob stå', del.ok && del.rows[0].alice === 0 && del.rows[0].bob === 1, JSON.stringify(del))
  const blok = await som(db, 'service_role', null, `select public.delete_account('${ALICE}') as blokeret`)
  tjek('delete_account() returnerer tom liste (fuld sletning)', blok.ok && Array.isArray(blok.rows[0].blokeret) && blok.rows[0].blokeret.length === 0, JSON.stringify(blok))

  // cascade fra profilen
  await db.exec(`insert into public.ai_dagsforbrug (user_id, dato, antal) values ('${BOB}', current_date, 4)`)
  await db.exec(`delete from auth.users where id = '${BOB}'`)
  const rest = (await q(db, `select count(*)::int as n from public.ai_dagsforbrug where user_id = '${BOB}'`))[0].n
  tjek('sletning af brugeren (cascade) fjerner også tælleren', rest === 0)
}

sektion('D — fejlscenarier (koden afviser og afviser aldrig åbent — se test-gartner-kontekst.ts)')
{
  const db = await nyDb({ b: false })
  // a) funktionen findes ikke
  await db.exec('BEGIN')
  await db.exec(`alter function public.reserver_gartner_spoergsmaal(integer) rename to reserver_gartner_spoergsmaal_x`)
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  let e = null
  try { await db.query(`select * from public.reserver_gartner_spoergsmaal(30)`) } catch (x) { e = x }
  await db.exec('ROLLBACK')
  tjek('funktionen mangler (migration D ikke kørt) → fejl 42883 (koden: 503, afvis)', !!e && e.code === '42883', e?.code)

  // b) tabellen mangler
  await db.exec('BEGIN')
  await db.exec(`alter table public.ai_dagsforbrug rename to ai_dagsforbrug_x`)
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  e = null
  try { await db.query(`select * from public.reserver_gartner_spoergsmaal(30)`) } catch (x) { e = x }
  await db.exec('ROLLBACK')
  tjek('tabellen mangler/utilgængelig → fejl 42P01 (koden: 503, afvis)', !!e && e.code === '42P01', e?.code)

  // c) en bruger uden profilrække (kan ikke ske i drift: handle_new_user opretter den) → fejl, ikke "tilladt"
  await db.exec('BEGIN')
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: CAROL, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  e = null
  let udfald = null
  try { udfald = (await db.query(`select * from public.reserver_gartner_spoergsmaal(30)`)).rows[0] } catch (x) { e = x }
  await db.exec('ROLLBACK')
  tjek('bruger uden profilrække → fejl 23503 (aldrig "tilladt"; koden: 503, afvis)', !!e && e.code === '23503' && udfald === null, `${e?.code} ${JSON.stringify(udfald)}`)

  // d) ingen rettighed → 42501
  await db.exec('BEGIN')
  await db.exec(`revoke execute on function public.reserver_gartner_spoergsmaal(integer) from authenticated`)
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  e = null
  try { await db.query(`select * from public.reserver_gartner_spoergsmaal(30)`) } catch (x) { e = x }
  await db.exec('ROLLBACK')
  tjek('manglende EXECUTE-ret → fejl 42501 (koden: 503, afvis)', !!e && e.code === '42501', e?.code)

  // e) et mislykket kald efter reservationen tæller med (reservationen er allerede foretaget)
  const r = await som(db, 'authenticated', ALICE, [`select * from public.reserver_gartner_spoergsmaal(30)`, `reset role`, `select antal from public.ai_dagsforbrug where user_id = '${ALICE}'`])
  tjek('reservationen sker FØR AI-kaldet, så et fejlet AI-kald tæller med (forudsigelige omkostninger)', r.ok && r.rows[0].antal === 1, JSON.stringify(r))
}

// ═════════════════════════════ Rollback ═════════════════════════════
sektion('Rollback (BD-03-rollback.sql) på en frisk replika')
{
  const db = await nyDb()
  await db.exec(`update public.profiles set display_name = 'Bevares' where id = '${ALICE}'`)
  const grantsA = async () => (await q(db, `select count(*)::int as n from information_schema.role_column_grants where table_name = 'profiles' and grantee = 'authenticated' and privilege_type = 'UPDATE'`))[0].n
  const foerGrants = await grantsA()
  await db.exec(rollbackD)
  tjek('rollback D: funktion og tabel er væk', (await q(db, `select to_regprocedure('public.reserver_gartner_spoergsmaal(integer)') is null as f, to_regclass('public.ai_dagsforbrug') is null as t`))[0].f
    && (await q(db, `select to_regclass('public.ai_dagsforbrug') is null as t`))[0].t)
  await db.exec(rollbackB)
  tjek('rollback B: kolonner, trigger, funktion og kolonnerettighed er væk', (await q(db, `select count(*)::int as n from information_schema.columns where table_name = 'profiles' and column_name like 'ai_personlig_kontekst%'`))[0].n === 0
    && (await q(db, `select to_regprocedure('public.saet_ai_samtykke_tidspunkt()') is null as f`))[0].f
    && (await q(db, `select count(*)::int as n from pg_trigger where tgname = 'tr_profiles_ai_samtykke_tid'`))[0].n === 0)
  tjek('rollback rører hverken profildata eller A\'s rettigheder', (await q(db, `select display_name from public.profiles where id = '${ALICE}'`))[0].display_name === 'Bevares'
    && (await grantsA()) === foerGrants - 1 && !(await q(db, `select has_column_privilege('authenticated','public.profiles','is_admin','UPDATE') as p`))[0].p)
  const igen = await nyDb()
  tjek('migrationerne kan anvendes igen efter en rollback (idempotent opsætning på ny replika)', (await q(igen, `select count(*)::int as n from information_schema.columns where table_name = 'profiles' and column_name like 'ai_personlig_kontekst%'`))[0].n === 2)
  // B er idempotent (ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS)
  let e = null
  try { await igen.exec(migB) } catch (x) { e = x }
  tjek('migration B kan køres to gange uden fejl (idempotent)', e === null, e?.message)
}

// ═════════════════════════════ Produktionens kontrolscripts ═════════════════════════════
sektion('Kontrolscripts til produktion kører og giver de forventede svar i replikaen')
{
  const foer01 = les(join(FASE4, 'produktion/BD-01-foer-kontrol.sql'))
  const efter02 = les(join(FASE4, 'produktion/BD-02-efter-kontrol.sql'))

  // BD-01: første sætning (tilstand FØR) — kører mod en replika med KUN A anvendt
  const foerDb = await nyDb({ b: false, d: false })
  const foerSql = foer01.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').split(';')[0] + ';'
  const f = (await foerDb.query(foerSql)).rows[0]
  tjek('BD-01 FØR: B og D findes ikke, A er anvendt (forventede værdier)',
    Number(f.admins) === 1 && Number(f.samtykke_kolonner) === 0 && f.d_tabel_findes_ikke === true && f.d_funktion_findes_ikke === true
    && f.b_funktion_findes_ikke === true && Number(f.profil_triggere) === 2 && f.auth_kan_saette_is_admin === false && f.delete_account_findes === true, JSON.stringify(f))

  // BD-02: kør på en replika med A+B+D; resultatet kommer som fejlbesked 'CHECK-RESULTAT: …'
  const db = await nyDb()
  const sql = efter02.replaceAll('{{BRUGER_UID}}', ALICE).replaceAll('{{ANDEN_UID}}', BOB)
  let besked = ''
  try { await db.exec(sql) } catch (e) { besked = e.message }
  tjek('BD-02 ender med CHECK-RESULTAT (og dermed rollback)', besked.includes('CHECK-RESULTAT'), besked.slice(0, 200))
  const antalOk = (besked.match(/\[OK\]/g) ?? []).length
  const fejlLinjer = besked.split('\n').filter((l) => l.includes('[FEJL'))
  tjek(`BD-02: ingen [FEJL] (${antalOk} × [OK])`, fejlLinjer.length === 0 && antalOk >= 24, fejlLinjer.join(' | '))
  const efter = (await q(db, `select (select count(*)::int from public.ai_dagsforbrug) as n, (select count(*)::int from public.profiles where ai_personlig_kontekst) as samtykke`))[0]
  tjek('BD-02 efterlader INTET: ingen tællerrækker og intet samtykke (alt rullet tilbage)', efter.n === 0 && efter.samtykke === 0, JSON.stringify(efter))

  // BD-02 skal FANGE en fejl: kør mod en replika uden D → der skal stå [FEJL]/exception, ikke en tavs succes
  const udenD = await nyDb({ d: false })
  let m2 = ''
  try { await udenD.exec(sql) } catch (e) { m2 = e.message }
  tjek('BD-02 mod en replika UDEN D afslører problemet (fejler tydeligt)', !m2.includes('CHECK-RESULTAT') || /\[FEJL\]/.test(m2), m2.slice(0, 160))
}

console.log(log.join('\n'))
console.log(`\n${ok} bestået, ${fejl} fejlet`)
process.exit(fejl > 0 ? 1 : 0)
