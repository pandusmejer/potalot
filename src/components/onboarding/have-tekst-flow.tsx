'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, X, Check, Loader2, ArrowLeft, Sprout, Package } from 'lucide-react'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { fortolkHaveTekst, type HaveForslag, type Usikkerhed } from '@/actions/have-tekst'
import { opretEgenPlante } from '@/actions/mine-planter'
import { createInventoryItem } from '@/actions/froebank'

interface Props {
  /** Navne der allerede findes (planter + frø) → dublet-markering. */
  existingNames?: string[]
  /** Kaldes når n forslag er gemt, så shellen kan opdatere overblikket. */
  onCommitted?: (n: number) => void
  /** Tilbage til metode-valget. */
  onBack?: () => void
  /** Kun til QA-preview: start direkte i review-listen med seedede forslag (intet AI-kald). */
  demoForslag?: HaveForslag[]
}

/** Redigerbar udgave af et forslag + om det skal med. */
interface Rad extends HaveForslag {
  include: boolean
  muligDublet: boolean
}

const USIKKERHED_LABEL: Record<Usikkerhed, string> = {
  hoej: 'sikker',
  mellem: 'rimelig sikker',
  lav: 'usikker',
}

/**
 * Onboarding-indgang 4 — "Fortæl om haven med tekst".
 * Fri tekst → fortolkHaveTekst (Haiku) → godkend-liste (rediger, fjern,
 * godkend enkeltvis/alle, spring usikre over) → gemmes via de eksisterende
 * create-actions. Intet gemmes uden brugerens godkendelse. Hvert forslag
 * viser kilde ("fortolket fra tekst") + usikkerhed.
 */
export function HaveTekstFlow({ existingNames = [], onCommitted, onBack, demoForslag }: Props) {
  const existingLower = new Set(existingNames.map(n => n.toLowerCase().trim()))
  const seed = (fs: HaveForslag[]): Rad[] => fs.map(f => {
    const muligDublet = existingLower.has(f.name.toLowerCase().trim())
    return { ...f, include: f.usikkerhed !== 'lav' && !muligDublet, muligDublet }
  })

  const [step, setStep] = useState<'input' | 'review' | 'done'>(demoForslag?.length ? 'review' : 'input')
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rader, setRader] = useState<Rad[]>(demoForslag?.length ? seed(demoForslag) : [])
  const [gemtAntal, setGemtAntal] = useState(0)
  // Valgfrit foto af håndskrevne noter — læses sammen med teksten.
  const [noteImages, setNoteImages] = useState<string[]>([])
  const [notePrimary, setNotePrimary] = useState<string | null>(null)

  function fortolk() {
    setError(null)
    startTransition(async () => {
      const res = await fortolkHaveTekst(text, notePrimary)
      if ('error' in res) { setError(res.error); return }
      if (res.forslag.length === 0) {
        setError(notePrimary
          ? 'Jeg kunne ikke læse noget brugbart — prøv et skarpere foto, eller skriv et par ord ved siden af.'
          : 'Jeg fandt ingen planter eller frø i teksten. Prøv at nævne dem mere direkte.')
        return
      }
      setRader(res.forslag.map(f => {
        const muligDublet = existingLower.has(f.name.toLowerCase().trim())
        return {
          ...f,
          // Usikre + mulige dubletter er som udgangspunkt fravalgt (spring usikre over).
          include: f.usikkerhed !== 'lav' && !muligDublet,
          muligDublet,
        }
      }))
      setStep('review')
    })
  }

  function opdater(id: string, patch: Partial<Rad>) {
    setRader(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }
  function fjern(id: string) {
    setRader(rs => rs.filter(r => r.id !== id))
  }

  const valgte = rader.filter(r => r.include && r.name.trim())

  function gem() {
    setError(null)
    startTransition(async () => {
      let ok = 0
      for (const r of valgte) {
        const name = r.name.trim()
        if (!name) continue
        if (r.kind === 'plante') {
          const res = await opretEgenPlante({
            name,
            variety: r.variety?.trim() || null,
            quantity: r.quantity ?? 1,
            location: r.location?.trim() || undefined,
            // Onboarding spørger ikke om dato her — planten står allerede i haven.
            sowDate: null,
            sowDatePrecision: 'unknown',
            status: 'i_vaekst',
          })
          if (!('error' in res)) ok++
        } else {
          const res = await createInventoryItem({
            name,
            variety: r.variety?.trim() || undefined,
            primaryCategoryId: r.primaryCategoryId ?? 'fro',
            quantity: r.quantity ?? undefined,
            sowingMonths: r.sowingMonths ?? undefined,
          })
          if (!('error' in res)) ok++
        }
      }
      setGemtAntal(ok)
      onCommitted?.(ok)
      setStep('done')
    })
  }

  // ---- DONE ----
  if (step === 'done') {
    return (
      <div className="space-y-4 text-center py-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">
            {gemtAntal > 0 ? `${gemtAntal} tilføjet til din have` : 'Intet gemt'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {gemtAntal > 0
              ? 'Du kan altid rette dem i Planter og Frøbank.'
              : 'Du kan prøve igen eller vælge en anden metode.'}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => { setStep('input'); setText(''); setRader([]) }}>
            Fortæl mere
          </Button>
          {onBack && <Button onClick={onBack}>Færdig</Button>}
        </div>
      </div>
    )
  }

  // ---- REVIEW ----
  if (step === 'review') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Jeg forstod dette. Ret, fjern eller vælg fra og tryk <span className="text-foreground font-medium">Gem</span>.
            Forslag, du ikke gemmer, huskes ikke, hvis du forlader siden.
          </p>
        </div>

        <div className="space-y-2.5">
          {rader.map(r => (
            <div
              key={r.id}
              className={`rounded-xl border p-3 transition-colors ${
                r.include ? 'border-primary/40 bg-primary/[0.03]' : 'border-input bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => opdater(r.id, { include: !r.include })}
                  aria-label={r.include ? 'Fravælg' : 'Vælg'}
                  className={`mt-0.5 shrink-0 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                    r.include ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-card'
                  }`}
                >
                  {r.include && <Check className="h-3.5 w-3.5" />}
                </button>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Kind-toggle: AI kan fejlklassificere */}
                    <button
                      type="button"
                      onClick={() => opdater(r.id, { kind: r.kind === 'plante' ? 'froe' : 'plante' })}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                    >
                      {r.kind === 'plante'
                        ? <><Sprout className="h-3 w-3" /> Plante</>
                        : <><Package className="h-3 w-3" /> Frø</>}
                    </button>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">fortolket fra tekst</span>
                    <UsikkerhedChip u={r.usikkerhed} />
                    {r.muligDublet && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">findes måske allerede</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={r.name}
                      onChange={e => opdater(r.id, { name: e.target.value })}
                      placeholder="Art"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={r.variety ?? ''}
                      onChange={e => opdater(r.id, { variety: e.target.value || null })}
                      placeholder="Sort (valgfri)"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number" min="1"
                      value={r.quantity ?? ''}
                      onChange={e => opdater(r.id, { quantity: e.target.value ? Math.max(1, parseInt(e.target.value, 10)) : null })}
                      placeholder="Antal"
                      className="h-8 text-sm"
                    />
                    {r.kind === 'plante' && (
                      <Input
                        value={r.location ?? ''}
                        onChange={e => opdater(r.id, { location: e.target.value || null })}
                        placeholder="Sted (valgfri)"
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fjern(r.id)}
                  aria-label="Fjern forslag"
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setRader(rs => rs.map(r => ({ ...r, include: true })))}
            className="text-sm text-primary hover:underline"
          >
            Godkend alle
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep('input')} disabled={pending}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Tilbage
            </Button>
            <Button onClick={gem} disabled={pending || valgte.length === 0}>
              {pending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Gemmer…</> : `Gem valgte (${valgte.length})`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---- INPUT ----
  return (
    <div className="space-y-3">
      <div>
        <Label>Fortæl om din have</Label>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          autoFocus
          placeholder="Fx. 'Jeg har tre tomatplanter i drivhuset, en række gulerødder i højbed 2, og en pose spinatfrø jeg ikke har sået endnu.'"
          className="mt-1.5"
        />
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Du kan skrive frit, tilføje et foto af håndskrevne noter — eller begge dele.
        </p>
      </div>

      {/* Foto af noter — læses sammen med teksten. Foto = råinput, aldrig facit:
          alt bliver til forslag du godkender. */}
      <div>
        <Label className="text-sm">
          Tilføj foto af noter <span className="text-muted-foreground font-normal">(valgfri)</span>
        </Label>
        <div className="mt-1.5">
          <MultiImageUpload
            value={noteImages} primary={notePrimary}
            onChange={(imgs, prim) => { setNoteImages(imgs); setNotePrimary(prim) }}
            folder="idetavle" maxImages={1} label="Tag eller vælg et billede"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Det kan være en så-liste, en skitse, en huskeseddel eller en side fra notesbogen.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between gap-2">
        {onBack && (
          <Button variant="ghost" onClick={onBack} disabled={pending}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbage
          </Button>
        )}
        <Button onClick={fortolk} disabled={pending || (text.trim().length < 3 && !notePrimary)} className="ml-auto">
          {pending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Læser…</> : <><Sparkles className="h-4 w-4 mr-1" /> Fortolk</>}
        </Button>
      </div>
    </div>
  )
}

function UsikkerhedChip({ u }: { u: Usikkerhed }) {
  const cls =
    u === 'hoej' ? 'bg-primary/10 text-primary'
    : u === 'lav' ? 'bg-amber-100 text-amber-800'
    : 'bg-muted text-muted-foreground'
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cls}`}>{USIKKERHED_LABEL[u]}</span>
}
