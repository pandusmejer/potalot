import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Topbar } from '@/components/layout/topbar'
import { getProfile } from '@/actions/profil'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!profile.onboarded) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Topbar profile={profile} />
        <main className="px-4 py-6 pb-24 lg:pb-8 lg:px-8 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
