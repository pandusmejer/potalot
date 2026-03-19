'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SeedForm } from '@/components/inventory/seed-form'
import { SeedUploadDialog } from '@/components/inventory/seed-upload-dialog'
import { SEED_STATUSES } from '@/lib/constants'
import type { Seed, PlantGuide } from '@/lib/types'
import { Package, Plus, Upload } from 'lucide-react'
import { useState } from 'react'

interface SeedBankProps {
  seeds: Seed[]
  guides: PlantGuide[]
}

export function SeedBank({ seeds, guides }: SeedBankProps) {
  const [seedFormOpen, setSeedFormOpen] = useState(false)
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1" />
        <Button size="sm" variant="secondary" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
        <Button size="sm" onClick={() => setSeedFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nyt frø
        </Button>
      </div>

      {seeds.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="Ingen frø endnu"
          description="Tilføj dine frø for at holde styr på din frøbank."
          action={<Button size="sm" onClick={() => setSeedFormOpen(true)}>Tilføj frø</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {seeds.map((seed) => {
            const statusMeta = SEED_STATUSES[seed.status as keyof typeof SEED_STATUSES]
            return (
              <Card
                key={seed.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => { setEditingSeed(seed); setSeedFormOpen(true) }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{seed.name}</p>
                    {seed.variety && <p className="text-xs text-muted-foreground">{seed.variety}</p>}
                  </div>
                  {statusMeta && <Badge className={statusMeta.color}>{statusMeta.label}</Badge>}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {seed.quantity != null && <span>{seed.quantity} stk</span>}
                  {seed.brand && <span>{seed.brand}</span>}
                  {seed.year_purchased && <span>Købt {seed.year_purchased}</span>}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <SeedForm
        open={seedFormOpen}
        onClose={() => { setSeedFormOpen(false); setEditingSeed(null) }}
        seed={editingSeed}
        guides={guides}
      />
      <SeedUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        guides={guides}
      />
    </div>
  )
}
