import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { JoinGroupButton } from '@/components/grupper/join-group-button'
import { getDiscoverableGroups } from '@/actions/groups'
import { INTEREST_CATEGORIES, VISIBILITY_LABEL } from '@/lib/constants'
import { ArrowLeft, Compass, Globe, Lock, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ kategori?: string; q?: string }>
}

export default async function UdforskGrupperPage({ searchParams }: Props) {
  const { kategori, q } = await searchParams
  const groups = await getDiscoverableGroups({
    category: kategori || undefined,
    search: q || undefined,
  })

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/grupper" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Udforsk grupper</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Find interessegrupper for emner du dyrker eller drømmer om.
          </p>
        </div>
      </div>

      {/* Kategori-filtre */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/grupper/udforsk"
          className={`text-xs px-3 py-1.5 rounded-full border transition ${
            !kategori ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent/30'
          }`}
        >
          Alle
        </Link>
        {INTEREST_CATEGORIES.map(c => (
          <Link
            key={c.id}
            href={`/grupper/udforsk?kategori=${c.id}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              kategori === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent/30'
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-10 w-10" />}
          title="Ingen grupper matcher endnu"
          description={kategori
            ? 'Ingen interessegrupper i denne kategori. Opret den første!'
            : 'Der er endnu ingen offentlige interessegrupper. Opret den første!'}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(g => {
            const cat = INTEREST_CATEGORIES.find(c => c.id === g.category)
            return (
              <Card key={g.id} className="overflow-hidden">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/40 flex items-center justify-center shrink-0">
                      {g.visibility === 'open'
                        ? <Globe className="h-4 w-4 text-primary" />
                        : <Lock className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{g.name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {cat && <Badge variant="muted" className="text-[10px]">{cat.label}</Badge>}
                        <Badge
                          variant={g.visibility === 'open' ? 'success' : 'outline'}
                          className="text-[10px]"
                        >
                          {VISIBILITY_LABEL[g.visibility]}
                        </Badge>
                        <Badge variant="muted" className="text-[10px] gap-1">
                          <Users className="h-2.5 w-2.5" />
                          {g.memberCount}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {g.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{g.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/grupper/${g.id}`}>Se gruppe</Link>
                    </Button>
                    <JoinGroupButton
                      groupId={g.id}
                      visibility={g.visibility}
                      myRole={g.myRole}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
