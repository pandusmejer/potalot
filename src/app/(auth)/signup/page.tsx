'use client'

import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sprout } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'

export default function SignupPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await signUp(formData)
      return result ?? null
    },
    null
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Sprout className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Opret konto</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kom i gang med din dyrkningslog</p>
      </div>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-1">
            Navn
          </label>
          <Input id="displayName" name="displayName" type="text" placeholder="Dit navn" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            E-mail
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Adgangskode
          </label>
          <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Opretter...' : 'Opret konto'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Har du allerede en konto?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Log ind
        </Link>
      </p>
    </div>
  )
}
