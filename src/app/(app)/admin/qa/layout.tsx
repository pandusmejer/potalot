import { notFound } from 'next/navigation'
import { isCurrentUserAdmin } from '@/lib/auth'

/**
 * QA/preview-værkstedet. Disse ruter er udvikler-værktøjer (sort-full,
 * art-full, components, comparison, editorial, havebog-hero-states) og
 * må ALDRIG være synlige for en almindelig bruger — de afslører
 * arbejdsprocessen, ikke produktet. Gated bag admin, så det offentlige
 * URL-rum kun indeholder det færdige produkt.
 */
export default async function AdminQaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isCurrentUserAdmin())) notFound()
  return <>{children}</>
}
