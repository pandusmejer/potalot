// Test af migration A (og A2) i et ISOLERET miljø: PGlite (in-memory Postgres). Rører aldrig live.
//
// Kør (i en TOM midlertidig mappe, hvor pakken er installeret):
//   npm i @electric-sql/pglite
//   PGLITE_PATH=<sti til node_modules/@electric-sql/pglite/dist/index.js> \
//   REPO=<sti til repoet> node <denne fil>
//
// Klientrollerne simuleres som PostgREST gør: set_config('request.jwt.claims', …) + SET LOCAL ROLE.
// Hver skrivende prøve kører i sin egen transaktion og rulles tilbage.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const REPO = process.env.REPO ?? process.cwd()
const { PGlite } = await import(process.env.PGLITE_PATH ? pathToFileURL(process.env.PGLITE_PATH).href : '@electric-sql/pglite')

const here = new URL('.', import.meta.url).pathname
const replika = readFileSync(join(here, 'live-replika.sql'), 'utf8')
const migrationA = readFileSync(join(REPO, 'supabase/migrations/00072_profiles_laas_privilegerede_kolonner.sql'), 'utf8')
const migrationA2 = readFileSync(join(REPO, 'Docs/product/fase4-migrationer/A2-community-memberships.sql'), 'utf8')

const OWNER = '00000000-0000-0000-0000-0000000000a1'
const ALICE = '00000000-0000-0000-0000-0000000000b1'
const BOB = '00000000-0000-0000-0000-0000000000c1'
const CAROL = '00000000-0000-0000-0000-0000000000d1'   // uden profilrække (til INSERT-vejen)

const db = new PGlite()
await db.exec(replika)

let ok = 0, fejl = 0
const log = []
function tjek(navn, betingelse, detalje = '') {
  if (betingelse) { ok++; log.push(`  ✓ ${navn}`) }
  else { fejl++; log.push(`  ✗ ${navn}${detalje ? ` — ${detalje}` : ''}`) }
}
const sektion = (t) => log.push(`\n${t}`)

/** Kør ÉN sætning som en given rolle/bruger i en transaktion, der altid rulles tilbage. */
async function som(rolle, uid, sql, params = []) {
  await db.exec('BEGIN')
  try {
    if (uid) await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role: rolle })])
    if (rolle !== 'postgres') await db.exec(`SET LOCAL ROLE ${rolle}`)
    const r = await db.query(sql, params)
    await db.exec('ROLLBACK')
    return { ok: true, rows: r.rows, antal: r.affectedRows ?? r.rows.length }
  } catch (e) {
    await db.exec('ROLLBACK')
    return { ok: false, kode: e.code, besked: e.message }
  }
}
const q = async (sql, params = []) => (await db.query(sql, params)).rows

const KOLONNER_TILLADT = [
  'display_name', 'username', 'avatar_url', 'user_mode', 'onboarded',
  'latitude', 'longitude', 'location_name',
  'garden_type', 'growing_areas', 'grower_profile', 'notification_profile', 'season_status',
  'last_badge_backfill_at', 'updated_at',
]
const VAERDI = {
  display_name: 'Test', username: 'test_bruger', avatar_url: 'https://x/y.png', user_mode: 'minimal', onboarded: true,
  latitude: 56.1, longitude: 10.2, location_name: 'Aarhus', garden_type: 'have', growing_areas: ['hoejbed'],
  grower_profile: 'ny', notification_profile: 'rolig', season_status: 'igang',
  last_badge_backfill_at: '2026-11-06T10:00:00Z', updated_at: '2026-11-06T10:00:00Z',
}
const snapshot = async () =>
  (await q(`select count(*)::int as n, md5(coalesce(string_agg(t::text, '|' order by id), '')) as h from public.profiles t`))[0]

// ───────────────────────── Statisk kontrol: kun rettigheder/politikker/trigger, ingen data ─────────────────────────
function sætninger(sql) {
  return sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    .replace(/\$\$[\s\S]*?\$\$/g, '$$$$') // funktionskroppe
    .split(';').map((x) => x.trim()).filter(Boolean)
}
sektion('Statisk kontrol af migrationsfilerne')
for (const [navn, sql] of [['00072 (A)', migrationA], ['A2', migrationA2]]) {
  const forbudt = sætninger(sql).filter((x) => /^(INSERT|UPDATE|DELETE|TRUNCATE|DROP\s+TABLE|DROP\s+COLUMN|ALTER\s+TABLE[\s\S]*DROP\s+COLUMN)\b/i.test(x))
  tjek(`${navn}: ingen datamanipulerende eller destruktive sætninger (INSERT/UPDATE/DELETE/TRUNCATE/DROP TABLE/DROP COLUMN)`, forbudt.length === 0, forbudt.join(' | '))
  tjek(`${navn}: kører i én transaktion (BEGIN … COMMIT)`, /^\s*BEGIN;/m.test(sql) && /^\s*COMMIT;/m.test(sql))
}
tjek('00072 (A): triggerfunktionen er eksplicit SECURITY INVOKER', /SECURITY INVOKER/.test(migrationA) && !/SECURITY DEFINER/.test(migrationA.split('-- ROLLBACK')[0].replace(/--.*$/gm, '')))

// ───────────────────────── FØR migrationen: reproducér fejlen ─────────────────────────
sektion('FØR migration A — fejlen reproduceres i replikaen')
const foer = await snapshot()
tjek('replikaen har 3 profiler, og kun ejeren er admin',
  foer.n === 3 && (await q(`select count(*)::int as n from public.profiles where is_admin`))[0].n === 1)
{
  const r = await som('authenticated', ALICE, `update public.profiles set is_admin = true where id = '${ALICE}'`)
  tjek('FEJLEN: alice kan sætte sin egen is_admin = true (før migrationen)', r.ok && r.antal === 1, JSON.stringify(r))
  const r2 = await som('authenticated', ALICE, `update public.profiles set subscription_tier = 'premium' where id = '${ALICE}'`)
  tjek('FEJLEN: alice kan sætte sin egen subscription_tier (før migrationen)', r2.ok && r2.antal === 1)
  // INSERT-vejen: bruger uden profilrække opretter selv en med is_admin = true.
  await db.exec(`insert into auth.users (id, email) values ('${CAROL}', 'carol@example.test')`)
  await db.exec(`delete from public.profiles where id = '${CAROL}'`)
  const r3 = await som('authenticated', CAROL, `insert into public.profiles (id, is_admin) values ('${CAROL}', true)`)
  tjek('FEJLEN: bruger UDEN profilrække kan oprette sin egen med is_admin = true (INSERT-vejen)', r3.ok, JSON.stringify(r3))
  const r5 = await som('authenticated', ALICE, `insert into public.community_memberships (group_id, user_id, role) values (gen_random_uuid(), '${ALICE}', 'moderator')`)
  tjek('FEJLEN (A2): alice kan oprette en membership med role = moderator', r5.ok, JSON.stringify(r5))
  const r6 = await som('authenticated', ALICE, `select count(*)::int as n from public.community_memberships`)
  tjek('FEJLEN (A2): alle indloggede kan læse alle memberships (politikken tillader det)', r6.ok)
}
await db.exec(`delete from public.profiles where id = '${CAROL}'`)
await db.exec(`delete from auth.users where id = '${CAROL}'`)
const foerSnap = await snapshot()

// ───────────────────────── Anvend migration A ─────────────────────────
await db.exec(migrationA)
sektion('EFTER migration A — rettigheder (tabel- og kolonneniveau)')
{
  const efter = await snapshot()
  tjek('INGEN eksisterende data er ændret eller slettet (rækketal og indholds-hash identiske)',
    efter.n === foerSnap.n && efter.h === foerSnap.h)

  const privs = async (rolle, kol) =>
    (await q(`select has_column_privilege('${rolle}','public.profiles','${kol}','UPDATE') as p`))[0].p
  for (const kol of ['is_admin', 'subscription_tier', 'id', 'created_at']) {
    tjek(`authenticated har IKKE UPDATE på ${kol}`, (await privs('authenticated', kol)) === false)
  }
  for (const kol of KOLONNER_TILLADT) {
    tjek(`authenticated har UPDATE på ${kol}`, (await privs('authenticated', kol)) === true)
  }
  const alleKolonner = (await q(`select column_name from information_schema.columns where table_schema='public' and table_name='profiles'`)).map((r) => r.column_name)
  const ikkeGivet = alleKolonner.filter((k) => !KOLONNER_TILLADT.includes(k)).sort()
  tjek('de eneste kolonner UDEN UPDATE er id, created_at, is_admin, subscription_tier',
    JSON.stringify(ikkeGivet) === JSON.stringify(['created_at', 'id', 'is_admin', 'subscription_tier']), ikkeGivet.join(','))
  let anonOk = true
  for (const kol of alleKolonner) if (await privs('anon', kol)) anonOk = false
  tjek('anon har ingen UPDATE på nogen kolonne', anonOk)
  const tab = await q(`select grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='profiles' and grantee in ('anon','authenticated') and privilege_type in ('INSERT','DELETE','TRUNCATE','UPDATE') order by 1,2`)
  tjek('anon/authenticated har ikke længere INSERT/DELETE/TRUNCATE/UPDATE på tabelniveau', tab.length === 0, JSON.stringify(tab))
  const sel = await q(`select grantee from information_schema.role_table_grants where table_schema='public' and table_name='profiles' and privilege_type='SELECT' and grantee in ('authenticated')`)
  tjek('authenticated har stadig SELECT (RLS: kun egen række)', sel.length === 1)
  const sr = await q(`select privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='profiles' and grantee='service_role' order by 1`)
  tjek('service_role er uberørt (UPDATE, INSERT, DELETE, TRUNCATE bevaret)', ['DELETE', 'INSERT', 'TRUNCATE', 'UPDATE'].every((p) => sr.some((r) => r.privilege_type === p)))
}

sektion('EFTER migration A — angreb og legitime handlinger (som PostgREST)')
{
  let r = await som('authenticated', ALICE, `update public.profiles set is_admin = true where id = '${ALICE}'`)
  tjek('alice kan IKKE sætte is_admin = true (42501)', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som('authenticated', ALICE, `update public.profiles set subscription_tier = 'premium' where id = '${ALICE}'`)
  tjek('alice kan IKKE ændre subscription_tier (42501)', !r.ok && r.kode === '42501')
  r = await som('authenticated', ALICE, `update public.profiles set is_admin = true, display_name = 'x' where id = '${ALICE}'`)
  tjek('en blandet opdatering, der også rører is_admin, afvises i sin helhed', !r.ok && r.kode === '42501')
  r = await som('authenticated', ALICE, `update public.profiles set is_admin = true where id = '${BOB}'`)
  tjek('alice kan IKKE gøre en ANDEN bruger til admin', !r.ok && r.kode === '42501')
  r = await som('authenticated', ALICE, `update public.profiles set id = '${CAROL}' where id = '${ALICE}'`)
  tjek('alice kan IKKE ændre sit eget id (42501)', !r.ok && r.kode === '42501')
  r = await som('authenticated', ALICE, `update public.profiles set created_at = now() where id = '${ALICE}'`)
  tjek('alice kan IKKE ændre created_at (42501)', !r.ok && r.kode === '42501')
  r = await som('authenticated', OWNER, `update public.profiles set is_admin = false where id = '${OWNER}'`)
  tjek('ikke engang admin kan ændre is_admin via klienten (42501)', !r.ok && r.kode === '42501')
  r = await som('authenticated', OWNER, `update public.profiles set is_admin = true where id = '${BOB}'`)
  tjek('admin kan ikke udnævne andre via klienten (42501)', !r.ok && r.kode === '42501')

  // INSERT-vejen er lukket
  await db.exec(`insert into auth.users (id, email) values ('${CAROL}', 'carol@example.test')`)
  await db.exec(`delete from public.profiles where id = '${CAROL}'`)
  r = await som('authenticated', CAROL, `insert into public.profiles (id, is_admin) values ('${CAROL}', true)`)
  tjek('bruger UDEN profilrække kan IKKE oprette en med is_admin = true (42501)', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som('anon', null, `insert into public.profiles (id) values ('${CAROL}')`)
  tjek('anon kan ikke indsætte profiler', !r.ok && r.kode === '42501')
  r = await som('authenticated', ALICE, `delete from public.profiles where id = '${ALICE}'`)
  tjek('en bruger kan ikke slette sin profil via klienten (42501)', !r.ok && r.kode === '42501')
  r = await som('authenticated', ALICE, `truncate public.profiles`)
  tjek('TRUNCATE er afvist for authenticated (42501)', !r.ok && r.kode === '42501')
  // signup virker stadig: handle_new_user er SECURITY DEFINER (ejer postgres)
  await db.exec(`insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'dave@example.test')`)
  const dave = await q(`select display_name, onboarded, is_admin from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'`)
  tjek('tilmelding virker stadig: ny auth-bruger får automatisk en profil (handle_new_user)', dave.length === 1 && dave[0].display_name === 'dave' && dave[0].is_admin === false)
  await db.exec(`delete from auth.users where id in ('${CAROL}','00000000-0000-0000-0000-0000000000e1')`)

  // legitime opdateringer — hver tilladt kolonne for sig, som appens kode gør
  for (const kol of KOLONNER_TILLADT) {
    const v = VAERDI[kol]
    const param = Array.isArray(v) ? `'{${v.join(',')}}'` : typeof v === 'boolean' || typeof v === 'number' ? String(v) : `'${v}'`
    r = await som('authenticated', ALICE, `update public.profiles set ${kol} = ${param} where id = '${ALICE}'`)
    tjek(`alice kan opdatere ${kol}`, r.ok && r.antal === 1, JSON.stringify(r))
  }
  // de tre præcise handlinger i appen
  r = await som('authenticated', ALICE, `update public.profiles set updated_at = now(), username = 'alice_01', display_name = 'Alice', user_mode = 'rolig_test' where id = '${ALICE}'`)
  tjek('(CHECK-constraints gælder fortsat) ugyldig user_mode afvises af databasen, ikke af rettigheder', !r.ok && r.kode === '23514', JSON.stringify(r))
  r = await som('authenticated', ALICE, `update public.profiles set updated_at = now(), username = 'alice_01', display_name = 'Alice', avatar_url = null, user_mode = 'afslappet', onboarded = true, latitude = 56.15, longitude = 10.2, location_name = '8000 Aarhus C' where id = '${ALICE}'`)
  tjek('updateProfile-mønsteret (alle felter samlet) virker', r.ok && r.antal === 1, JSON.stringify(r))
  r = await som('authenticated', ALICE, `update public.profiles set updated_at = now(), latitude = 56.15, longitude = 10.2, location_name = 'Aarhus', onboarded = true, garden_type = 'have', growing_areas = '{hoejbed,drivhus}', grower_profile = 'froesamler', notification_profile = 'rolig', season_status = 'igang' where id = '${ALICE}'`)
  tjek('saveOnboardingPreferences-mønsteret (alle felter samlet) virker', r.ok && r.antal === 1, JSON.stringify(r))
  r = await som('authenticated', ALICE, `update public.profiles set last_badge_backfill_at = now() where id = '${ALICE}'`)
  tjek('backfillAllBadges-mønsteret virker', r.ok && r.antal === 1)
  r = await som('authenticated', ALICE, `update public.profiles set display_name = 'Hacket' where id = '${BOB}'`)
  tjek('RLS gælder stadig: alice rammer 0 rækker hos bob', r.ok && r.antal === 0, JSON.stringify(r))
  r = await som('authenticated', ALICE, `select id, is_admin, subscription_tier from public.profiles`)
  tjek('RLS: alice ser kun sin egen række (og kan stadig læse is_admin)', r.ok && r.rows.length === 1 && r.rows[0].id === ALICE)

  // kode ⊂ tilladt: kolonnerne appens kode skriver
  const profil = readFileSync(join(REPO, 'src/actions/profil.ts'), 'utf8')
  const badges = readFileSync(join(REPO, 'src/actions/badges.ts'), 'utf8')
  const skrevet = new Set([...profil.matchAll(/update\.([a-z_]+)\s*=/g)].map((m) => m[1]))
  if (/last_badge_backfill_at:\s*new Date/.test(badges)) skrevet.add('last_badge_backfill_at')
  skrevet.add('updated_at')
  const udenfor = [...skrevet].filter((k) => !KOLONNER_TILLADT.includes(k))
  tjek(`appens kode skriver kun tilladte kolonner (${skrevet.size} fundet i profil.ts/badges.ts)`, udenfor.length === 0, udenfor.join(','))
  tjek('ingen kode skriver is_admin/subscription_tier', !skrevet.has('is_admin') && !skrevet.has('subscription_tier'))
}

sektion('EFTER migration A — administratorfunktioner og DB-roller')
{
  // requireAdmin-vejen: læs is_admin som den indloggede bruger
  let r = await som('authenticated', OWNER, `select is_admin from public.profiles where id = '${OWNER}'`)
  tjek('requireAdmin: ejeren læser is_admin = true', r.ok && r.rows[0]?.is_admin === true)
  r = await som('authenticated', ALICE, `select is_admin from public.profiles where id = '${ALICE}'`)
  tjek('requireAdmin: alice læser is_admin = false', r.ok && r.rows[0]?.is_admin === false)
  // admin-styret tabel (politik som live: general_garden_tasks admin write)
  r = await som('authenticated', OWNER, `insert into public.general_garden_tasks (title, month) values ('Admin-opgave', 11)`)
  tjek('admin kan stadig skrive til admin-styrede tabeller (RLS-politikken læser profiles)', r.ok, JSON.stringify(r))
  r = await som('authenticated', ALICE, `insert into public.general_garden_tasks (title, month) values ('Bruger-opgave', 11)`)
  tjek('almindelig bruger kan IKKE skrive til admin-styrede tabeller', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som('authenticated', ALICE, `select count(*)::int as n from public.general_garden_tasks`)
  tjek('almindelig bruger kan stadig læse aktive gøremål', r.ok)
  // DB-rollerne kan fortsat tildele/fratage admin (SQL-editor og service-role)
  r = await som('postgres', null, `update public.profiles set is_admin = true where id = '${BOB}' returning is_admin`)
  tjek('postgres (SQL-editoren) kan stadig ændre is_admin', r.ok && r.rows[0]?.is_admin === true, JSON.stringify(r))
  r = await som('service_role', null, `update public.profiles set is_admin = true, subscription_tier = 'pro' where id = '${BOB}' returning is_admin`)
  tjek('service_role kan stadig ændre is_admin/subscription_tier', r.ok && r.rows[0]?.is_admin === true, JSON.stringify(r))
  r = await som('service_role', null, `delete from public.profiles where id = '${BOB}'`)
  tjek('service_role kan stadig slette en profil (kontosletning)', r.ok)
  const admins = (await q(`select count(*)::int as n from public.profiles where is_admin`))[0].n
  tjek('antal admins uændret efter alle prøver (rullet tilbage): 1', admins === 1, String(admins))
}

sektion('EFTER migration A — andet lag (triggeren) og rettighedskontekst')
{
  // Midlertidigt giv rettigheden tilbage i en transaktion → triggeren skal ALENE stoppe ændringen.
  await db.exec('BEGIN')
  await db.exec('GRANT UPDATE (is_admin, subscription_tier) ON public.profiles TO authenticated')
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  let besked = null, kode = null
  try { await db.exec(`update public.profiles set is_admin = true where id = '${ALICE}'`) } catch (e) { besked = e.message; kode = e.code }
  await db.exec('ROLLBACK')
  tjek('TRIGGEREN stopper ændringen, selv hvis rettigheden gives tilbage (42501 + dansk besked)',
    kode === '42501' && /Rettigheder kan ikke ændres/.test(besked ?? ''), `${kode} ${besked}`)

  // Bevis for hvorfor funktionen SKAL være SECURITY INVOKER.
  await db.exec('BEGIN')
  await db.exec('GRANT UPDATE (is_admin) ON public.profiles TO authenticated')
  await db.exec(`create or replace function public.afvis_klient_aendring_af_roller() returns trigger language plpgsql security definer as $$
    begin
      if current_user in ('anon','authenticated') and new.is_admin is distinct from old.is_admin then
        raise exception 'blokeret' using errcode = '42501'; end if; return new; end $$`)
  await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ALICE, role: 'authenticated' })])
  await db.exec('SET LOCAL ROLE authenticated')
  let slap = false
  try { await db.exec(`update public.profiles set is_admin = true where id = '${ALICE}'`); slap = true } catch { slap = false }
  await db.exec('ROLLBACK')
  tjek('BEVIS: en SECURITY DEFINER-udgave af triggeren ville IKKE have stoppet ændringen (derfor INVOKER)', slap === true)
  const def = (await q(`select prosecdef from pg_proc where proname='afvis_klient_aendring_af_roller'`))[0]
  tjek('den installerede trigger-funktion er SECURITY INVOKER (efter rollback af beviset)', def.prosecdef === false)

  const trg = await q(`select tgname, tgenabled from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal order by 1`)
  tjek('profiles har de to triggere: den gamle insert-trigger og den nye update-trigger',
    trg.map((t) => t.tgname).join() === 'tr_profiles_afvis_klient_roller,tr_set_admin_on_profile_insert', JSON.stringify(trg))
}

sektion('Idempotens og rollback')
{
  const foer2 = await snapshot()
  await db.exec(migrationA)
  tjek('migrationen kan køres to gange uden fejl og uden dataændring', (await snapshot()).h === foer2.h)
  // Rollback-blokken (kommentaren nederst i filen) — udtræk og kør
  const blok = migrationA.split('-- ROLLBACK')[1].split('\n').filter((l) => l.startsWith('--   ')).map((l) => l.slice(5)).join('\n')
  await db.exec(blok)
  let r = await som('authenticated', ALICE, `update public.profiles set is_admin = true where id = '${ALICE}'`)
  tjek('rollback-SQL virker og genåbner (som dokumenteret) fejlen', r.ok && r.antal === 1)
  await db.exec(migrationA)
  r = await som('authenticated', ALICE, `update public.profiles set is_admin = true where id = '${ALICE}'`)
  tjek('genanvendelse af migrationen lukker hullet igen', !r.ok && r.kode === '42501')
}

// ───────────────────────── A2: community_memberships ─────────────────────────
sektion('A2 — community_memberships (forslag)')
{
  await db.exec(migrationA2)
  let r = await som('authenticated', ALICE, `insert into public.community_memberships (group_id, user_id, role) values (gen_random_uuid(), '${ALICE}', 'moderator')`)
  tjek('alice kan IKKE oprette en membership med role = moderator', !r.ok, JSON.stringify(r))
  r = await som('authenticated', ALICE, `insert into public.community_memberships (group_id, user_id) values (gen_random_uuid(), '${ALICE}')`)
  tjek('alice kan oprette en almindelig membership (standardrolle member)', r.ok, JSON.stringify(r))
  r = await som('authenticated', ALICE, `insert into public.community_memberships (group_id, user_id, role) values (gen_random_uuid(), '${ALICE}', 'member')`)
  tjek('...men klienten kan slet ikke ANGIVE role-kolonnen (heller ikke "member") — kolonne-rettighed mangler (42501)', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som('authenticated', ALICE, `insert into public.community_memberships (group_id, user_id) values (gen_random_uuid(), '${BOB}')`)
  tjek('alice kan IKKE oprette en membership for en anden bruger', !r.ok)
  // en eksisterende række (indsat som postgres) og forsøg på at hæve rollen
  await db.exec(`insert into public.community_memberships (id, group_id, user_id) values ('00000000-0000-0000-0000-00000000ee01', gen_random_uuid(), '${ALICE}')`)
  r = await som('authenticated', ALICE, `update public.community_memberships set role = 'moderator' where id = '00000000-0000-0000-0000-00000000ee01'`)
  tjek('alice kan IKKE hæve sin rolle til moderator på en eksisterende række (42501)', !r.ok && r.kode === '42501', JSON.stringify(r))
  r = await som('authenticated', ALICE, `update public.community_memberships set joined_at = now() where id = '00000000-0000-0000-0000-00000000ee01'`)
  tjek('alice kan stadig acceptere en invitation (joined_at)', r.ok && r.antal === 1, JSON.stringify(r))
  r = await som('authenticated', BOB, `select count(*)::int as n from public.community_memberships`)
  tjek('bob kan IKKE længere læse alices memberships', r.ok && r.rows[0].n === 0, JSON.stringify(r))
  r = await som('authenticated', ALICE, `select count(*)::int as n from public.community_memberships`)
  tjek('alice kan læse sine egne', r.ok && r.rows[0].n === 1)
  r = await som('authenticated', ALICE, `delete from public.community_memberships where id = '00000000-0000-0000-0000-00000000ee01'`)
  tjek('alice kan forlade en gruppe (slette egen række)', r.ok && r.antal === 1)
  r = await som('service_role', null, `update public.community_memberships set role = 'moderator' where id = '00000000-0000-0000-0000-00000000ee01'`)
  tjek('service_role kan stadig tildele moderator-rollen', r.ok && r.antal === 1, JSON.stringify(r))
  let a2Igen = true
  try { await db.exec(migrationA2) } catch (e) { a2Igen = false }
  tjek('A2 kan køres to gange uden fejl', a2Igen)
  r = await som('authenticated', ALICE, `insert into public.community_memberships (group_id, user_id, role) values (gen_random_uuid(), '${ALICE}', 'moderator')`)
  tjek('...og lukker stadig hullet efter anden kørsel', !r.ok)
}

console.log(log.join('\n'))
console.log(`\n${ok} bestået, ${fejl} fejlet`)
if (fejl > 0) process.exit(1)
