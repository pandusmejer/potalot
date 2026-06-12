/**
 * QA-route: komplet sortsguide top-til-bund.
 *
 * Bruger SAMME rendering som live guide-detail (ingen kopierede
 * mockups). Aktiverer debug-strips over hver blok så rytmen kan
 * vurderes uden at gætte hvor komponent-grænserne ligger.
 *
 * Test-guide: Tomat San Marzano — den mest udbyggede sortsguide
 * med både bleed-blokke, kalender-rytme, comparison-list og
 * tom-tilstand for "Dine egne".
 *
 * URL: /guides/qa/sort-full
 */

import { GuideArticle } from '@/components/guides/guide-article'

export default async function QaSortFullPage() {
  return <GuideArticle id="tomat-san-marzano" returnTo="/guides" debug />
}
