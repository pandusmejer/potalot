import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getActiveSeasonalChallenges } from '@/actions/challenges'
import { Card, CardContent } from '@/components/ui/card'
import { PageHero } from '@/components/ui/page-hero'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { SubmitChallengeEntryDialog } from '@/components/grupper/submit-challenge-entry-dialog'
import { ChallengeGalleryDialog } from '@/components/grupper/challenge-gallery-dialog'
import { Trophy, Calendar, Users, Compass } from 'lucide-react'

export const dynamic = 'force-dynamic'

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return 'afsluttet'
  const days = Math.floor(diff / 86400000)
  if (days >= 1) return `${days} dag${days === 1 ? '' : 'e'} tilbage`
  const hours = Math.floor(diff / 3600000)
  return `${hours}t tilbage`
}

/**
 * Havelandskab — den fælles offentlige destination.
 *
 * Første version (Slice 4): viser aktive sæson-challenges som alle
 * brugere kan deltage i. Auto-rotation via SEASONAL_CHALLENGES-katalog.
 *
 * Senere version (cross-group, ikke planlagt endnu): havelandskabet
 * bliver også oversigt over danske grupper, deres samlede statistik,
 * og fælles initiativer.
 */
export default async function HavelandskabPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const challenges = await getActiveSeasonalChallenges()

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHero
        tone="fresh"
        kicker="Fællesskab"
        title="Havelandskab"
        subtitle="Sæsonens fælles rytme. Alle Potalot-brugere kan deltage."
      />

      {/* Hero-card der forklarer hvad dette er */}
      <Card className="bg-gradient-to-br from-secondary/30 to-card border-secondary/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-pattern-botanical opacity-25 pointer-events-none" />
        <CardContent className="relative py-5 flex items-start gap-3">
          <Compass className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="font-serif text-xl text-foreground">
              Deltag i sæsonens fælles rytme
            </h2>
            <p className="text-sm text-foreground/80 mt-1 leading-relaxed max-w-xl">
              Sæsonens udfordringer roterer med året — &ldquo;Forspirings-marts&rdquo;,
              &ldquo;Tomatmaj&rdquo;, &ldquo;Første tomat i hus&rdquo;.
              Indsend dit bidrag og se hvad andre har gjort. Ingen vinder —
              kun en samlet stemning af måneden.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aktive udfordringer */}
      {challenges.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="Ingen aktive udfordringer i denne måned"
          description="Sæsonens udfordringer roterer med årets måneder. Kig forbi næste måned."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Aktive ({challenges.length})
          </p>
          {challenges.map(c => (
            <Card key={c.id} className="overflow-hidden">
              {c.coverImageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img loading="lazy" decoding="async" src={c.coverImageUrl} alt="" className="w-full h-32 object-cover" />
              )}
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <Trophy className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{c.title}</p>
                    {c.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
                    )}
                    {c.prompt && (
                      <p className="text-xs text-foreground/80 mt-1 italic">
                        &ldquo;{c.prompt}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <Badge variant="success" className="text-[10px]">Aktiv</Badge>
                  {c.endsAt && (
                    <Badge variant="outline" className="text-[10px] gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {timeUntil(c.endsAt)}
                    </Badge>
                  )}
                  <Badge variant="muted" className="text-[10px] gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {c.entryCount} {c.entryCount === 1 ? 'bidrag' : 'bidrag'}
                  </Badge>
                  {c.myEntry && <Badge variant="info" className="text-[10px]">Du deltager</Badge>}
                </div>

                {c.myEntry && (
                  <div className="rounded-lg border border-border bg-muted/20 p-2 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dit bidrag</p>
                    {c.myEntry.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img loading="lazy" decoding="async" src={c.myEntry.imageUrl} alt="" className="rounded-md max-h-32 object-cover" />
                    )}
                    {c.myEntry.caption && (
                      <p className="text-xs text-foreground">{c.myEntry.caption}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <SubmitChallengeEntryDialog
                    challengeId={c.id}
                    prompt={c.prompt}
                    existingEntry={c.myEntry}
                  />
                  <ChallengeGalleryDialog
                    challengeId={c.id}
                    challengeTitle={c.title}
                    entryCount={c.entryCount}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
