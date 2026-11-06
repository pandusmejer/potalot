// API-test mod den isolerede Supabase-branch (PostgREST/GoTrue/supabase-js) — rører ALDRIG produktion.
// Kør:  FASE=foer|efterA|efterA2  SUPABASE_URL=… SUPABASE_ANON_KEY=…  node api-test.mjs
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire('/Users/mejervind/potalot/package.json')
const { createClient } = require('@supabase/supabase-js')

const URL_ = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_ANON_KEY
const FASE = process.env.FASE ?? 'foer'
if (!URL_?.includes('asculsynmocvvoqcrjbm')) throw new Error('Afbrudt: URL peger ikke på test-branchen')

const leg = JSON.parse(readFileSync(join(process.cwd(), 'legitimation.json'), 'utf8'))
const ny = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } })

async function login(navn) {
  const c = ny()
  const { data, error } = await c.auth.signInWithPassword({ email: leg[navn].email, password: leg[navn].password })
  if (error) throw new Error(`login ${navn}: ${error.message}`)
  return { c, id: data.user.id, jwtRolle: JSON.parse(Buffer.from(data.session.access_token.split('.')[1], 'base64url').toString()).role }
}

let ok = 0, fejl = 0
const log = []
const tjek = (navn, b, d = '') => { b ? ok++ : fejl++; log.push(`  ${b ? '✓' : '✗'} ${navn}${!b && d ? ` — ${d}` : ''}`) }
const kort = (e) => (e ? `${e.code ?? ''} ${e.message ?? ''}`.trim() : '')
const sek = (t) => log.push(`\n${t}`)

const owner = await login('owner'), alice = await login('alice'), bob = await login('bob'), carol = await login('carol')
const anon = ny()

sek(`API-test, fase: ${FASE}`)
tjek('testbrugernes JWT har rollen "authenticated" (rigtig GoTrue-login)', [owner, alice, bob, carol].every((u) => u.jwtRolle === 'authenticated'))

if (FASE === 'foer' || FASE === 'efterA') {
  const lukket = FASE === 'efterA'
  sek(lukket ? 'A — angreb afvises via PostgREST' : 'FØR A — fejlen reproduceres via PostgREST')

  let r = await alice.c.from('profiles').update({ is_admin: true }).eq('id', alice.id).select('id,is_admin')
  if (lukket) tjek('alice: PATCH is_admin=true afvises (42501)', !!r.error && r.error.code === '42501', kort(r.error) + JSON.stringify(r.data))
  else tjek('FEJLEN: alice kan sætte egen is_admin=true via API', !r.error && r.data?.[0]?.is_admin === true, kort(r.error))

  r = await alice.c.from('profiles').update({ subscription_tier: 'premium' }).eq('id', alice.id).select('id,subscription_tier')
  if (lukket) tjek('alice: PATCH subscription_tier afvises (42501)', !!r.error && r.error.code === '42501', kort(r.error))
  else tjek('FEJLEN: alice kan sætte egen subscription_tier via API', !r.error && r.data?.[0]?.subscription_tier === 'premium', kort(r.error))

  r = await alice.c.from('profiles').update({ is_admin: true, display_name: 'Blandet' }).eq('id', alice.id)
  if (lukket) tjek('alice: blandet PATCH (is_admin + display_name) afvises i sin helhed', !!r.error && r.error.code === '42501', kort(r.error))

  r = await alice.c.from('profiles').update({ is_admin: true }).eq('id', bob.id).select()
  if (lukket) tjek('alice kan ikke gøre bob til admin (afvist 42501)', !!r.error && r.error.code === '42501', kort(r.error))

  r = await alice.c.from('profiles').upsert({ id: alice.id, is_admin: true }).select()
  if (lukket) tjek('alice: UPSERT af egen profil med is_admin=true afvises', !!r.error && r.error.code === '42501', kort(r.error))

  // INSERT-vejen: carol mister sin profilrække (via SQL, uden for API'et) og forsøger at oprette en ny som admin.
  r = await carol.c.from('profiles').insert({ id: carol.id, is_admin: true }).select('id,is_admin')
  if (lukket) tjek('carol (uden profilrække): INSERT med is_admin=true afvises (42501)', !!r.error && r.error.code === '42501', kort(r.error))
  else tjek('FEJLEN: carol (uden profilrække) kan oprette sin egen profil som admin via API', !r.error && r.data?.[0]?.is_admin === true, kort(r.error))

  r = await alice.c.from('profiles').delete().eq('id', alice.id).select()
  tjek('alice kan ikke slette sin egen profil via API', lukket ? (!!r.error && r.error.code === '42501') : true, kort(r.error))

  r = await anon.from('profiles').update({ is_admin: true }).eq('id', alice.id).select()
  tjek('anon (uden login) kan ikke ændre profiler', !!r.error || (r.data ?? []).length === 0, kort(r.error))
  r = await anon.from('profiles').insert({ id: alice.id, is_admin: true })
  tjek('anon (uden login) kan ikke indsætte profiler', !!r.error, kort(r.error))

  r = await owner.c.from('profiles').update({ is_admin: false }).eq('id', owner.id).select()
  if (lukket) tjek('selv admin kan ikke ændre egen is_admin via API (42501)', !!r.error && r.error.code === '42501', kort(r.error))
}

if (FASE === 'efterA') {
  sek('A — legitime profilopdateringer via PostgREST (som appens kode)')
  // updateProfile-formen
  let r = await alice.c.from('profiles').update({
    updated_at: new Date().toISOString(), username: 'alice_01', display_name: 'Alice', avatar_url: null,
    user_mode: 'afslappet', onboarded: true, latitude: 56.15, longitude: 10.2, location_name: '8000 Aarhus C',
  }).eq('id', alice.id)
  tjek('updateProfile-formen (uden .select()) virker', !r.error, kort(r.error))
  r = await alice.c.from('profiles').update({ display_name: 'Alice B' }).eq('id', alice.id).select('id,display_name')
  tjek('opdatering med return=representation (.select()) virker', !r.error && r.data?.[0]?.display_name === 'Alice B', kort(r.error))
  // saveOnboardingPreferences-formen
  r = await alice.c.from('profiles').update({
    updated_at: new Date().toISOString(), latitude: 56.15, longitude: 10.2, location_name: 'Aarhus', onboarded: true,
    garden_type: 'have', growing_areas: ['hoejbed', 'drivhus'], grower_profile: 'froesamler', notification_profile: 'rolig', season_status: 'igang',
  }).eq('id', alice.id)
  tjek('saveOnboardingPreferences-formen virker', !r.error, kort(r.error))
  // badge-backfill-formen
  r = await alice.c.from('profiles').update({ last_badge_backfill_at: new Date().toISOString() }).eq('id', alice.id)
  tjek('backfillAllBadges-formen virker', !r.error, kort(r.error))
  // læsning (getProfile/requireAdmin)
  r = await alice.c.from('profiles').select('*')
  tjek('getProfile: alice ser KUN sin egen række, og is_admin er false', !r.error && r.data.length === 1 && r.data[0].id === alice.id && r.data[0].is_admin === false && r.data[0].subscription_tier === 'free', kort(r.error) + ' rækker=' + r.data?.length)
  tjek('de gemte værdier står korrekt (round-trip)', r.data?.[0]?.username === 'alice_01' && r.data?.[0]?.location_name === 'Aarhus' && r.data?.[0]?.season_status === 'igang')
  r = await alice.c.from('profiles').update({ display_name: 'Hacket' }).eq('id', bob.id).select()
  tjek('RLS: alice kan stadig ikke ændre bobs profil (0 rækker)', !r.error && (r.data ?? []).length === 0, kort(r.error))
  r = await alice.c.from('profiles').update({ user_mode: 'ugyldig' }).eq('id', alice.id)
  tjek('CHECK-constraints gælder stadig (ugyldig user_mode afvises: 23514)', r.error?.code === '23514', kort(r.error))
  r = await alice.c.rpc('is_username_available', { p_username: 'ledigt_navn' })
  tjek('RPC is_username_available virker for indloggede', !r.error && r.data === true, kort(r.error))
  r = await anon.rpc('is_username_available', { p_username: 'ledigt_navn' })
  tjek('RPC is_username_available virker uændret for anon (onboarding/tilmelding)', !r.error && r.data === true, kort(r.error))

  sek('A — administratorfunktioner via PostgREST')
  r = await owner.c.from('profiles').select('is_admin').eq('id', owner.id).single()
  tjek('requireAdmin-læsning: ejeren er stadig admin', !r.error && r.data?.is_admin === true, kort(r.error))
  r = await owner.c.from('profiles').update({ display_name: 'Ejer' }).eq('id', owner.id)
  tjek('admin kan opdatere sin egen profil (tilladte felter)', !r.error, kort(r.error))
  r = await owner.c.from('general_garden_tasks').insert({ title: 'Admin-gøremål (API-test)', month: 11 }).select('id')
  tjek('admin kan stadig skrive til admin-styret tabel (RLS læser profiles.is_admin)', !r.error && r.data?.length === 1, kort(r.error))
  const adminRaekke = r.data?.[0]?.id
  r = await alice.c.from('general_garden_tasks').insert({ title: 'Bruger-gøremål', month: 11 }).select('id')
  tjek('almindelig bruger kan IKKE skrive til admin-styret tabel (RLS)', !!r.error, kort(r.error))
  r = await alice.c.from('general_garden_tasks').select('title').eq('is_active', true)
  tjek('almindelig bruger kan læse aktive gøremål', !r.error && r.data.some((x) => x.title.startsWith('Admin-gøremål')), kort(r.error))
  r = await alice.c.from('general_garden_tasks').update({ title: 'Hacket' }).eq('id', adminRaekke).select()
  tjek('almindelig bruger kan IKKE ændre admin-gøremål (0 rækker)', !r.error ? (r.data ?? []).length === 0 : true, kort(r.error))
  r = await owner.c.from('general_garden_tasks').delete().eq('id', adminRaekke).select('id')
  tjek('admin kan rydde sit testgøremål op', !r.error && r.data?.length === 1, kort(r.error))

  sek('A — kontosletnings-RPC må ikke kunne kaldes af klienter')
  r = await alice.c.rpc('delete_account', { p_user: alice.id })
  tjek('authenticated kan IKKE kalde delete_account', !!r.error, kort(r.error))
  r = await anon.rpc('delete_account', { p_user: alice.id })
  tjek('anon kan IKKE kalde delete_account', !!r.error, kort(r.error))
}

if (FASE === 'efterA2') {
  sek('A2 — community_memberships via PostgREST')
  const g = '11111111-1111-1111-1111-111111111111'
  let r = await alice.c.from('community_memberships').insert({ group_id: g, user_id: alice.id, role: 'moderator' }).select()
  tjek('alice: INSERT med role=moderator afvises', !!r.error, kort(r.error))
  r = await alice.c.from('community_memberships').insert({ group_id: g, user_id: alice.id }).select('role')
  tjek('alice: INSERT uden rolle virker (standard member)', !r.error && r.data?.[0]?.role === 'member', kort(r.error))
  r = await alice.c.from('community_memberships').update({ role: 'moderator' }).eq('user_id', alice.id).select()
  tjek('alice: UPDATE role=moderator afvises (42501)', !!r.error && r.error.code === '42501', kort(r.error))
  r = await alice.c.from('community_memberships').update({ joined_at: new Date().toISOString() }).eq('user_id', alice.id).select('joined_at')
  tjek('alice: kan acceptere invitation (joined_at)', !r.error && r.data?.length === 1, kort(r.error))
  r = await alice.c.from('community_memberships').insert({ group_id: g, user_id: bob.id }).select()
  tjek('alice: kan ikke oprette membership for bob', !!r.error, kort(r.error))
  r = await bob.c.from('community_memberships').select('*')
  tjek('bob kan IKKE læse alices membership (kun egne rækker)', !r.error && (r.data ?? []).length === 0, kort(r.error))
  r = await alice.c.from('community_memberships').select('*')
  tjek('alice læser sin egen membership', !r.error && r.data.length === 1)
  r = await alice.c.from('community_memberships').delete().eq('user_id', alice.id).select()
  tjek('alice kan forlade gruppen (slette egen række)', !r.error && r.data?.length === 1, kort(r.error))
  r = await anon.from('community_memberships').select('*')
  tjek('anon kan ikke læse memberships', !!r.error || (r.data ?? []).length === 0, kort(r.error))
}

console.log(log.join('\n'))
console.log(`\n${ok} bestået, ${fejl} fejlet`)
process.exit(fejl > 0 ? 1 : 0)
