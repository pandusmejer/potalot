'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      })
      if (err) {
        setError(err.message)
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
            Vi har sendt et login-link til <strong>{email}</strong>.
            Klik på linket for at logge ind.
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSent(false)}>
            Brug en anden mail
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
              className="mt-1.5"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending} className="w-full">
            <Mail className="h-4 w-4" />
            {pending ? 'Sender…' : 'Send login-link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
