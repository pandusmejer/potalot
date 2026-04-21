export const dynamic = 'force-dynamic'

import { hentAfventendeAssets, hentGodkendteAssets } from '@/lib/flora-danica/assets'
import { CuratorRow } from '@/components/flora-danica/curator-row'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Check } from 'lucide-react'
import Link from 'next/link'

export default async function FloraDanicaCuratorPage() {
  const [afventende, godkendte] = await Promise.all([
    hentAfventendeAssets(),
    hentGodkendteAssets(40),
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-foreground">Flora Danica</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kurator-view. AI-genererede illustrationer skal godkendes før de vises officielt.
          </p>
        </div>
      </div>

      {/* Afventende */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-medium text-foreground mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          Afventer godkendelse
          {afventende.length > 0 && (
            <span className="text-sm text-muted-foreground font-sans">({afventende.length})</span>
          )}
        </h2>
        {afventende.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Ingen afventende illustrationer — alt er gennemgået.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {afventende.map(v => (
              <CuratorRow key={v.id} variety={v} mode="pending" />
            ))}
          </div>
        )}
      </section>

      {/* Godkendte */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-medium text-foreground mb-3">
          <Check className="h-4 w-4 text-primary" />
          Godkendte illustrationer
          {godkendte.length > 0 && (
            <span className="text-sm text-muted-foreground font-sans">({godkendte.length})</span>
          )}
        </h2>
        {godkendte.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Endnu ingen godkendte illustrationer.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {godkendte.map(v => (
              <CuratorRow key={v.id} variety={v} mode="approved" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
