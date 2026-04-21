export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Sparkles, ChevronRight } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const [profileRes, prefsRes, pendingRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('notification_preferences').select('*').eq('user_id', userId).single(),
    supabase
      .from('varieties')
      .select('id', { count: 'exact', head: true })
      .eq('illustration_source', 'ai_generated')
      .eq('illustration_approved', false)
      .not('illustration_url', 'is', null),
  ])

  const pendingCount = pendingRes.count ?? 0

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Indstillinger</h1>
        <p className="text-sm text-muted-foreground">Profil og notifikationer</p>
      </div>

      <SettingsForm
        profile={profileRes.data}
        preferences={prefsRes.data}
        email="demo@potalot.app"
      />

      <Link href="/settings/flora-danica">
        <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">Flora Danica</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingCount > 0
                  ? `${pendingCount} illustration${pendingCount === 1 ? '' : 'er'} afventer godkendelse`
                  : 'Kurator-view — alt er gennemgået'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </Link>
    </div>
  )
}