'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
    if (password.length < 8) {
      setError('Kodeord skal være mindst 8 tegn')
      return
    }
    if (password !== confirm) {
      setError('De to kodeord matcher ikke')
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) {
        setError(err.message)
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
              minLength={8}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Mindst 8 tegn.</p>
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
