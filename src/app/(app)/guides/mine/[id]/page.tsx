/**
 * Brugerens egne + AI-genererede guides — dynamisk og adgangskontrolleret.
 *
 * Rute-adskillelse (perf-sprint 5/8 2026): private/DB-guides bor her, så
 * /guides/[id] kan være statisk. Proxyen kræver login for /guides/mine/* og
 * redirecter gamle /guides/<uuid>-links hertil. RLS afgør reelt adgang —
 * getGuide returnerer kun rækker brugeren må se (egne + delte masters).
 */

import { GuideArticle } from '@/components/guides/guide-article'
import { requireUser } from '@/lib/auth'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string }>
}

export default async function MinGuidePage({ params, searchParams }: Props) {
  await requireUser()
  const { id } = await params
  const { returnTo } = await searchParams
  return <GuideArticle id={id} source="db" returnTo={returnTo} />
}
