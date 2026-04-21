export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEED_STATUSES } from '@/lib/constants'
import { SowButton } from '@/components/actions/sow-button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, BookOpen, Sprout, Package, Calendar, MapPin,
  ExternalLink, Wheat,
} from 'lucide-react'
import type { Seed, Variety, Placering, Plant } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SeedDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const { data: seed } = await supabase
    .from('seeds')
    .select(`
      *,
      guide:plant_guides(*),
      variety_ref:varieties(*)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle<Seed & { guide: { id: string; slug: string; name_da: string } | null, variety_ref: Variety | null }>()

  if (!seed) notFound()

  // Find alle planter dyrket fra denne frøpose
  const { data: plants } = await supabase
    .from('plants')
    .select('id, name, variety, livscyklus, sow_date')
    .eq('seed_id', id)
    .order('sow_date', { ascending: false })

  // Placeringer til SowButton
  const { data: placeringer } = await supabase
    .from('placeringer')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  // Varieties til SowButton
  const { data: varieties } = await supabase
    .from('varieties')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('species_name')

  const statusMeta = SEED_STATUSES[seed.status as keyof typeof SEED_STATUSES]
  const tilbage = seed.seeds_total != null
    ? (seed.seeds_total ?? 0) - (seed.seeds_sown ?? 0)
    : null

  return (
    <article className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/have">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif text-foreground truncate">
            {seed.name}
          </h1>
          {seed.variety && (
            <p className="text-sm text-muted-foreground italic font-serif">{seed.variety}</p>
          )}
          {seed.botanical_name && (
            <p className="text-xs text-muted-foreground italic mt-0.5">{seed.botanical_name}</p>
          )}
        </div>
        {statusMeta && <Badge className={statusMeta.color}>{statusMeta.label}</Badge>}
      </div>

      {/* Profil-billede hvis tilgængeligt */}
      {(seed.image_url || seed.variety_ref?.illustration_url) && (
        <div className="rounded-xl overflow-hidden border border-border bg-amber-50/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={seed.image_url ?? seed.variety_ref?.illustration_url ?? ''}
            alt={seed.name}
            className="w-full object-contain max-h-80"
          />
        </div>
      )}

      {/* Så et frø */}
      <Card>
        <CardHeader>
          <CardTitle>Hvad nu?</CardTitle>
        </CardHeader>
        <CardContent>
          {seed.status === 'depleted' ? (
            <p className="text-sm text-muted-foreground">
              Denne pose er opbrugt. Tid til at købe nye?
            </p>
          ) : seed.status === 'expired' ? (
            <p className="text-sm text-muted-foreground">
              Denne pose er udløbet — spireevnen kan være nedsat.
            </p>
          ) : (
            <div className="flex gap-2">
              <SowButton
                seeds={[seed as Seed]}
                varieties={(varieties ?? []) as Variety[]}
                placeringer={(placeringer ?? []) as Placering[]}
                label={`Så fra denne pose${tilbage != null ? ` (${tilbage} tilbage)` : ''}`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detaljer */}
      <Card>
        <CardHeader><CardTitle>Detaljer</CardTitle></CardHeader>
        <CardContent>
          <dl className="space-y-2.5 text-sm">
            {seed.brand && (
              <Row icon={<Package className="h-3.5 w-3.5" />} label="Mærke / leverandør" value={seed.brand} />
            )}
            {tilbage != null && (
              <Row
                icon={<Wheat className="h-3.5 w-3.5" />}
                label="Antal"
                value={`${tilbage} af ${seed.seeds_total} tilbage${(seed.seeds_sown ?? 0) > 0 ? ` (${seed.seeds_sown} sået)` : ''}`}
              />
            )}
            {seed.year_purchased && (
              <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Købsår" value={String(seed.year_purchased)} />
            )}
            {seed.expiry_date && (
              <Row
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Udløber"
                value={new Date(seed.expiry_date).toLocaleDateString('da-DK')}
              />
            )}
            {seed.location && (
              <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Lokation" value={seed.location} />
            )}
            {seed.germination_rate != null && (
              <Row icon={<Sprout className="h-3.5 w-3.5" />} label="Spireprocent" value={`${seed.germination_rate}%`} />
            )}
            {seed.plant_type && (
              <Row icon={null} label="Type" value={seed.plant_type} />
            )}
            {seed.purchase_url && (
              <div className="pt-1">
                <Link
                  href={seed.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Købt her
                </Link>
              </div>
            )}
          </dl>
          {seed.notes && (
            <p className="mt-4 text-sm text-foreground/80 italic border-t border-border pt-3">
              {seed.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Planter fra denne pose */}
      {plants && plants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-4 w-4" />
              Planter dyrket herfra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plants.map((p: Pick<Plant, 'id' | 'name' | 'variety' | 'livscyklus' | 'sow_date'>) => (
                <Link
                  key={p.id}
                  href={`/vaekst/${p.id}`}
                  className="flex items-center gap-3 py-1.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <Sprout className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {p.name}{p.variety ? ` — ${p.variety}` : ''}
                    </p>
                    {p.sow_date && (
                      <p className="text-xs text-muted-foreground">
                        Sået {new Date(p.sow_date).toLocaleDateString('da-DK')}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    {p.livscyklus}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guide-link */}
      {seed.guide && (
        <Card>
          <CardContent className="flex items-center gap-3 py-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{seed.guide.name_da}</p>
              <p className="text-xs text-muted-foreground">Dyrkningsguide</p>
            </div>
            <Link href={`/guides/${seed.guide.slug}`}>
              <Button size="sm" variant="secondary">Se guide</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </article>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      {!icon && <span className="w-3.5" />}
      <dt className="text-muted-foreground w-32 shrink-0">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}
