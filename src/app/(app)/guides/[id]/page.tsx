import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuickFactsCard } from '@/components/guides/quick-facts'
import { FloraDanicaImage } from '@/components/guides/flora-danica-image'
import { mergeGuide } from '@/lib/guide-merge'
import { MOCK_GUIDES, MOCK_INVENTORY, MOCK_PLANTS } from '@/lib/mock-data'
import { PRIMARY_CATEGORIES } from '@/lib/constants'
import {
  ArrowLeft, BookOpen, Sparkles, Package, Sprout, ArrowRight,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

// TODO (database): Supabase
export default async function GuideDetailPage({ params }: Props) {
  const { id } = await params
  const original = MOCK_GUIDES.find(g => g.id === id)
  if (!original) notFound()

  // Merge med parent hvis sortsguide
  const { effective, inheritedFromParent, parent } = mergeGuide(original, MOCK_GUIDES)

  // Sortsvarianter af denne arts-guide
  const sortsvarianter = original.guideLevel === 'species'
    ? MOCK_GUIDES.filter(g => g.parentGuideId === original.id)
    : []

  // Linkede frøbank-elementer + planter
  const linkedInventory = MOCK_INVENTORY.filter(i =>
    i.guideId === effective.id || i.guideId === parent?.id
  )
  const linkedPlants = MOCK_PLANTS.filter(p =>
    p.guideId === effective.id || p.guideId === parent?.id
  )

  const cat = PRIMARY_CATEGORIES[effective.primaryCategoryId]

  return (
    <article className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/guides" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {cat.name}
              {original.guideLevel === 'variety' && parent && ' · sortsvariant'}
              {original.guideLevel === 'species' && ' · artsguide'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground truncate">
            {effective.plantName}
          </h1>
          {effective.variety && (
            <p className="text-sm italic text-muted-foreground truncate">{effective.variety}</p>
          )}
          {effective.latinName && (
            <p className="text-xs italic text-muted-foreground/80 truncate">{effective.latinName}</p>
          )}
        </div>
      </div>

      {/* Flora Danica-illustration */}
      <FloraDanicaImage
        plantName={effective.plantName}
        variety={effective.variety}
        latinName={effective.latinName}
      />

      {/* Hvis sortsguide: link tilbage til artsguide */}
      {parent && (
        <Card className="bg-secondary/30 border-secondary">
          <CardContent className="flex items-center gap-3 py-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-sm flex-1">
              Sortsvariant af <strong>{parent.plantName}</strong>. Felter uden override arves fra arts-guiden.
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/guides/${parent.id}`}>
                Se artsguide <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hurtigt overblik */}
      <QuickFactsCard guide={effective} inheritedFields={inheritedFromParent} />

      {/* Detaljerede sektioner */}
      {effective.sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detaljeret guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {effective.sections.map(section => (
              <section key={section.key}>
                <h3 className="font-serif text-lg text-foreground mb-2">{section.title}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </section>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sortsvarianter */}
      {sortsvarianter.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sortsvarianter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortsvarianter.map(v => (
              <Link
                key={v.id}
                href={`/guides/${v.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30"
              >
                <div>
                  <p className="font-medium text-foreground">{v.variety}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{v.summary}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dine elementer / planter */}
      {(linkedInventory.length > 0 || linkedPlants.length > 0) && (
        <Card className="bg-secondary/20 border-secondary">
          <CardHeader>
            <CardTitle>Dine egne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {linkedInventory.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  I din frøbank
                </p>
                <div className="space-y-1.5">
                  {linkedInventory.map(item => (
                    <Link
                      key={item.id}
                      href={`/froebank/${item.id}`}
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.name}{item.variety ? ` — ${item.variety}` : ''}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {linkedPlants.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Aktive dyrkninger
                </p>
                <div className="space-y-1.5">
                  {linkedPlants.map(plant => (
                    <Link
                      key={plant.id}
                      href={`/mine-planter/${plant.id}`}
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <Sprout className="h-3.5 w-3.5 text-muted-foreground" />
                      {plant.name}{plant.variety ? ` — ${plant.variety}` : ''}
                      {plant.isArchived && plant.archivedYear && (
                        <Badge variant="muted" className="text-[9px]">
                          Arkiv {plant.archivedYear}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI-rådgiver */}
      <Card className="bg-gradient-to-br from-secondary/30 to-card">
        <CardContent className="flex items-center gap-3 py-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Spørg AI om denne plante</p>
            <p className="text-xs text-muted-foreground">
              Få svar baseret på guiden, din frøbank og log-historik.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            Spørg (TODO AI)
          </Button>
        </CardContent>
      </Card>
    </article>
  )
}
