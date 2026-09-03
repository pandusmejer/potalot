'use client'

import { authFejlBesked } from '@/lib/auth-fejl'
import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { KODEORD_MIN_TEGN, KODEORD_KRAV_TEKST, KODEORD_FOR_KORT, KODEORD_MATCHER_IKKE } from '@/lib/kodeord'

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (password.length < KODEORD_MIN_TEGN) {
      setError(KODEORD_FOR_KORT)
      return
    }
    if (password !== confirm) {
      setError(KODEORD_MATCHER_IKKE)
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) {
        setError(authFejlBesked(err, 'Kunne ikke skifte kodeordet. Prøv igen.'))
        return
      }
      setPassword('')
      setConfirm('')
      setDone(true)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Skift kodeord
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nyt kodeord</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={KODEORD_MIN_TEGN}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">{KODEORD_KRAV_TEKST}</p>
          </div>
          <div>
            <Label>Gentag kodeord</Label>
            <Input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="mt-1.5"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </div>
          )}
          {done && (
            <div className="text-sm text-foreground bg-primary/10 border border-primary/30 rounded-md p-2 flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Kodeord opdateret.
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !password}>
              {pending ? 'Gemmer…' : 'Skift kodeord'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
