'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { Pencil, Wand2, Loader2, Link as LinkIcon, Check, X } from 'lucide-react'
import type { InventoryItem, PrimaryCategoryId } from '@/lib/types'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS, SYSTEM_SUBCATEGORIES, MONTHS_DA } from '@/lib/constants'
import { updateInventoryItem } from '@/actions/froebank'
import { extractSeedPacketFields, extractSeedFromUrl } from '@/actions/seed-packet-extract'
import { DyrkningsfaktaFields, type DyrkningsfaktaState } from '@/components/froebank/dyrkningsfakta-fields'
import { irrelevanteDyrkningsfelter } from '@/lib/froebank-feltrelevans'

interface Suggestion {
  key: string
  label: string
  current: string
  suggested: string
  apply: () => void
}

const LIGHT_LABEL: Record<NonNullable<DyrkningsfaktaState['light']>, string> = {
  full_sun: 'Fuld sol',
  partial_shade: 'Halvskygge',
  shade: 'Skygge',
}
const WATER_LABEL: Record<NonNullable<DyrkningsfaktaState['water']>, string> = {
  low: 'Lidt',
  regular: 'Regelmæssig',
  high: 'Meget',
}
/** null = ukendt, 0 = eksplicit overfladesåning — aldrig "0 mm". */
const saadybdeLabel = (mm: number | null | undefined): string =>
  mm == null ? '—' : mm === 0 ? 'Sås på overfladen' : `${mm} mm`
const monthsLabel = (months: number[]): string =>
  months.length === 0 ? '—' : months.map(m => MONTHS_DA.find(x => x.num === m)?.short ?? m).join(', ')
const arraysEqual = (a: number[], b: number[]): boolean =>
  a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',')

interface Props {
  item: InventoryItem
}

export function EditInventoryDialog({ item }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(item.name)
  const [latinName, setLatinName] = useState(item.latinName ?? '')
  const [variety, setVariety] = useState(item.variety ?? '')
  const [supplier, setSupplier] = useState(item.supplier ?? '')
  const [primaryCat, setPrimaryCat] = useState<PrimaryCategoryId>(item.primaryCategoryId)
  const [subcat, setSubcat] = useState(item.subcategoryId ?? '')
  const [seedCount, setSeedCount] = useState(item.seedCount?.toString() ?? '')
  const [quantity, setQuantity] = useState(item.quantity?.toString() ?? '')
  const [purchaseYear, setPurchaseYear] = useState(item.purchaseYear?.toString() ?? '')
  const [purchaseUrl, setPurchaseUrl] = useState(item.purchaseUrl ?? '')
  const [expiryDate, setExpiryDate] = useState(item.expiryDate ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [images, setImages] = useState<string[]>(item.imageIds.length > 0 ? item.imageIds : item.primaryImageId ? [item.primaryImageId] : [])
  const [primaryImage, setPrimaryImage] = useState<string | null>(item.primaryImageId ?? null)

  const [dyrkning, setDyrkning] = useState<DyrkningsfaktaState>({
    sowingMonths: item.sowingMonths ?? [],
    sowingDepthMm: item.sowingDepthMm ?? null,
    preCultivation: item.preCultivation ?? null,
    plantingOutMonths: item.plantingOutMonths ?? [],
    harvestMonths: item.harvestMonths ?? [],
    light: item.light ?? null,
    water: item.water ?? null,
    soil: item.soil ?? '',
    germinationDays: item.germinationDays ?? '',
    germinationTemperature: item.germinationTemperature ?? '',
    plantSpacing: item.plantSpacing ?? '',
    rowSpacing: item.rowSpacing ?? '',
  })

  const [aiPending, setAiPending] = useState(false)
  const [aiInfo, setAiInfo] = useState<string | null>(null)

  const [urlAiPending, setUrlAiPending] = useState(false)
  const [urlAiInfo, setUrlAiInfo] = useState<string | null>(null)
  const [urlAiError, setUrlAiError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const isFroe = primaryCat === 'fro'
  const tilgaengeligeSubs = SYSTEM_SUBCATEGORIES.filter(s => s.parentCategoryIds.includes(primaryCat))

  // Samme relevans som oprettelsen og detaljesiden. Følger name/variety, så
  // retter man arten i dialogen, flytter felterne med med det samme.
  const irrelevante = useMemo(
    () => irrelevanteDyrkningsfelter(name, variety, {
      preCultivation: dyrkning.preCultivation,
      plantingOutMonths: dyrkning.plantingOutMonths,
    }),
    [name, variety, dyrkning.preCultivation, dyrkning.plantingOutMonths],
  )

  async function handleReadWithAI() {
    if (images.length === 0) return
    setError(null)
    setAiInfo(null)
    setAiPending(true)
    try {
      const res = await extractSeedPacketFields(images)
      if ('error' in res) {
        setError('Kunne ikke læse billederne. Prøv igen.')
        return
      }
      const f = res.fields
      const filled: string[] = []
      if (!name.trim() && f.name)              { setName(f.name); filled.push('navn') }
      if (!latinName.trim() && f.latinName)    { setLatinName(f.latinName); filled.push('latinsk navn') }
      if (!variety.trim() && f.variety)        { setVariety(f.variety); filled.push('sort') }
      if (!supplier.trim() && f.supplier)      { setSupplier(f.supplier); filled.push('leverandør') }
      if (isFroe && !seedCount && f.seedCount != null) { setSeedCount(String(f.seedCount)); filled.push('antal frø') }
      if (!notes.trim() && f.notes)            { setNotes(f.notes); filled.push('noter') }

      const nextDyrkning: DyrkningsfaktaState = { ...dyrkning }
      let dyrkChanged = false
      if (dyrkning.sowingMonths.length === 0 && f.sowingMonths?.length) { nextDyrkning.sowingMonths = f.sowingMonths; filled.push('Sås'); dyrkChanged = true }
      if (dyrkning.sowingDepthMm == null && f.sowingDepthMm != null)    { nextDyrkning.sowingDepthMm = f.sowingDepthMm; filled.push('Sådybde'); dyrkChanged = true }
      if (dyrkning.preCultivation == null && f.preCultivation != null)  { nextDyrkning.preCultivation = f.preCultivation; filled.push('Forkultivering'); dyrkChanged = true }
      if (dyrkning.plantingOutMonths.length === 0 && f.plantingOutMonths?.length) { nextDyrkning.plantingOutMonths = f.plantingOutMonths; filled.push('Plant ud'); dyrkChanged = true }
      if (dyrkning.harvestMonths.length === 0 && f.harvestMonths?.length) { nextDyrkning.harvestMonths = f.harvestMonths; filled.push('Høst'); dyrkChanged = true }
      if (dyrkning.light == null && f.light)                            { nextDyrkning.light = f.light; filled.push('Lys'); dyrkChanged = true }
      if (dyrkning.water == null && f.water)                            { nextDyrkning.water = f.water; filled.push('Vand'); dyrkChanged = true }
      if (!dyrkning.germinationDays && f.germinationDays)               { nextDyrkning.germinationDays = f.germinationDays; filled.push('Spiretid'); dyrkChanged = true }
      if (!dyrkning.germinationTemperature && f.germinationTemperature) { nextDyrkning.germinationTemperature = f.germinationTemperature; filled.push('Spiretemp'); dyrkChanged = true }
      if (!dyrkning.plantSpacing && f.plantSpacing)                     { nextDyrkning.plantSpacing = f.plantSpacing; filled.push('Planteafstand'); dyrkChanged = true }
      if (!dyrkning.rowSpacing && f.rowSpacing)                         { nextDyrkning.rowSpacing = f.rowSpacing; filled.push('Rækkeafstand'); dyrkChanged = true }
      if (dyrkChanged) setDyrkning(nextDyrkning)

      setAiInfo(filled.length > 0
        ? `Felter udfyldt: ${filled.join(', ')}. Husk at gemme ændringerne.`
        : 'Vi fandt ikke nye oplysninger ud over dem, der allerede er udfyldt.')
    } catch (e: unknown) {
      // Uden dette catch forsvandt en mislykket genlæsning helt tavst:
      // spinneren stoppede, og intet skete. Nu siger den det.
      console.error('genlæsning af billeder nåede ikke frem:', e)
      setError('Vi fik ikke svar fra Potalot. Prøv igen — hjælper det ikke, så genindlæs siden.')
    } finally {
      setAiPending(false)
    }
  }

  function dismissSuggestion(key: string) {
    setSuggestions(s => s.filter(x => x.key !== key))
  }

  async function handleFillFromLink() {
    const url = purchaseUrl.trim()
    if (!url) return
    setUrlAiError(null)
    setUrlAiInfo(null)
    setSuggestions([])
    setUrlAiPending(true)
    try {
      const res = await extractSeedFromUrl(url, { skipImageDownload: true })
      if ('error' in res) {
        // Serveren returnerer nu altid færdige danske beskeder (aldrig rå
        // API-tekst) — ingen prefix-oversættelse nødvendig længere.
        setUrlAiError(res.error)
        return
      }
      const f = res.fields
      const filled: string[] = []
      const newSuggestions: Suggestion[] = []

      // String-felter (top-level)
      const stringField = (
        labelKey: string,
        currentValue: string,
        aiValue: string | undefined,
        setter: (v: string) => void,
      ) => {
        if (!aiValue) return
        if (!currentValue.trim()) {
          setter(aiValue)
          filled.push(labelKey)
        } else if (currentValue.trim().toLowerCase() !== aiValue.trim().toLowerCase()) {
          newSuggestions.push({
            key: labelKey,
            label: labelKey,
            current: currentValue,
            suggested: aiValue,
            apply: () => { setter(aiValue); dismissSuggestion(labelKey) },
          })
        }
      }
      stringField('Navn', name, f.name, setName)
      stringField('Latinsk navn', latinName, f.latinName, setLatinName)
      stringField('Sort', variety, f.variety, setVariety)
      stringField('Leverandør', supplier, f.supplier, setSupplier)
      stringField('Noter', notes, f.notes, setNotes)

      // Antal frø — kun hvis kategorien er frø
      if (isFroe && f.seedCount != null) {
        if (!seedCount) {
          setSeedCount(String(f.seedCount))
          filled.push('Antal frø')
        } else if (parseInt(seedCount, 10) !== f.seedCount) {
          const aiVal = String(f.seedCount)
          newSuggestions.push({
            key: 'seedCount',
            label: 'Antal frø',
            current: seedCount,
            suggested: aiVal,
            apply: () => { setSeedCount(aiVal); dismissSuggestion('seedCount') },
          })
        }
      }

      // Dyrkningsfakta — bruges via setDyrkning(prev => ...) så apply-callbacks ser
      // den seneste state, ikke en stale closure.
      const dyrkningField = <K extends keyof DyrkningsfaktaState>(
        labelKey: string,
        currentValue: DyrkningsfaktaState[K],
        aiValue: DyrkningsfaktaState[K] | undefined,
        key: K,
        currentLabel: string,
        suggestedLabel: string,
        equals: (a: DyrkningsfaktaState[K], b: DyrkningsfaktaState[K]) => boolean,
        isEmpty: (v: DyrkningsfaktaState[K]) => boolean,
      ) => {
        if (aiValue === undefined || aiValue === null) return
        if (isEmpty(currentValue)) {
          setDyrkning(prev => ({ ...prev, [key]: aiValue }))
          filled.push(labelKey)
        } else if (!equals(currentValue, aiValue)) {
          newSuggestions.push({
            key: `dyrkning.${key}`,
            label: labelKey,
            current: currentLabel,
            suggested: suggestedLabel,
            apply: () => {
              setDyrkning(prev => ({ ...prev, [key]: aiValue }))
              dismissSuggestion(`dyrkning.${key}`)
            },
          })
        }
      }

      // Måned-arrays
      if (f.sowingMonths) dyrkningField(
        'Sås', dyrkning.sowingMonths, f.sowingMonths, 'sowingMonths',
        monthsLabel(dyrkning.sowingMonths), monthsLabel(f.sowingMonths),
        arraysEqual, v => v.length === 0,
      )
      if (f.plantingOutMonths) dyrkningField(
        'Plant ud', dyrkning.plantingOutMonths, f.plantingOutMonths, 'plantingOutMonths',
        monthsLabel(dyrkning.plantingOutMonths), monthsLabel(f.plantingOutMonths),
        arraysEqual, v => v.length === 0,
      )
      if (f.harvestMonths) dyrkningField(
        'Høst', dyrkning.harvestMonths, f.harvestMonths, 'harvestMonths',
        monthsLabel(dyrkning.harvestMonths), monthsLabel(f.harvestMonths),
        arraysEqual, v => v.length === 0,
      )

      // Sådybde (number | null) — null = ukendt, 0 = overfladesåning.
      if (f.sowingDepthMm != null) dyrkningField(
        'Sådybde', dyrkning.sowingDepthMm, f.sowingDepthMm, 'sowingDepthMm',
        saadybdeLabel(dyrkning.sowingDepthMm),
        saadybdeLabel(f.sowingDepthMm),
        (a, b) => a === b, v => v == null,
      )

      // Forspiring (boolean | null)
      if (f.preCultivation != null) dyrkningField(
        'Forkultivering', dyrkning.preCultivation, f.preCultivation, 'preCultivation',
        dyrkning.preCultivation == null ? '—' : dyrkning.preCultivation ? 'Ja' : 'Nej',
        f.preCultivation ? 'Ja' : 'Nej',
        (a, b) => a === b, v => v == null,
      )

      // Lys / Vand (enum | null)
      if (f.light) dyrkningField(
        'Lys', dyrkning.light, f.light, 'light',
        dyrkning.light ? LIGHT_LABEL[dyrkning.light] : '—',
        LIGHT_LABEL[f.light],
        (a, b) => a === b, v => v == null,
      )
      if (f.water) dyrkningField(
        'Vand', dyrkning.water, f.water, 'water',
        dyrkning.water ? WATER_LABEL[dyrkning.water] : '—',
        WATER_LABEL[f.water],
        (a, b) => a === b, v => v == null,
      )

      // Tekst-felter i dyrkning
      const dyrkningString = (
        labelKey: string,
        key: 'germinationDays' | 'germinationTemperature' | 'plantSpacing' | 'rowSpacing',
        aiValue: string | undefined,
      ) => {
        if (!aiValue) return
        const current = dyrkning[key]
        if (!current.trim()) {
          setDyrkning(prev => ({ ...prev, [key]: aiValue }))
          filled.push(labelKey)
        } else if (current.trim().toLowerCase() !== aiValue.trim().toLowerCase()) {
          newSuggestions.push({
            key: `dyrkning.${key}`,
            label: labelKey,
            current,
            suggested: aiValue,
            apply: () => {
              setDyrkning(prev => ({ ...prev, [key]: aiValue }))
              dismissSuggestion(`dyrkning.${key}`)
            },
          })
        }
      }
      dyrkningString('Spiretid', 'germinationDays', f.germinationDays)
      dyrkningString('Spiretemp.', 'germinationTemperature', f.germinationTemperature)
      dyrkningString('Planteafstand', 'plantSpacing', f.plantSpacing)
      dyrkningString('Rækkeafstand', 'rowSpacing', f.rowSpacing)

      setSuggestions(newSuggestions)

      if (filled.length === 0 && newSuggestions.length === 0) {
        setUrlAiInfo('Potalot kunne ikke finde nok oplysninger på siden.')
      } else {
        const parts: string[] = []
        if (filled.length > 0) parts.push(`Potalot udfyldte ${filled.length} ${filled.length === 1 ? 'felt' : 'felter'}: ${filled.join(', ')}.`)
        if (newSuggestions.length > 0) parts.push(`${newSuggestions.length} forslag til ændring nedenfor`)
        setUrlAiInfo(parts.join('. ') + '.')
      }
    } catch (e: unknown) {
      // Rå fejltekst må aldrig nå brugeren — log den (FRB-0075).
      console.error('autoudfyld fra link fejlede:', e)
      setUrlAiError('Noget gik galt under læsningen af linket. Prøv igen.')
    } finally {
      setUrlAiPending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await updateInventoryItem(item.id, {
        name: name.trim(),
        latinName: latinName.trim() || undefined,
        variety: variety.trim() || undefined,
        supplier: supplier.trim() || undefined,
        primaryCategoryId: primaryCat,
        subcategoryId: subcat || undefined,
        quantity: !isFroe && quantity ? parseInt(quantity, 10) : undefined,
        seedCount: isFroe && seedCount ? parseInt(seedCount, 10) : undefined,
        purchaseYear: purchaseYear ? parseInt(purchaseYear, 10) : undefined,
        purchaseUrl: purchaseUrl.trim() || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
        sowingMonths: dyrkning.sowingMonths,
        sowingDepthMm: dyrkning.sowingDepthMm,
        preCultivation: dyrkning.preCultivation ?? undefined,
        plantingOutMonths: dyrkning.plantingOutMonths,
        harvestMonths: dyrkning.harvestMonths,
        light: dyrkning.light ?? undefined,
        water: dyrkning.water ?? undefined,
        soil: dyrkning.soil.trim() || undefined,
        germinationDays: dyrkning.germinationDays.trim() || undefined,
        germinationTemperature: dyrkning.germinationTemperature.trim() || undefined,
        plantSpacing: dyrkning.plantSpacing.trim() || undefined,
        rowSpacing: dyrkning.rowSpacing.trim() || undefined,
        imageUrls: images,
        primaryImageUrl: primaryImage ?? undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto border-0"
          style={{
            height: 44,
            paddingInline: 20,
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.28)',
            border: '1px solid rgba(117,101,62,0.18)',
            color: '#263321',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32)',
          }}
        >
          <Pencil className="h-4 w-4" strokeWidth={1.9} />
          Rediger
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle>Rediger {item.name}</DialogTitle>
        <DialogDescription>Ret felter for denne frøpose/batch.</DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Navn *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>Sort</Label>
              <Input value={variety} onChange={e => setVariety(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Latinsk navn</Label>
            <Input value={latinName} onChange={e => setLatinName(e.target.value)} className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Primær kategori</Label>
              <select
                value={primaryCat}
                onChange={e => { setPrimaryCat(e.target.value as PrimaryCategoryId); setSubcat('') }}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {PRIMARY_CATEGORY_IDS.filter(id => id !== 'favoritter').map(id => (
                  <option key={id} value={id}>{PRIMARY_CATEGORIES[id].name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Underkategori</Label>
              <select
                value={subcat}
                onChange={e => setSubcat(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="">Ingen</option>
                {tilgaengeligeSubs.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Leverandør</Label>
              <Input value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>{isFroe ? 'Antal frø' : 'Antal'}</Label>
              <Input
                type="number"
                value={isFroe ? seedCount : quantity}
                onChange={e => isFroe ? setSeedCount(e.target.value) : setQuantity(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Købsår</Label>
              <Input type="number" value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Bedst før</Label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Købt her</Label>
            <Input type="url" value={purchaseUrl} onChange={e => setPurchaseUrl(e.target.value)} className="mt-1.5" />
            {purchaseUrl.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={handleFillFromLink}
                disabled={urlAiPending}
              >
                {urlAiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                {urlAiPending ? 'Læser link…' : 'Autoudfyld fra link'}
              </Button>
            )}
            {urlAiInfo && <p className="mt-2 text-xs text-muted-foreground">{urlAiInfo}</p>}
            {urlAiError && (
              <p className="mt-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                {urlAiError}
              </p>
            )}
            {suggestions.length > 0 && (
              <div className="mt-3 space-y-2 border border-border rounded-lg p-3 bg-muted/30">
                <p className="text-xs font-medium text-foreground">Forslag til ændringer</p>
                {suggestions.map(s => (
                  <div key={s.key} className="flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{s.label}</p>
                      <p className="text-muted-foreground">
                        Nuværende: <span className="text-foreground">{s.current}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Forslag: <span className="text-foreground">{s.suggested}</span>
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button type="button" variant="outline" size="sm" onClick={s.apply} aria-label="Brug forslag">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => dismissSuggestion(s.key)} aria-label="Behold nuværende">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <p className="font-serif text-base text-foreground mb-2">Dyrkningsfakta</p>
            <DyrkningsfaktaFields value={dyrkning} onChange={setDyrkning} irrelevanteFelter={irrelevante} />
          </div>

          <div>
            <Label>Noter</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Billeder</Label>
            <div className="mt-1.5 space-y-2">
              <MultiImageUpload
                value={images}
                primary={primaryImage}
                onChange={(imgs, p) => { setImages(imgs); setPrimaryImage(p) }}
                folder="froebank"
                label="Tilføj billeder"
              />
              {images.length > 0 && (
                <Button type="button" variant="outline" className="w-full" onClick={handleReadWithAI} disabled={aiPending}>
                  {aiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {aiPending ? 'Læser…' : 'Genlæs billeder'}
                </Button>
              )}
              {aiInfo && <p className="text-xs text-muted-foreground">{aiInfo}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : 'Gem ændringer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
