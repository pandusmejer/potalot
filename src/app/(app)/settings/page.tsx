export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const [profileRes, prefsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('notification_preferences').select('*').eq('user_id', userId).single(),
  ])

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-foreground">Indstillinger</h1>
        <p className="text-sm text-muted-foreground">Profil og notifikationer</p>
      </div>
      <SettingsForm
        profile={profileRes.data}
        preferences={prefsRes.data}
        email="demo@potalot.app"
      />
    </div>
  )
}