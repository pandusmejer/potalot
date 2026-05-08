import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react'
import { isCurrentUserAdmin } from '@/lib/auth'
import { getMasterGuides, getRecentUserGuides, type AdminGuideRow } from '@/actions/guides-admin'
import { MasterGuideForm } from '@/components/admin/master-guide-form'
import { PRIMARY_CATEGORIES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

function venligDato(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminGuidesPage() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/')

  const [masters, userGuides] = await Promise.all([
    getMasterGuides(),
    getRecentUserGuides({ sinceDays: 30 }),
  ])

  // Bruger-guides hvis plante-navn ikke findes som master — kandidater til ny master
  const masterNames = new Set(masters.map(m => m.plantName.trim().toLowerCase()))
  const candidates = userGuides.filter(g => !masterNames.has(g.plantName.trim().toLowerCase()))

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Master-guides</h1>
          <p className="text-sm text-muted-foreground">
            Globale dyrkningsguides synlige for alle brugere. Brugerne kan ikke ændre i dem.
          </p>
        </div>
        <MasterGuideForm />
      </div>

      {candidates.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <p className="font-medium text-foreground">
                {candidates.length} ny{candidates.length === 1 ? '' : 'e'} bruger-guide{candidates.length === 1 ? '' : 'r'} uden tilsvarende master
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Brugere har genereret disse guides — typisk via ny frø/plante. Klik for at oprette en master baseret på dem.
            </p>
            <div className="space-y-2">
              {candidates.slice(0, 8).map(c => <CandidateRow key={c.id} candidate={c} />)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg text-foreground">Masters</p>
            <span className="text-xs text-muted-foreground">{masters.length} guide{masters.length === 1 ? '' : 's'}</span>
          </div>

          {masters.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Ingen master-guides endnu. Klik "Ny master-guide" for at oprette din første.
            </p>
          ) : (
            <div className="space-y-2">
              {masters.map(m => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{m.plantName}</p>
                      {m.variety && <span className="text-xs text-muted-foreground">· {m.variety}</span>}
                      <Badge variant="outline" className="text-[10px]">
                        {PRIMARY_CATEGORIES[m.primaryCategoryId]?.name ?? m.primaryCategoryId}
                      </Badge>
                    </div>
                    {m.summary && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{m.summary}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">Opdateret {venligDato(m.updatedAt)}</p>
                  </div>
                  <MasterGuideForm guide={m} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CandidateRow({ candidate }: { candidate: AdminGuideRow }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground">{candidate.plantName}</p>
          {candidate.variety && <span className="text-xs text-muted-foreground">· {candidate.variety}</span>}
          {candidate.isAiGenerated && <Badge variant="outline" className="text-[10px]">AI-genereret</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {candidate.ownerLabel ? `Oprettet af ${candidate.ownerLabel}` : 'Bruger-ejet'} · {venligDato(candidate.createdAt)}
        </p>
        {candidate.summary && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{candidate.summary}</p>
        )}
      </div>
      <MasterGuideForm
        triggerLabel="Lav master"
        prefill={{
          plantName: candidate.plantName,
          variety: candidate.variety,
          latinName: candidate.latinName,
          primaryCategoryId: candidate.primaryCategoryId,
          summary: candidate.summary,
          difficulty: candidate.difficulty,
          tags: candidate.tags,
          quickFacts: candidate.quickFacts,
          sections: candidate.sections,
          calendarRules: candidate.calendarRules,
          sourceLinks: candidate.sourceLinks,
        }}
      />
    </div>
  )
}
