import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Artssamlingen/hubben er UDGÅET som navigation (25/7). Den var et unødvendigt
 * mellemled: bruger skulle først forstå at "Agurk" var en container, og derefter
 * vælge mellem artsguide/sorter/teknik. Nu:
 *   KATEGORI = find · ARTSGUIDE = forstå arten + vælg sort · SORTSGUIDE = forstå
 *   sorten + opdag alternativer · TEKNIK = lær opgaven.
 *
 * Ruten beholdes kun som redirect til artsguiden, så gamle links ikke dør.
 * INGEN erstatnings-hub.
 */
export default async function ArtHubRedirect({
  params,
}: {
  params: Promise<{ slug: string; art: string }>
}) {
  const { art } = await params
  redirect(`/guides/${art}`)
}
