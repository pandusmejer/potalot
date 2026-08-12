'use client'

import { authFejlBesked } from '@/lib/auth-fejl'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!password) {
      setError('Indtast kodeord')
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (err) {
        setError(authFejlBesked(err, 'Kunne ikke logge ind. Prøv igen.'))
        return
      }
      router.push('/')
      router.refresh()
    })
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
              autoComplete="current-password"
              className="mt-1.5"
            />
            <Link
              href="/glemt-kode"
              className="block mt-2 text-sm text-primary hover:underline py-1"
            >
              Glemt kodeord?
            </Link>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            <LogIn className="h-4 w-4" />
            {pending ? 'Logger ind…' : 'Log ind'}
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Har du ikke en konto?{' '}
            <Link href="/opret" className="text-primary hover:underline">Opret bruger</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
