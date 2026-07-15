'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { KONTAKT_EMAIL } from '@/lib/contact'

/**
 * Sikkerhedsnet: fanger uventede fejl i en rute frem for at efterlade en hvid
 * side. Logger fejlen (Netlify function-/browser-log) og lader brugeren prøve
 * igen eller rapportere den. Egentlig fejl-monitorering (Sentry o.l.) er
 * bevidst udskudt til efter de første brugere.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[potalot] uventet fejl:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-serif text-foreground">Noget gik galt</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Der opstod en uventet fejl. Prøv igen — og hvis den bliver ved, må du
          meget gerne fortælle os hvad du lavede, så vi kan rette det.
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={reset} className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-3">
            Prøv igen
          </button>
          <Link href="/" className="w-full text-sm text-muted-foreground hover:text-foreground no-underline py-1">
            Tilbage til forsiden
          </Link>
          <a
            href={`mailto:${KONTAKT_EMAIL}?subject=${encodeURIComponent('Fejl i Potalot')}&body=${encodeURIComponent('Hvad lavede du, da fejlen opstod?\n\n(Fejlreference: ' + (error.digest ?? 'ukendt') + ')')}`}
            className="w-full text-sm text-muted-foreground hover:text-foreground no-underline py-1"
          >
            Rapportér fejlen
          </a>
        </div>
      </div>
    </div>
  )
}
