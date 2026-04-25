'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { USER_MODES } from '@/lib/constants'
import type { UserMode } from '@/lib/types'
import { MOCK_PROFILE } from '@/lib/mock-data'
import { Camera, Target, Leaf, Moon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// TODO (database): server actions til at gemme profil
export default function ProfilPage() {
  const [profile] = useState(MOCK_PROFILE)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [mode, setMode] = useState<UserMode>(profile.userMode)

  const initials = profile.username.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // TODO (database): updateProfile({ username, email, userMode: mode })
    console.log('Save profile:', { username, email, mode })
    setEditing(false)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvem er du, og hvordan vil du bruge PotAlot.
        </p>
      </div>

      {/* Avatar + grunddata */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.username} />}
                <AvatarFallback className="text-xl font-serif">{initials}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" disabled={!editing}>
                <Camera className="h-3.5 w-3.5" />
                Skift billede
              </Button>
              {/* TODO (storage): upload til Supabase Storage */}
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

            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!editing}
                className="mt-1.5"
              />
            </div>

            <div className="flex justify-end gap-2">
              {editing ? (
                <>
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Annullér
                  </Button>
                  <Button type="submit">Gem</Button>
                </>
              ) : (
                <Button type="button" onClick={() => setEditing(true)}>
                  Rediger
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Brugertype */}
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
                onClick={() => setMode(m)}
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
    </div>
  )
}
