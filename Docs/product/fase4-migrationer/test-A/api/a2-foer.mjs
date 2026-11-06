import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire('/Users/mejervind/potalot/package.json')
const { createClient } = require('@supabase/supabase-js')
const leg = JSON.parse(readFileSync('legitimation.json', 'utf8'))
const c = async (n) => { const x = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } }); await x.auth.signInWithPassword({ email: leg[n].email, password: leg[n].password }); return x }
const alice = await c('alice'), bob = await c('bob')
const aid = (await alice.auth.getUser()).data.user.id
const g = '11111111-1111-1111-1111-111111111111'
let r = await alice.from('community_memberships').insert({ group_id: g, user_id: aid, role: 'moderator' }).select('role')
console.log('FØR A2: alice INSERT role=moderator →', r.status, r.error?.message ?? JSON.stringify(r.data))
r = await bob.from('community_memberships').select('user_id,role')
console.log('FØR A2: bob læser memberships (alices række synlig for andre) →', r.status, r.error?.message ?? `${r.data.length} række(r)`)
