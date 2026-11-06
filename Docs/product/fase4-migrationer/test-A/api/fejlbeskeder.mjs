import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire('/Users/mejervind/potalot/package.json')
const { createClient } = require('@supabase/supabase-js')
const leg = JSON.parse(readFileSync('legitimation.json', 'utf8'))
const c = async (n) => { const x = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } }); await x.auth.signInWithPassword({ email: leg[n].email, password: leg[n].password }); return x }
const alice = await c('alice'), carol = await c('carol')
const id = (await alice.auth.getUser()).data.user.id, cid = (await carol.auth.getUser()).data.user.id
const vis = (t, r) => console.log(t.padEnd(46), '→ status', r.status, '|', r.error?.code, '|', r.error?.message)
vis('alice PATCH is_admin', await alice.from('profiles').update({ is_admin: true }).eq('id', id))
vis('alice PATCH subscription_tier', await alice.from('profiles').update({ subscription_tier: 'pro' }).eq('id', id))
vis('carol INSERT (is_admin=true)', await carol.from('profiles').insert({ id: cid, is_admin: true }))
vis('alice DELETE egen profil', await alice.from('profiles').delete().eq('id', id))
vis('alice RPC delete_account', await alice.rpc('delete_account', { p_user: id }))
