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

  // Kompromisløst mobile-first: HELE appen låst til én centreret telefon-
  // ramme. På mobil fylder rammen skærmen (uændret); på desktop står den som
  // en telefon på en rolig sage-flade — også Topbar og BottomNav holder sig
  // inden for kolonnen (ingen fuld-bredde-barer).
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'color-mix(in oklab, var(--primary) 12%, var(--background))' }}
    >
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col app-canvas shadow-[0_0_50px_rgba(42,51,32,0.10)]">
        <Topbar profile={profile} />
        {!profile && <DemoBanner />}
        <main className="w-full px-4 py-6 pb-28">
          {children}
        </main>
        <BottomNav heroHref={nav.heroHref} criticalTaskCount={nav.criticalTaskCount} />
      </div>
    </div>
  )
}
