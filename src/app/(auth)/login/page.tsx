'use client'

import { signIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sprout } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await signIn(formData)
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
        <h1 className="text-2xl font-bold text-foreground">PotAlot</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log ind for at fortsætte</p>
      </div>

      <form action={action} className="space-y-4">
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
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Logger ind...' : 'Log ind'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Har du ikke en konto?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Opret konto
        </Link>
      </p>
    </div>
  )
}
