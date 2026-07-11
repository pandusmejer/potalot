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
      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-x-clip app-canvas shadow-[0_0_50px_rgba(42,51,32,0.10)]">
        <Topbar profile={profile} />
        {!profile && <DemoBanner />}
        {/* main = query-container (inline-size). Typografien i Havebog bruger
            cqw (container-bredde) i stedet for vw (vindue), så fonten skalerer
            med telefon-rammen — identisk på mobil og desktop. Padding ligger på
            en indre div, så container-referencen er den fulde 390px-ramme. */}
        <main className="w-full" style={{ containerType: 'inline-size' }}>
          <div className="px-4 py-6 pb-28">
            {children}
          </div>
        </main>
        <BottomNav criticalTaskCount={nav.criticalTaskCount} />
      </div>
    </div>
  )
}
