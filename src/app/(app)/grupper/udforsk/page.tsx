import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { JoinGroupButton } from '@/components/grupper/join-group-button'
import { getDiscoverableGroups } from '@/actions/groups'
import { TAG_AXES, TAG_LABEL_BY_ID, VISIBILITY_LABEL } from '@/lib/constants'
import { ArrowLeft, Compass, Globe, Lock, Users, Sprout } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ tags?: string | string[]; plante?: string; q?: string }>
}

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : v.split(',').filter(Boolean)
}

function buildHref(base: string, params: Record<string, string | string[] | null>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    if (Array.isArray(v)) {
      if (v.length > 0) usp.set(k, v.join(','))
    } else if (v) {
      usp.set(k, v)
    }
  }
  const qs = usp.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function UdforskGrupperPage({ searchParams }: Props) {
  const sp = await searchParams
  const selectedTags = toArray(sp.tags)
  const focusPlant = sp.plante?.trim() || ''
  const search = sp.q?.trim() || ''

  const groups = await getDiscoverableGroups({
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    focusPlant: focusPlant || undefined,
    search: search || undefined,
  })

  function toggleTagHref(tagId: string): string {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId]
    return buildHref('/grupper/udforsk', { tags: next, plante: focusPlant, q: search })
  }

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
            Find interessegrupper for emner og planter du dyrker eller drømmer om.
          </p>
        </div>
      </div>

      {/* Plante-søgning */}
      <form action="/grupper/udforsk" method="get" className="flex gap-2 items-center">
        <Sprout className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          name="plante"
          defaultValue={focusPlant}
          placeholder="Find grupper med fokus på en bestemt plante (fx Chili, Æbletræ)…"
          className="flex-1"
        />
        {/* Bevarer eksisterende tag-filtre når man søger */}
        {selectedTags.length > 0 && <input type="hidden" name="tags" value={selectedTags.join(',')} />}
        <Button type="submit" variant="outline" size="sm">Søg</Button>
        {focusPlant && (
          <Button asChild variant="ghost" size="sm">
            <Link href={buildHref('/grupper/udforsk', { tags: selectedTags, plante: null, q: search })}>
              Ryd
            </Link>
          </Button>
        )}
      </form>

      {/* Tag-filtre per akse */}
      <div className="space-y-2">
        {TAG_AXES.map(axis => (
          <div key={axis.id}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{axis.label}</p>
            <div className="flex flex-wrap gap-1">
              {axis.tags.map(t => {
                const active = selectedTags.includes(t.id)
                return (
                  <Link
                    key={t.id}
                    href={toggleTagHref(t.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      active ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent/30'
                    }`}
                  >
                    {t.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        {(selectedTags.length > 0 || focusPlant) && (
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/grupper/udforsk">Ryd alle filtre</Link>
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-10 w-10" />}
          title="Ingen grupper matcher endnu"
          description={selectedTags.length > 0 || focusPlant
            ? 'Justér eller fjern filtre — eller opret en ny gruppe der matcher.'
            : 'Der er endnu ingen offentlige interessegrupper. Opret den første!'}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(g => {
            const headlinePlant = g.focusPlants[0]
            const headlineTag = !headlinePlant && g.tags.length > 0 ? TAG_LABEL_BY_ID[g.tags[0]] : null
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
                        {headlinePlant && (
                          <Badge variant="success" className="text-[10px] gap-0.5">
                            <Sprout className="h-2.5 w-2.5" />
                            {headlinePlant}
                          </Badge>
                        )}
                        {headlineTag && (
                          <Badge variant="muted" className="text-[10px]">{headlineTag}</Badge>
                        )}
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
                      {(g.tags.length > 1 || g.focusPlants.length > 1) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {g.focusPlants.slice(headlinePlant ? 1 : 0).map(p => (
                            <span key={p} className="text-[10px] text-muted-foreground">· {p}</span>
                          ))}
                          {g.tags.slice(headlineTag ? 1 : 0, 4).map(t => (
                            <span key={t} className="text-[10px] text-muted-foreground">· {TAG_LABEL_BY_ID[t] ?? t}</span>
                          ))}
                        </div>
                      )}
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
