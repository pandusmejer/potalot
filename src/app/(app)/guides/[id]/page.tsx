/**
 * Guide-detail = REN læseoplevelse.
 *
 * Master-spec krav:
 *   - Ingen "Master", "Mine", "Promote", "Flag", "Clone" på siden
 *   - For ejere: højst ÉN diskret "Rediger"-affordance til egne guides
 *   - Admin-maskineriet bor i /admin/guides/[id]
 *
 * Hele rendering er flyttet til <GuideArticle /> så QA-routes
 * (/guides/qa/sort-full, /guides/qa/art-full) kan genbruge SAMME
 * komponent uden kopier — de aktiverer bare debug-mode.
 */

import { GuideArticle } from '@/components/guides/guide-article'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string }>
}

export default async function GuideDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { returnTo } = await searchParams
  return <GuideArticle id={id} returnTo={returnTo} />
}
