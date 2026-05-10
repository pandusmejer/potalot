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
import { Plus, Pencil, Trash2, Wand2, Loader2 } from 'lucide-react'
import { SectionsEditor } from '@/components/guides/sections-editor'
import {
  createMasterGuide, updateMasterGuide, deleteMasterGuide, generateMasterDraftWithAI,
  type MasterGuideInput,
} from '@/actions/guides-admin'
import type {
  PrimaryCategoryId, Difficulty, GuideQuickFacts, GuideSection, GuideCalendarRule,
} from '@/lib/types'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS } from '@/lib/constants'

interface ExistingGuide {
  id: string
  plantName: string
  variety: string | null
  latinName: string | null
  primaryCategoryId: PrimaryCategoryId
  summary: string
  difficulty?: Difficulty
  tags?: string[]
  quickFacts?: GuideQuickFacts
  sections?: GuideSection[]
  calendarRules?: GuideCalendarRule[]
  sourceLinks?: string[]
}

interface Props {
  guide?: ExistingGuide
  triggerLabel?: string
  /** Forudfyldte felter når ny master oprettes ud fra en bruger-guide. */
  prefill?: Partial<MasterGuideInput>
}

export function MasterGuideForm({ guide, triggerLabel, prefill }: Props) {
  const router = useRouter()
  const isEdit = !!guide
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [aiPending, setAiPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiInfo, setAiInfo] = useState<string | null>(null)

  const [plantName, setPlantName] = useState(guide?.plantName ?? prefill?.plantName ?? '')
  const [variety, setVariety] = useState(guide?.variety ?? prefill?.variety ?? '')
  const [latinName, setLatinName] = useState(guide?.latinName ?? prefill?.latinName ?? '')
  const [primaryCat, setPrimaryCat] = useState<PrimaryCategoryId>(
    guide?.primaryCategoryId ?? prefill?.primaryCategoryId ?? 'fro'
  )
  const [summary, setSummary] = useState(guide?.summary ?? prefill?.summary ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(
    guide?.difficulty ?? prefill?.difficulty ?? ''
  )
  const [tagsInput, setTagsInput] = useState(
    (guide?.tags ?? prefill?.tags ?? []).join(', ')
  )
  const [sourceLinksInput, setSourceLinksInput] = useState(
    (guide?.sourceLinks ?? prefill?.sourceLinks ?? []).join('\n')
  )
  const [quickFactsJson, setQuickFactsJson] = useState(
    JSON.stringify(guide?.quickFacts ?? prefill?.quickFacts ?? {}, null, 2)
  )
  const [sections, setSections] = useState<GuideSection[]>(
    guide?.sections ?? prefill?.sections ?? []
  )
  const [calendarRulesJson, setCalendarRulesJson] = useState(
    JSON.stringify(guide?.calendarRules ?? prefill?.calendarRules ?? [], null, 2)
  )

  function parseJson<T>(label: string, raw: string, fallback: T): T | { error: string } {
    const trimmed = raw.trim()
    if (!trimmed) return fallback
    try {
      return JSON.parse(trimmed) as T
    } catch {
      return { error: `Ugyldig JSON i ${label}` }
    }
  }

  async function handleGenerate() {
    if (!plantName.trim()) {
      setError('Skriv plantenavn først så AI ved hvad der skal genereres.')
      return
    }
    setError(null)
    setAiInfo(null)
    setAiPending(true)
    try {
      const res = await generateMasterDraftWithAI({
        plantName: plantName.trim(),
        latinName: latinName.trim() || undefined,
        variety: variety.trim() || undefined,
        primaryCategoryId: primaryCat,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      const f = res.fields
      if (f.plantName && !guide) setPlantName(f.plantName)
      if (f.latinName != null) setLatinName(f.latinName ?? '')
      if (f.variety != null) setVariety(f.variety ?? '')
      if (f.primaryCategoryId) setPrimaryCat(f.primaryCategoryId)
      if (f.summary) setSummary(f.summary)
      if (f.difficulty) setDifficulty(f.difficulty)
      if (f.tags) setTagsInput(f.tags.join(', '))
      if (f.quickFacts) setQuickFactsJson(JSON.stringify(f.quickFacts, null, 2))
      if (f.sections) setSections(f.sections)
      if (f.calendarRules) setCalendarRulesJson(JSON.stringify(f.calendarRules, null, 2))
      setAiInfo('AI-udkast indsat. Tjek og redigér før du gemmer.')
    } finally {
      setAiPending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!plantName.trim()) {
      setError('Plantenavn er påkrævet.')
      return
    }

    const emptyQf: GuideQuickFacts = {
      sowingMonths: [], directSowingMonths: [], plantingOutMonths: [], harvestMonths: [],
    }
    const qf = parseJson<GuideQuickFacts>('Quick facts', quickFactsJson, emptyQf)
    if ('error' in qf) { setError(qf.error); return }
    const cal = parseJson<GuideCalendarRule[]>('Kalender-regler', calendarRulesJson, [])
    if ('error' in cal) { setError(cal.error); return }
    if (!Array.isArray(cal)) { setError('Kalender-regler skal være et array.'); return }

    const tags = tagsInput.split(',').map(s => s.trim()).filter(Boolean)
    const sourceLinks = sourceLinksInput.split('\n').map(s => s.trim()).filter(Boolean)

    const input: MasterGuideInput = {
      plantName: plantName.trim(),
      variety: variety.trim() || null,
      latinName: latinName.trim() || null,
      primaryCategoryId: primaryCat,
      summary: summary.trim(),
      difficulty: difficulty || undefined,
      tags,
      quickFacts: qf,
      sections,
      calendarRules: cal,
      sourceLinks,
    }

    startTransition(async () => {
      const res = isEdit
        ? await updateMasterGuide(guide!.id, input)
        : await createMasterGuide(input)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!guide) return
    if (!confirm(`Slet master-guide for "${guide.plantName}"? Brugere mister adgang til denne guide.`)) return
    startTransition(async () => {
      const res = await deleteMasterGuide(guide.id)
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
        {isEdit ? (
          <Button variant="ghost" size="sm" aria-label="Redigér">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            {triggerLabel ?? 'Ny master-guide'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>{isEdit ? `Redigér ${guide!.plantName}` : 'Ny master-guide'}</DialogTitle>
        <DialogDescription>
          Master-guides er synlige for alle brugere og kan kun ændres af admin.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plantenavn *</Label>
              <Input value={plantName} onChange={e => setPlantName(e.target.value)} required className="mt-1.5" />
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
                onChange={e => setPrimaryCat(e.target.value as PrimaryCategoryId)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {PRIMARY_CATEGORY_IDS.filter(id => id !== 'favoritter').map(id => (
                  <option key={id} value={id}>{PRIMARY_CATEGORIES[id].name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Sværhedsgrad</Label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as Difficulty | '')}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="easy">Nem</option>
                <option value="medium">Mellem</option>
                <option value="hard">Krævende</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Resumé</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Tags (komma-separeret)</Label>
            <Input
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="drivhus, varmekrævende"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Kildelinks (én pr. linje)</Label>
            <Textarea
              value={sourceLinksInput}
              onChange={e => setSourceLinksInput(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="border-t border-border pt-3">
            <p className="font-serif text-base text-foreground mb-2">Sektioner</p>
            <SectionsEditor value={sections} onChange={setSections} />
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-serif text-base text-foreground">Avanceret indhold (JSON)</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={aiPending || !plantName.trim()}
              >
                {aiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {aiPending ? 'Genererer…' : 'Generér med AI'}
              </Button>
            </div>
            {aiInfo && <p className="text-xs text-muted-foreground">{aiInfo}</p>}

            <div>
              <Label>Quick facts</Label>
              <Textarea
                value={quickFactsJson}
                onChange={e => setQuickFactsJson(e.target.value)}
                rows={6}
                className="mt-1.5 font-mono text-xs"
                spellCheck={false}
              />
            </div>

            <div>
              <Label>Kalender-regler</Label>
              <Textarea
                value={calendarRulesJson}
                onChange={e => setCalendarRulesJson(e.target.value)}
                rows={6}
                className="mt-1.5 font-mono text-xs"
                spellCheck={false}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            {isEdit && (
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending} className="mr-auto">
                <Trash2 className="h-4 w-4" />
                Slet
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : isEdit ? 'Gem ændringer' : 'Opret master'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
