export const dynamic = 'force-dynamic'

import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { ensureDemoUser } from '@/lib/demo'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  await ensureDemoUser(supabase)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-60">
        <Header />
        <main className="px-4 py-6 pb-24 lg:pb-6 lg:px-8 max-w-5xl mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
