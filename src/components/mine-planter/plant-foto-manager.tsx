'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { updatePlantPhotos } from '@/actions/mine-planter'

const sans = 'var(--font-manrope)'

interface Props {
  plantId: string
  initialImages: string[]
  initialPrimary: string | null
}

/**
 * PLANTENS BILLEDER — brugerens egne fotos af DENNE plante, med tilføj/skift
 * efter oprettelsen.
 *
 * Fyldte hullet (Anna 16/7): kun manuelt oprettede planter havde et foto-felt
 * ved oprettelsen. En plante sået fra frøbanken eller oprettet via fritekst-
 * onboarding kunne ikke få et rigtigt plantefoto SENERE. Nu kan enhver plante
 * få (og skifte) sine billeder når som helst.
 *
 * Genbruger den manuelle oprettelses upload-komponent (folder 'planter') og
 * gemmer på selve planten, så det primære foto slår igennem på plantekort-
 * heroen efter refresh. Gemmer optimistisk på hver ændring — ingen ekstra
 * "Gem"-knap, ligesom man forventer af et fotogalleri.
 */
export function PlantFotoManager({ plantId, initialImages, initialPrimary }: Props) {
  const router = useRouter()
  const [images, setImages] = useState<string[]>(initialImages)
  const [primary, setPrimary] = useState<string | null>(initialPrimary ?? initialImages[0] ?? null)
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function persist(urls: string[], prim: string | null) {
    // Optimistisk: vis ændringen straks, gem i baggrunden.
    setImages(urls)
    setPrimary(prim)
    setError(null)
    startSaving(async () => {
      const res = await updatePlantPhotos(plantId, { imageUrls: urls, primaryImageUrl: prim })
      if ('error' in res) {
        setError(res.error)
        return
      }
      // Opdatér server-komponenten, så plantekort-heroen viser det nye
      // primære foto.
      router.refresh()
    })
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(36,48,31,0.52)' }}
        >
          Billeder
        </h2>
        {saving && (
          <span
            className="flex items-center gap-1.5"
            style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: 'rgba(36,48,31,0.45)' }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Gemmer…
          </span>
        )}
      </div>

      <p className="mt-1" style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.4, color: 'rgba(36,48,31,0.5)' }}>
        Dine egne fotos af planten. Det første foto bruges som forsidebillede.
      </p>

      <div className="mt-4">
        <MultiImageUpload
          value={images}
          primary={primary}
          onChange={persist}
          folder="planter"
          maxImages={8}
          label="Tilføj billede"
        />
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </section>
  )
}
