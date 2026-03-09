'use client'

import { updateProfile, updateNotificationPreferences } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Profile, NotificationPreferences } from '@/lib/types'
import { useState, useTransition } from 'react'

interface SettingsFormProps {
  profile: Profile | null
  preferences: NotificationPreferences | null
  email: string
}

export function SettingsForm({ profile, preferences, email }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData)
      setMessage(result?.error ?? 'Profil opdateret')
    })
  }

  function handleNotifSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateNotificationPreferences(formData)
      setMessage(result?.error ?? 'Notifikationer opdateret')
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <Input value={email} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Navn</label>
              <Input name="display_name" defaultValue={profile?.display_name ?? ''} />
            </div>
            <Button type="submit" disabled={isPending} size="sm">Gem</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifikationer</CardTitle></CardHeader>
        <CardContent>
          <form action={handleNotifSubmit} className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="push_enabled" defaultChecked={preferences?.push_enabled ?? false} className="rounded" />
              Aktivér push-notifikationer
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Daglig påmindelse</label>
              <Input name="daily_reminder_time" type="time" defaultValue={preferences?.daily_reminder_time ?? '08:00'} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remind_task_due" defaultChecked={preferences?.remind_task_due ?? true} className="rounded" />
              Påmind om kommende opgaver
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Dage før opgave</label>
              <Input name="remind_days_before" type="number" min={0} max={7} defaultValue={preferences?.remind_days_before ?? 1} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remind_watering" defaultChecked={preferences?.remind_watering ?? true} className="rounded" />
              Påmind om vanding
            </label>
            <Button type="submit" disabled={isPending} size="sm">Gem notifikationer</Button>
          </form>
        </CardContent>
      </Card>

      {message && (
        <p className="text-sm text-primary">{message}</p>
      )}

      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground text-center">
            PotAlot demo — login og brugeroprettelse kan tilføjes senere.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
