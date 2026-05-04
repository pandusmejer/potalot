'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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
      setDone(true)
      setTimeout(() => router.push('/'), 1500)
    })
  }

  if (hasSession === false) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Linket er udløbet eller ugyldigt. Anmod om et nyt nulstillings-link.
          </p>
          <Button asChild>
            <Link href="/glemt-kode">Glemt kodeord</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <p className="font-serif text-lg text-foreground">Kodeord opdateret</p>
          <p className="text-sm text-muted-foreground">Logger dig ind…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Vælg et nyt kodeord til din konto.
          </p>

          <div>
            <Label>Nyt kodeord</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
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

          <Button type="submit" disabled={pending || hasSession !== true} className="w-full">
            <Lock className="h-4 w-4" />
            {pending ? 'Gemmer…' : 'Vælg kodeord'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
