/**
 * QA-route: komplet artsguide top-til-bund.
 *
 * Bruger SAMME rendering som live guide-detail. Aktiverer debug-
 * strips så artsguidens rytme kan vurderes mod sortsguidens.
 *
 * Test-guide: Tomat (arten) — har sortsvarianter (San Marzano osv.)
 * der vises i Sortsvarianter-sektionen, så vi kan se forskellen
 * fra en sortsguide.
 *
 * URL: /guides/qa/art-full
 */

import { GuideArticle } from '@/components/guides/guide-article'

export default async function QaArtFullPage() {
  return <GuideArticle id="tomat" returnTo="/guides" debug />
}
