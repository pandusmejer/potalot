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
import { Plus, Pencil, Trash2, Wand2, Loader2, Search, User } from 'lucide-react'
import { SectionsEditor } from '@/components/guides/sections-editor'
import {
  createMasterGuide, updateMasterGuide, deleteMasterGuide, generateMasterDraftWithAI,
  searchUserGuidesForImport,
  type MasterGuideInput, type AdminGuideRow,
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

  // Import-fra-bruger-guide state (kun relevant ved !isEdit)
  const [importSearch, setImportSearch] = useState('')
  const [importResults, setImportResults] = useState<AdminGuideRow[]>([])
  const [importPending, setImportPending] = useState(false)
  const [importedFrom, setImportedFrom] = useState<{ id: string; label: string } | null>(null)

  async function handleImportSearch(q: string) {
    setImportSearch(q)
    if (q.trim().length < 2 && q.trim().length > 0) return
    setImportPending(true)
    try {
      const results = await searchUserGuidesForImport(q)
      setImportResults(results)
    } finally {
      setImportPending(false)
    }
  }

  function applyImport(g: AdminGuideRow) {
    setPlantName(g.plantName)
    setVariety(g.variety ?? '')
    setLatinName(g.latinName ?? '')
    setPrimaryCat(g.primaryCategoryId)
    setSummary(g.summary)
    setDifficulty(g.difficulty ?? '')
    setTagsInput((g.tags ?? []).join(', '))
    setSourceLinksInput((g.sourceLinks ?? []).join('\n'))
    setQuickFactsJson(JSON.stringify(g.quickFacts ?? {}, null, 2))
    setSections(g.sections ?? [])
    setCalendarRulesJson(JSON.stringify(g.calendarRules ?? [], null, 2))
    const label = g.variety ? `${g.plantName} — ${g.variety}` : g.plantName
    const owner = g.ownerLabel ? ` (af ${g.ownerLabel})` : ''
    setImportedFrom({ id: g.id, label: label + owner })
    setImportResults([])
    setImportSearch('')
  }

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

        {!isEdit && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 mb-3 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Importér fra eksisterende bruger-guide
              </p>
            </div>
            {importedFrom ? (
              <div className="flex items-center justify-between gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                <p className="text-xs text-green-900">
                  Importeret fra <strong>{importedFrom.label}</strong> — felterne er forudfyldt.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImportedFrom(null)}
                  className="text-green-900 hover:bg-green-100 h-6 px-2"
                >
                  Fjern
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={importSearch}
                    onChange={e => handleImportSearch(e.target.value)}
                    placeholder="Søg plantenavn, sort eller latinsk navn…"
                    className="pl-8 text-sm"
                  />
                </div>
                {importPending && (
                  <p className="text-xs text-muted-foreground italic">Søger…</p>
                )}
                {!importPending && importSearch.trim().length >= 2 && importResults.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Ingen bruger-guides matcher.</p>
                )}
                {importResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-card divide-y divide-border">
                    {importResults.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => applyImport(g)}
                        className="w-full text-left p-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {g.plantName}{g.variety ? ` — ${g.variety}` : ''}
                          </p>
                          {g.isAiGenerated && (
                            <span className="text-[9px] uppercase rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground shrink-0">AI</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {g.ownerLabel ? `Af ${g.ownerLabel}` : 'Bruger'}
                          {g.latinName ? ` · ${g.latinName}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  Klik et resultat for at fylde formularen — du kan redigere bagefter.
                </p>
              </>
            )}
          </div>
        )}

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
