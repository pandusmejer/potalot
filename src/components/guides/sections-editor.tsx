'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { GuideSection } from '@/lib/types'

interface Props {
  value: GuideSection[]
  onChange: (next: GuideSection[]) => void
}

const slugify = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'sektion'

/**
 * Redigér guide-sektioner som en liste af {title, body}-blokke. Kan
 * bruges i både admin-formen og bruger-formen.
 */
export function SectionsEditor({ value, onChange }: Props) {
  function update(idx: number, patch: Partial<GuideSection>) {
    // TS narrower kan ikke afgøre at spread bevarer discriminator-fieldet
    // 'kind'; cast tilbage til GuideSection[]. Sektion-editoren rør kun
    // ved title/body (prose-felter), så den semantiske kontrakt holder.
    const next = value.map((s, i) =>
      i === idx ? ({ ...s, ...patch } as GuideSection) : s,
    )
    onChange(next)
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }
  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }
  function add() {
    onChange([...value, { key: `sektion_${value.length + 1}`, title: '', body: '' }])
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Ingen sektioner endnu.</p>
      )}
      {value.map((section, idx) => (
        <div key={`${idx}-${section.key}`} className="border border-border rounded-lg p-3 space-y-2 bg-card">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <Label className="text-xs">Titel</Label>
                <Input
                  value={section.title}
                  onChange={e => {
                    const title = e.target.value
                    // hold key i synk hvis ikke brugeren har ændret den manuelt
                    const autoKey = section.key === '' || section.key.startsWith('sektion_') || section.key === slugify(value[idx].title ?? '')
                    update(idx, autoKey ? { title, key: slugify(title) } : { title })
                  }}
                  placeholder="Fx. Såning"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Indhold (markdown)</Label>
                <Textarea
                  value={section.body}
                  onChange={e => update(idx, { body: e.target.value })}
                  rows={4}
                  placeholder="Skriv vejledning…"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                type="button" variant="ghost" size="icon"
                onClick={() => move(idx, -1)} disabled={idx === 0}
                aria-label="Flyt op"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon"
                onClick={() => move(idx, 1)} disabled={idx === value.length - 1}
                aria-label="Flyt ned"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon"
                onClick={() => remove(idx)}
                aria-label="Slet sektion"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-4 w-4" />
        Tilføj sektion
      </Button>
    </div>
  )
}
