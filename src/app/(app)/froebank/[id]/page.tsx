import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FavoritePinButtons } from '@/components/froebank/favorite-pin-buttons'
import { DeleteInventoryButton } from '@/components/froebank/delete-button'
import { getInventoryItem } from '@/actions/froebank'
import { MOCK_PLANTS, MOCK_GUIDES } from '@/lib/mock-data'
import {
  PRIMARY_CATEGORIES, INVENTORY_STATUS_META, MONTHS_DA,
  LIGHT_META, WATER_META, GROWING_LOCATION_META, SYSTEM_SUBCATEGORIES,
} from '@/lib/constants'
import { formatDatoMedAar } from '@/lib/datetime'
import {
  ArrowLeft, Package, Calendar, BookOpen, Sprout, ArrowRight,
  Sparkles, MapPin, Droplets, Sun, Ruler, ArrowDown, ExternalLink,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function InventoryDetailPage({ params }: Props) {
  const { id } = await params
  const item = await getInventoryItem(id)
  if (!item) notFound()

  // TODO (database): Mine planter og Guides skal også migreres til Supabase
  const linkedPlants = MOCK_PLANTS.filter(p => p.sourceElementId === item.id)
  const guide = item.guideId ? MOCK_GUIDES.find(g => g.id === item.guideId) : null

  const cat = PRIMARY_CATEGORIES[item.primaryCategoryId]
  const subcat = SYSTEM_SUBCATEGORIES.find(s => s.id === item.subcategoryId)
  const statusMeta = INVENTORY_STATUS_META[item.status]
  const lightMeta = item.light ? LIGHT_META[item.light] : null
  const waterMeta = item.water ? WATER_META[item.water] : null
  const CatIcon = ((LucideIcons as unknown) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[cat.icon] ?? Package

  return (
    <article className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/froebank" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CatIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {cat.name}{subcat && ` · ${subcat.name}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground truncate">
            {item.name}
          </h1>
          {item.variety && (
            <p className="text-sm italic text-muted-foreground truncate">{item.variety}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FavoritePinButtons
            id={item.id}
            isFavorite={item.isFavorite}
            isPinned={item.isPinned}
          />
          <Badge variant={(statusMeta.badgeVariant as 'muted' | 'info' | 'success' | 'warning' | 'outline') ?? 'muted'}>
            {statusMeta.label}
          </Badge>
        </div>
      </div>

      {/* Hovedhandlinger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button asChild variant="default">
          <Link href={`/mine-planter?fromInventory=${item.id}`}>
            <Sprout className="h-4 w-4" />
            Så et frø
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="#">
            <Calendar className="h-4 w-4" />
            Opret opgave
          </Link>
        </Button>
        {guide && (
          <Button asChild variant="outline">
            <Link href={`/guides/${guide.id}`}>
              <BookOpen className="h-4 w-4" />
              Se guide
            </Link>
          </Button>
        )}
        <Button variant="outline" disabled>
          <Sparkles className="h-4 w-4" />
          Spørg AI
        </Button>
      </div>

      {/* Hurtige fakta */}
      <Card>
        <CardHeader>
          <CardTitle>Dyrkningsfakta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Fact label="Sås" value={formatMonths(item.sowingMonths)} icon={<Calendar className="h-3.5 w-3.5" />} />
          <Fact
            label="Sådybde"
            value={item.sowingDepthMm === 0 ? '0 mm (overflade)' : `${item.sowingDepthMm} mm`}
            icon={<ArrowDown className="h-3.5 w-3.5" />}
          />
          <Fact
            label="Forspiring"
            value={item.preCultivation == null ? '—' : item.preCultivation ? 'Ja' : 'Nej'}
          />
          <Fact label="Plant ud" value={formatMonths(item.plantingOutMonths)} />
          <Fact label="Høst" value={formatMonths(item.harvestMonths)} />
          {lightMeta && <Fact label="Lys" value={lightMeta.label} icon={<Sun className="h-3.5 w-3.5" />} />}
          {waterMeta && <Fact label="Vand" value={waterMeta.label} icon={<Droplets className="h-3.5 w-3.5" />} />}
          {item.soil && <Fact label="Jord" value={item.soil} />}
          {item.germinationTemperature && <Fact label="Spiretemp" value={item.germinationTemperature} />}
          {item.germinationDays && <Fact label="Spiretid" value={`${item.germinationDays} dage`} />}
          {item.plantSpacing && <Fact label="Afstand" value={item.plantSpacing} icon={<Ruler className="h-3.5 w-3.5" />} />}
          {item.rowSpacing && <Fact label="Rækkeafstand" value={item.rowSpacing} />}
        </CardContent>
      </Card>

      {/* Dyrkningssted */}
      {item.growingLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Dyrkningssted
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {item.growingLocations.map(loc => {
              const meta = GROWING_LOCATION_META[loc]
              return (
                <Badge key={loc} variant="outline">{meta.label}</Badge>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Basis-info */}
      <Card>
        <CardHeader>
          <CardTitle>Detaljer</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {item.supplier && <Fact label="Leverandør" value={item.supplier} />}
          {item.quantity != null && <Fact label="Antal" value={`${item.quantity} stk`} />}
          {item.purchaseDate && <Fact label="Indkøbsdato" value={formatDatoMedAar(item.purchaseDate)} />}
          {item.expiryDate && <Fact label="Udløber" value={formatDatoMedAar(item.expiryDate)} />}
        </CardContent>
        {item.notes && (
          <CardContent>
            <p className="text-sm text-foreground/80 italic border-t border-border pt-3">
              {item.notes}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Linkede planter */}
      {linkedPlants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary" />
              Aktive dyrkninger fra dette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedPlants.map(p => (
              <Link
                key={p.id}
                href={`/mine-planter/${p.id}`}
                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-accent/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    {p.name}{p.variety ? ` — ${p.variety}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.sowDate && `Sået ${formatDatoMedAar(p.sowDate)}`}
                    {p.location && ` · ${p.location}`}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Linket guide */}
      {guide && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Dyrkningsguide
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/guides/${guide.id}`}>
                Åbn <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">{guide.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Slet */}
      <div className="flex justify-end pt-4">
        <DeleteInventoryButton id={item.id} name={item.name} />
      </div>
    </article>
  )
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm text-foreground font-medium">{value || '—'}</span>
    </div>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return '—'
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].full
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
