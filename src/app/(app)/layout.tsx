import { BottomNav } from '@/components/layout/bottom-nav'
import { Topbar } from '@/components/layout/topbar'
import { DemoBanner } from '@/components/layout/demo-banner'
import { getProfile } from '@/actions/profil'
import { getNavState } from '@/actions/nav-state'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  // Anonyme brugere må gerne se appen. Kun logged-in brugere uden onboarding
  // skal til /onboarding.
  if (profile && !profile.onboarded) redirect('/onboarding')

  const nav = await getNavState()

  // Kompromisløst mobile-first: én centreret telefon-kolonne.
  // Desktop er blot en elegant udvidelse (samme kolonne, centreret).
  return (
    <div className="min-h-screen app-canvas">
      <Topbar profile={profile} />
      {!profile && <DemoBanner />}
      <main className="mx-auto w-full max-w-[480px] px-4 py-6 pb-28">
        {children}
      </main>
      <BottomNav heroHref={nav.heroHref} criticalTaskCount={nav.criticalTaskCount} />
    </div>
  )
}
