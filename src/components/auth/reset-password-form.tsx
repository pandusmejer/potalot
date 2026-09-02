'use client'

import { authFejlBesked } from '@/lib/auth-fejl'
import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { KODEORD_MIN_TEGN, KODEORD_KRAV_TEKST, KODEORD_FOR_KORT } from '@/lib/kodeord'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [phase, setPhase] = useState<'init' | 'ready' | 'invalid'>('init')

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function init() {
      // Listener registreres FØR vi tjekker noget — så vi fanger
      // PASSWORD_RECOVERY-eventet uanset rækkefølge.
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return
        if (event === 'PASSWORD_RECOVERY' || session) {
          setPhase('ready')
        }
      })

      // Forsøg at bytte ?code=... for en session (PKCE-flow)
      const code = searchParams.get('code')
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (!cancelled) {
          if (exErr) {
            setPhase('invalid')
          } else {
            setPhase('ready')
          }
        }
        return () => sub.subscription.unsubscribe()
      }

      // Hvis token ligger i URL'ens hash (implicit-flow eller ældre links),
      // har Supabase JS-klienten allerede sat session via detectSessionInUrl.
      // Vent kort og tjek getSession.
      await new Promise(r => setTimeout(r, 400))
      const { data } = await supabase.auth.getSession()
      if (!cancelled) {
        setPhase(data.session ? 'ready' : 'invalid')
      }

      return () => sub.subscription.unsubscribe()
    }

    init()
    return () => { cancelled = true }
  }, [searchParams])

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
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) {
        setError(authFejlBesked(err, 'Kunne ikke gemme det nye kodeord. Prøv igen.'))
        return
      }
      setDone(true)
      setTimeout(() => router.push('/'), 1500)
    })
  }

  if (phase === 'init') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Validerer link…</p>
        </CardContent>
      </Card>
    )
  }

  if (phase === 'invalid') {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Linket er udløbet eller ugyldigt. Bed om et nyt link til at vælge kodeord.
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
            <Lock className="h-4 w-4" />
            {pending ? 'Gemmer…' : 'Vælg kodeord'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
