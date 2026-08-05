/**
 * Keep-warm (koldstart-fix 5/8 2026): Netlify-lambdaen bag de dynamiske
 * sider (Havebog, Kalender m.fl.) tog 8–13 s at vække efter inaktivitet.
 * Et let ping hvert 5. minut holder instansen varm, så første åbning af
 * appen ikke betaler koldstarten.
 *
 * Pinget er anonymt (ingen cookies) — proxyen springer auth over, og
 * siderne springer selv databasen over for anonyme, så det er nær-gratis
 * i både Supabase-kald og funktionstid.
 */
export default async () => {
  const base = process.env.URL || 'https://potalot.app'
  await Promise.allSettled([
    fetch(`${base}/`, { headers: { 'user-agent': 'potalot-keep-warm' } }),
    fetch(`${base}/kalender`, { headers: { 'user-agent': 'potalot-keep-warm' } }),
  ])
}

export const config = { schedule: '*/5 * * * *' }
