'use client'

import { createSeedsBatch } from '@/actions/inventory'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import type { PlantGuide } from '@/lib/types'
import { FileSpreadsheet, Camera, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { SeedFileUpload } from './seed-file-upload'
import { SeedImageUpload } from './seed-image-upload'
import { SeedBulkReview, matchGuide, type ParsedSeed } from './seed-bulk-review'

type Step = 'choose' | 'file' | 'image' | 'review' | 'done'

interface SeedUploadDialogProps {
  open: boolean
  onClose: () => void
  guides: PlantGuide[]
}

export function SeedUploadDialog({ open, onClose, guides }: SeedUploadDialogProps) {
  const [step, setStep] = useState<Step>('choose')
  const [seeds, setSeeds] = useState<ParsedSeed[]>([])
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setStep('choose')
    setSeeds([])
    setSaving(false)
    setSavedCount(0)
    setError(null)
    onClose()
  }

  function handleFileParsed(parsed: ParsedSeed[]) {
    setSeeds(parsed)
    setStep('review')
  }

  function handleImageExtracted(seed: ParsedSeed) {
    // Auto-match guide
    const guide = matchGuide(seed.name, guides)
    if (guide) {
      seed.guide_id = guide.id
    }
    setSeeds((prev) => [...prev, seed])
    setStep('review')
  }

  async function handleSave(seedsToSave: ParsedSeed[]) {
    setSaving(true)
    setError(null)

    const result = await createSeedsBatch(seedsToSave)

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSavedCount(result.count ?? seedsToSave.length)
    setSaving(false)
    setStep('done')
  }

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-lg">
      {step === 'choose' && (
        <>
          <DialogTitle>Upload frø</DialogTitle>
          <p className="text-sm text-muted-foreground mb-4">
            Vælg hvordan du vil tilføje frø til din beholdning.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStep('file')}
              className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <span className="font-medium text-sm">Upload Excel/CSV</span>
              <span className="text-xs text-muted-foreground text-center">
                Importér mange frø på én gang fra en fil
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStep('image')}
              className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              <Camera className="h-8 w-8 text-primary" />
              <span className="font-medium text-sm">Tag billede af frøpose</span>
              <span className="text-xs text-muted-foreground text-center">
                AI analyserer posen og udtrækker frødata
              </span>
            </button>
          </div>
        </>
      )}

      {step === 'file' && (
        <>
          <DialogTitle>Upload fil</DialogTitle>
          <SeedFileUpload
            onParsed={handleFileParsed}
            onBack={() => setStep('choose')}
            guides={guides}
          />
        </>
      )}

      {step === 'image' && (
        <>
          <DialogTitle>Scan frøpose</DialogTitle>
          <SeedImageUpload
            onExtracted={handleImageExtracted}
            onBack={() => {
              setStep('choose')
              setSeeds([])
            }}
          />
        </>
      )}

      {step === 'review' && (
        <>
          <DialogTitle>Gennemse frø</DialogTitle>
          {error && (
            <p className="text-sm text-destructive mb-2">{error}</p>
          )}
          <SeedBulkReview
            seeds={seeds}
            guides={guides}
            onSave={handleSave}
            onBack={() => {
              setStep('choose')
              setSeeds([])
            }}
            onAddMore={() => setStep('image')}
            addMoreLabel="Scan endnu en pose"
            saving={saving}
          />
        </>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle className="h-12 w-12 text-primary" />
          <p className="font-medium text-lg">
            {savedCount} frø tilføjet!
          </p>
          <p className="text-sm text-muted-foreground">
            Dine frø er nu tilføjet til beholdningen.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Luk
          </button>
        </div>
      )}
    </Dialog>
  )
}
