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
import { Plus, Pencil } from 'lucide-react'
import type { PlantLog, PlantLogType } from '@/lib/types'
import { idag } from '@/lib/datetime'
import { createPlantLog, updatePlantLog } from '@/actions/mine-planter'
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
  /** Hvis sat: edit-mode. Felterne forudfyldes fra logget og 'Gem' opdaterer i stedet for at oprette. */
  log?: PlantLog
  /** Custom trigger (fx en lille pencil-knap i timeline). Default er stor "Ny lognote"-knap. */
  trigger?: React.ReactNode
}

/**
 * Log-form til at oprette/redigere en dyrkningslog.
 */
export function LogForm({ plantId, log, trigger }: Props) {
  const router = useRouter()
  const isEdit = !!log
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<PlantLogType>(log?.type ?? 'note')
  const [date, setDate] = useState(log?.date ?? idag())
  const [title, setTitle] = useState(log?.title ?? '')
  const [note, setNote] = useState(log?.note ?? '')
  const [images, setImages] = useState<string[]>(log?.imageIds ?? [])

  function reset() {
    if (isEdit && log) {
      setTitle(log.title ?? '')
      setNote(log.note ?? '')
      setType(log.type)
      setDate(log.date)
      setImages(log.imageIds)
    } else {
      setTitle('')
      setNote('')
      setType('note')
      setDate(idag())
      setImages([])
    }
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Ved create-mode: ryd uploadede billeder der ikke blev gemt
      if (!isEdit) {
        images.forEach(url => { deleteImage(url).catch(() => {}) })
      }
      reset()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const payload = {
        date,
        type,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        imageUrls: images.length > 0 ? images : undefined,
      }

      const res = isEdit && log
        ? await updatePlantLog({ logId: log.id, ...payload })
        : await createPlantLog({ plantId, ...payload })

      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      if (!isEdit) reset()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          isEdit ? (
            <Button variant="ghost" size="sm" aria-label="Redigér log">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Ny lognote
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{isEdit ? 'Redigér log-event' : 'Tilføj til log'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Ret detaljerne. Ændringer påvirker historikken på din plante.'
            : 'Skriv en observation eller registrér en handling.'}
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
              {pending ? 'Gemmer…' : isEdit ? 'Gem ændringer' : 'Gem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
