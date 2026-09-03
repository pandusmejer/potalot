'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageUpload } from '@/components/ui/image-upload'
import { USER_MODES } from '@/lib/constants'
import type { UserMode, Profile } from '@/lib/types'
import { Target, Leaf, Moon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProfile } from '@/actions/profil'

interface Props {
  initialProfile: Profile
}

export function ProfilForm({ initialProfile }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState(initialProfile.username)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl ?? null)
  const [mode, setMode] = useState<UserMode>(initialProfile.userMode)

  const initials = (username || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await updateProfile({ username, avatarUrl, userMode: mode })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

  function handleCancel() {
    setUsername(initialProfile.username)
    setAvatarUrl(initialProfile.avatarUrl ?? null)
    setMode(initialProfile.userMode)
    setError(null)
    setEditing(false)
  }

  // Når mode ændres, gem direkte (ikke gemt bag editing-toggle — tydeligere UX)
  function handleModeChange(m: UserMode) {
    setMode(m)
    startTransition(async () => {
      await updateProfile({ userMode: m })
      router.refresh()
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
                <AvatarFallback className="text-xl font-serif">{initials}</AvatarFallback>
              </Avatar>
              {editing ? (
                <div className="flex-1 space-y-2">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    folder="profil"
                    label="Vælg profilbillede"
                  />
                  {avatarUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarUrl(null)}>
                      Fjern billede
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground self-center">
                  Tryk Redigér for at skifte billede.
                </p>
              )}
            </div>

            <div>
              <Label>Navn</Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={!editing}
                className="mt-1.5"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              {editing ? (
                <>
                  <Button type="button" variant="ghost" onClick={handleCancel} disabled={pending}>
                    Annullér
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Gemmer…' : 'Gem'}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setEditing(true)}>
                  Redigér
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brugertype</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.keys(USER_MODES) as UserMode[]).map(m => {
            const info = USER_MODES[m]
            const Icon = m === 'maalrettet' ? Target : m === 'afslappet' ? Leaf : Moon
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                disabled={pending}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3',
                  active
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:bg-accent/30'
                )}
              >
                <span
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{info.label}</p>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{info.tagline}</p>
                </div>
              </button>
            )
          })}
          <p className="text-xs text-muted-foreground italic mt-3">
            {USER_MODES[mode].description}
          </p>
        </CardContent>
      </Card>
    </>
  )
}
