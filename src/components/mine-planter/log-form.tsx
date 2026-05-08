'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { Plus } from 'lucide-react'
import type { PlantLogType } from '@/lib/types'
import { idag } from '@/lib/datetime'
import { createPlantLog } from '@/actions/mine-planter'
import { deleteImage } from '@/actions/storage'

const TYPE_OPTIONS: { value: PlantLogType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'watering', label: 'Vandet' },
  { value: 'fertilizing', label: 'Gødet' },
  { value: 'pruning', label: 'Beskåret' },
  { value: 'pest_disease', label: 'Skadedyr/sygdom' },
  { value: 'harvest', label: 'Høstet' },
  { value: 'germination', label: 'Spiret' },
  { value: 'repotting', label: 'Omplantet' },
  { value: 'planting_out', label: 'Udplantet' },
]

interface Props {
  plantId: string
}

/**
 * Log-form til at tilføje ny dyrkningslog på en plante.
 * TODO (database): Server action der gemmer til Supabase.
 */
export function LogForm({ plantId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<PlantLogType>('note')
  const [date, setDate] = useState(idag())
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [images, setImages] = useState<string[]>([])

  function reset() {
    setTitle('')
    setNote('')
    setType('note')
    setDate(idag())
    setImages([])
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Forladte uploads ryddes op så vi ikke efterlader forældreløse filer i Storage.
      images.forEach(url => { deleteImage(url).catch(() => {}) })
      reset()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await createPlantLog({
        plantId,
        date,
        type,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        imageUrls: images.length > 0 ? images : undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Ny lognote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Tilføj til log</DialogTitle>
        <DialogDescription>
          Skriv en observation eller registrér en handling.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={type}
                onChange={e => setType(e.target.value as PlantLogType)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Dato</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <div>
            <Label>Titel (valgfri)</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Fx. Bladene blev gule"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Note</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Skriv hvad du observerede eller gjorde…"
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Fotos</Label>
            <div className="mt-1.5">
              <MultiImageUpload
                value={images}
                primary={images[0] ?? null}
                onChange={(urls, prim) => {
                  // Logs har ikke et "primary"-koncept — vi fortolker stjernen som
                  // "flyt forrest" så rækkefølgen i image_urls afspejler valget.
                  if (prim && urls.includes(prim) && urls[0] !== prim) {
                    setImages([prim, ...urls.filter(u => u !== prim)])
                  } else {
                    setImages(urls)
                  }
                }}
                folder="log"
                maxImages={6}
                label="Tilføj foto"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Annullér
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : 'Gem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
