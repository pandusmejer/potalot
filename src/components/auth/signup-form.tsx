'use client'

import { authFejlBesked } from '@/lib/auth-fejl'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { KODEORD_MIN_TEGN, KODEORD_KRAV_TEKST, KODEORD_FOR_KORT } from '@/lib/kodeord'

export function SignupForm() {
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < KODEORD_MIN_TEGN) {
      setError(KODEORD_FOR_KORT)
      return
    }
    if (password !== confirm) {
      setError('De to kodeord matcher ikke')
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const redirectTo = `${baseUrl}/auth/callback`
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo },
      })
      if (err) {
        setError(authFejlBesked(err, 'Kunne ikke oprette kontoen. Prøv igen.'))
        return
      }
      setSent(true)
    })
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <p className="font-serif text-lg text-foreground">Tjek din mail</p>
          <p className="text-sm text-muted-foreground">
            Vi har sendt en bekræftelse til <strong>{email}</strong>.
            Åbn linket i mailen for at aktivere kontoen, og log derefter ind.
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Tilbage til login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dig@example.com"
              required
              autoFocus
              autoComplete="email"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Kodeord</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
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
              required
              autoComplete="new-password"
              className="mt-1.5"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            <UserPlus className="h-4 w-4" />
            {pending ? 'Opretter…' : 'Opret bruger'}
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Har du allerede en konto?{' '}
            <Link href="/login" className="text-primary hover:underline">Log ind</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
