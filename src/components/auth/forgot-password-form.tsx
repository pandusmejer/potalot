'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      // Brug canonical produktions-URL hvis sat — ellers nuværende origin.
      // Det sikrer reset-links altid peger på potalot.app, ikke deploy-previews.
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const redirectTo = `${baseUrl}/nulstil-kode`
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
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
            Hvis <strong>{email}</strong> er knyttet til en konto, har vi
            sendt et link til at vælge nyt kodeord.
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
          <p className="text-sm text-muted-foreground">
            Indtast din mail. Vi sender et link, hvor du kan vælge nyt kodeord.
          </p>

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

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            <Mail className="h-4 w-4" />
            {pending ? 'Sender…' : 'Send nulstillings-link'}
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            <Link href="/login" className="text-primary hover:underline">Tilbage til login</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
