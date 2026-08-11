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
import type { PlantLog, PlantLogType, HealthValue } from '@/lib/types'
import { idag } from '@/lib/datetime'
import { createPlantLog, updatePlantLog } from '@/actions/mine-planter'
import { deleteImage } from '@/actions/storage'
import { HEALTH_OPTIONS, PLANT_LOG_LABEL } from '@/lib/plant-log-meta'
import { GartnerSvarPanel, useGartner } from '@/components/ai/gartner-svar'

// Rækkefølge i dropdownen. Labels kommer fra den DELTE PLANT_LOG_LABEL (samme
// kilde som historikken bruger), så formular og tidslinje aldrig kan sige to
// forskellige ord for samme type (Anna 16/7).
const TYPE_ORDER: PlantLogType[] = [
  'note', 'health', 'height_measurement', 'watering', 'fertilizing',
  'pruning', 'pest_disease', 'harvest', 'germination', 'repotting', 'planting_out',
]

interface Props {
  plantId: string
  /** Hvis sat: edit-mode. Felterne forudfyldes fra logget og 'Gem' opdaterer i stedet for at oprette. */
  log?: PlantLog
  /** Custom trigger (fx en lille pencil-knap i timeline). Default er stor "Log nyt på planten"-knap. */
  trigger?: React.ReactNode
  /** Start-type — bruges når feltet åbnes direkte fra fx "Højde"-feltet på kortet. */
  defaultType?: PlantLogType
}

/**
 * Log-form til at oprette/redigere en dyrkningslog.
 */
export function LogForm({ plantId, log, trigger, defaultType }: Props) {
  // Gartneren i logflowet (Anna 8/8): registrerer brugeren et PROBLEM
  // (skadedyr/sygdom, eller trivsel = kræver opmærksomhed), tilbyder
  // formularen selv Gartnerens vurdering — gem én gang, så gemmes loggen
  // OG vurderingen streames ind i samme dialog. Aldrig automatisk:
  // tilvalget er altid fravalgt som udgangspunkt.
  const gartner = useGartner()
  const [gartnerOensket, setGartnerOensket] = useState(false)
  const [viserVurdering, setViserVurdering] = useState(false)
  const router = useRouter()
  const isEdit = !!log
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<PlantLogType>(log?.type ?? defaultType ?? 'note')
  const [date, setDate] = useState(log?.date ?? idag())
  const [title, setTitle] = useState(log?.title ?? '')
  const [note, setNote] = useState(log?.note ?? '')
  const [images, setImages] = useState<string[]>(log?.imageIds ?? [])
  const [health, setHealth] = useState<HealthValue | null>(
    (log?.type === 'health' ? (log.valueText as HealthValue) : null) ?? null,
  )
  const [heightCm, setHeightCm] = useState<string>(
    log?.type === 'height_measurement' && log.valueNumeric != null ? String(log.valueNumeric) : '',
  )

  // Særligt valg i dropdownen (Anna 8/8: plantesiden har ÉN primær indgang;
  // den generelle Gartner bor HER som mulighed, ikke som egen CTA ved heroen).
  const [gartnerValgt, setGartnerValgt] = useState(false)

  const isHealth = type === 'health'
  const isHeight = type === 'height_measurement'
  const erProblem = !isEdit && (type === 'pest_disease' || (isHealth && health === 'attention'))

  function reset() {
    if (isEdit && log) {
      setTitle(log.title ?? '')
      setNote(log.note ?? '')
      setType(log.type)
      setDate(log.date)
      setImages(log.imageIds)
      setHealth(log.type === 'health' ? (log.valueText as HealthValue) : null)
      setHeightCm(log.type === 'height_measurement' && log.valueNumeric != null ? String(log.valueNumeric) : '')
    } else {
      setTitle('')
      setNote('')
      setType(defaultType ?? 'note')
      setDate(idag())
      setImages([])
      setHealth(null)
      setHeightCm('')
    }
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Ved create-mode: ryd uploadede billeder der ikke blev gemt — men IKKE
      // når loggen faktisk blev gemt og vi blot viser vurderingen.
      if (!isEdit && !viserVurdering) {
        images.forEach(url => { deleteImage(url).catch(() => {}) })
      }
      reset()
      setGartnerOensket(false)
      setGartnerValgt(false)
      setViserVurdering(false)
      gartner.nulstil()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (gartnerValgt) {
      // Generel vurdering — ingen logpost oprettes, intet problem opfindes.
      setViserVurdering(true)
      gartner.spoerg('', { plantId, intent: 'general' })
      return
    }

    // Validér de to måletyper — de skal have en værdi.
    if (isHealth && !health) { setError('Vælg hvordan planten trives.'); return }
    let heightValue: number | null = null
    if (isHeight) {
      heightValue = parseFloat(heightCm.replace(',', '.'))
      if (Number.isNaN(heightValue) || heightValue <= 0) {
        setError('Angiv en højde i cm (fx 24).'); return
      }
    }

    startTransition(async () => {
      const payload = {
        date,
        type,
        // Titel giver ikke mening for trivsel/højde — værdien er overskriften.
        title: isHealth || isHeight ? undefined : (title.trim() || undefined),
        note: note.trim() || undefined,
        imageUrls: images.length > 0 ? images : undefined,
        valueNumeric: isHeight ? heightValue : null,
        valueText: isHealth ? health : null,
      }

      const res = isEdit && log
        ? await updatePlantLog({ logId: log.id, ...payload })
        : await createPlantLog({ plantId, ...payload })

      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
      if (!isEdit && erProblem && gartnerOensket && 'id' in res) {
        // Én sammenhængende handling: loggen er gemt — vurderingen streames
        // nu ind i samme dialog, koblet til den nye logpost.
        setViserVurdering(true)
        gartner.spoerg('', { plantId, logId: res.id, intent: 'problem' })
        return
      }
      setOpen(false)
      if (!isEdit) reset()
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
              Log nyt på planten
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent>
        {viserVurdering ? (
          <>
            <DialogTitle>{gartnerValgt ? 'Gartnerens vurdering' : 'Gemt. Gartneren ser på det …'}</DialogTitle>
            <DialogDescription>
              {gartnerValgt
                ? 'Gartneren tager udgangspunkt i sort, alder, sted og det, du tidligere har logget.'
                : 'Din registrering er gemt i Plantens historie. Her er Gartnerens vurdering.'}
            </DialogDescription>
            <GartnerSvarPanel
              tilstand={gartner.tilstand}
              svar={gartner.svar}
              plantId={plantId}
              intent={gartnerValgt ? 'general' : 'problem'}
              // Gem-titlen bærer problemets egne ord ("Lus på blade") — et
              // gemt kort må aldrig være anonymt (Annas regel 10/8).
              question={gartnerValgt
                ? 'Vurdering af planten'
                : (title.trim() || PLANT_LOG_LABEL[type])}
              fraLog={!gartnerValgt}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Luk
              </Button>
            </DialogFooter>
          </>
        ) : (
        <>
        <DialogTitle>{isEdit ? 'Redigér log' : 'Tilføj til log'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Ret detaljerne i loggen. Ændringerne vises også i Plantens historie.'
            : 'Skriv en observation eller registrér en handling.'}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={gartnerValgt ? '__gartner' : type}
                onChange={e => {
                  if (e.target.value === '__gartner') { setGartnerValgt(true); return }
                  setGartnerValgt(false)
                  setType(e.target.value as PlantLogType)
                }}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {TYPE_ORDER.map(t => (
                  <option key={t} value={t}>{PLANT_LOG_LABEL[t]}</option>
                ))}
                {!isEdit && (
                  <optgroup label="Gartneren">
                    <option value="__gartner">Få en vurdering af planten</option>
                  </optgroup>
                )}
              </select>
            </div>
            {!gartnerValgt && (
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
            )}
          </div>

          {gartnerValgt ? (
            <p className="text-sm" style={{ color: 'rgba(36,48,31,0.65)' }}>
              Gartneren vurderer planten ud fra sort, alder, sted og det, du
              tidligere har logget. Du behøver ikke udfylde mere.
            </p>
          ) : isHealth ? (
            <div>
              <Label>Hvordan trives planten?</Label>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {HEALTH_OPTIONS.map(o => {
                  const active = health === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setHealth(o.value)}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-input bg-card text-muted-foreground hover:bg-muted'
                      }`}
                      aria-pressed={active}
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: o.value === 'good' ? '#5A7038' : o.value === 'okay' ? '#C89A35' : '#B04E38' }}
                      />
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : isHeight ? (
            <div>
              <Label htmlFor="log-height">Højde</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="log-height"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  placeholder="fx 24"
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">cm</span>
              </div>
            </div>
          ) : (
            <div>
              <Label>Titel (valgfri)</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="fx Bladene blev gule"
                className="mt-1.5"
              />
            </div>
          )}

          {!gartnerValgt && (
          <div>
            <Label>Note{isHealth || isHeight ? ' (valgfri)' : ''}</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Skriv, hvad du observerede eller gjorde …"
              rows={3}
              className="mt-1.5"
            />
          </div>
          )}

          {!gartnerValgt && (
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
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {erProblem && (
            <div
              style={{
                background: 'rgba(232, 236, 218, 0.45)',
                border: '1px solid rgba(86, 111, 60, 0.22)',
                borderRadius: 14,
                padding: '12px 14px',
              }}
            >
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={gartnerOensket}
                  onChange={e => setGartnerOensket(e.target.checked)}
                  className="mt-0.5 accent-[#4E6138]"
                />
                <span>
                  <span className="block text-sm font-semibold" style={{ color: '#3D4A2C' }}>
                    Få Gartnerens vurdering, når du gemmer
                  </span>
                  <span className="mt-0.5 block text-xs" style={{ color: 'rgba(36,48,31,0.6)' }}>
                    Gartneren bruger det, du har skrevet, sammen med det, Potalot
                    allerede ved om planten.
                  </span>
                </span>
              </label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Annullér
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : gartnerValgt ? 'Få vurdering' : isEdit ? 'Gem ændringer' : erProblem && gartnerOensket ? 'Gem og få vurdering' : 'Gem'}
            </Button>
          </DialogFooter>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  )
}
