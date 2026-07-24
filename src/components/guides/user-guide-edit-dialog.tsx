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
import { Pencil, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { SectionsEditor } from '@/components/guides/sections-editor'
import { updateUserGuide, deleteGuide, type UpdateUserGuideInput } from '@/actions/guides'
import type {
  Guide, PrimaryCategoryId, Difficulty,
  GuideQuickFacts, GuideSection, GuideCalendarRule,
} from '@/lib/types'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS } from '@/lib/constants'

interface Props {
  guide: Guide
}

/**
 * Redigér en bruger-ejet guide. RLS sørger for at kun ejeren kan
 * faktisk gemme — knappen vises kun når bruger ejer guiden (visibility
 * === 'private').
 */
export function UserGuideEditDialog({ guide }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [plantName, setPlantName] = useState(guide.plantName)
  const [variety, setVariety] = useState(guide.variety ?? '')
  const [latinName, setLatinName] = useState(guide.latinName ?? '')
  const [primaryCat, setPrimaryCat] = useState<PrimaryCategoryId>(guide.primaryCategoryId ?? 'fro')
  const [summary, setSummary] = useState(guide.summary)
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(guide.difficulty || '')
  const [tagsInput, setTagsInput] = useState(guide.tags.join(', '))
  const [sourceLinksInput, setSourceLinksInput] = useState(guide.sourceLinks.join('\n'))
  const [sections, setSections] = useState<GuideSection[]>(guide.sections)
  const [quickFactsJson, setQuickFactsJson] = useState(
    JSON.stringify(guide.quickFacts ?? {}, null, 2)
  )
  const [calendarRulesJson, setCalendarRulesJson] = useState(
    JSON.stringify(guide.calendarRules ?? [], null, 2)
  )
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(
    guide.primaryImageId ?? null
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

    const input: UpdateUserGuideInput = {
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
      primaryImageUrl, // string = sæt, null = ryd
    }

    startTransition(async () => {
      const res = await updateUserGuide(guide.id, input)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`Slet din kopi af "${guide.plantName}"? Dine private noter forsvinder også.`)) return
    startTransition(async () => {
      const res = await deleteGuide(guide.id)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.push('/guides')
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Redigér
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Redigér min guide</DialogTitle>
        <DialogDescription>
          Din private kopi. Ændringer påvirker ikke andre brugere eller eventuel master-guide.
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

          <div>
            <Label>Eget billede <span className="text-xs text-muted-foreground font-normal">(valgfrit)</span></Label>
            <div className="mt-1.5">
              <ImageUpload
                value={primaryImageUrl}
                onChange={setPrimaryImageUrl}
                folder="guides"
                label="Tilføj eget foto"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 italic">
              Dit foto vises kun på din egen kopi af guiden — ikke på andres.
            </p>
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
            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="mt-1.5" />
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
            <p className="font-serif text-base text-foreground">Avanceret (JSON)</p>
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
                rows={5}
                className="mt-1.5 font-mono text-xs"
                spellCheck={false}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending} className="mr-auto">
              <Trash2 className="h-4 w-4" />
              Slet
            </Button>
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
