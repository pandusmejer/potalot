/**
 * Guide-detail = REN læseoplevelse — og nu KUN redaktionelle guides.
 *
 * Rute-adskillelse (perf-sprint 5/8 2026):
 *   - /guides/[id]      = statisk genererede Potalot-guides (denne fil).
 *   - /guides/mine/[id] = brugerens egne/AI-guides (dynamisk, RLS).
 *   - Gamle /guides/<uuid>-links redirectes af proxyen.
 *
 * Siden er force-static: ingen cookies/DB i render-stien. Bruger-bidder
 * (Din have-sektionen, back-knappens ?returnTo) er klient-/Suspense-øer.
 * dynamicParams=false: ukendte slugs → 404 ved build-kendte parametre.
 *
 * Master-spec krav:
 *   - Ingen "Master", "Mine", "Promote", "Flag", "Clone" på siden
 *   - Admin-maskineriet bor i /admin/guides/[id]
 */

import { GuideArticle } from '@/components/guides/guide-article'
import { RecordGuideRead } from '@/components/guides/record-guide-read'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { ALL_GUIDES } from '@/data/guides-demo'

export const dynamic = 'force-static'
export const dynamicParams = false
// ISR: dagligt — redaktionelt indhold skifter reelt kun ved deploy, men
// sæsonafhængige afledninger (måned) må ikke fryse på build-tidspunktet.
export const revalidate = 86400

export function generateStaticParams() {
  // Union: importerede slugs + demo-lagets legacy-id'er (demo-oplevelsen
  // linker stadig til fx demo-guide-agurk-arts).
  const ids = new Set<string>()
  for (const g of IMPORTED_GUIDES) ids.add(g.id)
  for (const g of ALL_GUIDES) ids.add(g.id)
  return [...ids].map((id) => ({ id }))
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function GuideDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <>
      <RecordGuideRead id={id} />
      <GuideArticle id={id} source="editorial" />
    </>
  )
}
