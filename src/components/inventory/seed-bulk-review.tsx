'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { PlantGuide } from '@/lib/types'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface ParsedSeed {
  name: string
  variety: string | null
  brand: string | null
  quantity: number | null
  year_purchased: number | null
  expiry_year: number | null
  notes: string | null
  guide_id: string | null
  // Extended fields from multi-image scan
  botanical_name?: string | null
  subcategory?: string | null
  plant_type?: string | null
  germination_rate?: number | null
}

interface SeedBulkReviewProps {
  seeds: ParsedSeed[]
  guides: PlantGuide[]
  onSave: (seeds: ParsedSeed[]) => void
  onBack: () => void
  onAddMore?: () => void
  addMoreLabel?: string
  saving: boolean
}

export function matchGuide(
  seedName: string,
  guides: PlantGuide[]
): PlantGuide | null {
  const lower = seedName.toLowerCase().trim()
  const exact = guides.find((g) => g.name_da.toLowerCase() === lower)
  if (exact) return exact
  const partial = guides.find((g) =>
    lower.includes(g.name_da.toLowerCase())
  )
  if (partial) return partial
  const reverse = guides.find((g) =>
    g.name_da.toLowerCase().includes(lower)
  )
  return reverse || null
}

export function SeedBulkReview({
  seeds: initialSeeds,
  guides,
  onSave,
  onBack,
  onAddMore,
  addMoreLabel,
  saving,
}: SeedBulkReviewProps) {
  const [seeds, setSeeds] = useState<ParsedSeed[]>(initialSeeds)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function updateSeed(index: number, updates: Partial<ParsedSeed>) {
    setSeeds((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    )
  }

  function removeSeed(index: number) {
    setSeeds((prev) => prev.filter((_, i) => i !== index))
  }

  const validSeeds = seeds.filter((s) => s.name.trim().length > 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {seeds.length} frø fundet
        </p>
        {onAddMore && (
          <Button type="button" size="sm" variant="secondary" onClick={onAddMore}>
            {addMoreLabel || '+ Tilføj flere'}
          </Button>
        )}
      </div>

      {seeds.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Ingen frø at vise. Gå tilbage og prøv igen.
        </p>
      )}

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {seeds.map((seed, index) => {
          const isExpanded = expandedIndex === index
          const guideName = seed.guide_id
            ? guides.find((g) => g.id === seed.guide_id)?.name_da
            : null

          return (
            <div
              key={index}
              className="border border-border rounded-lg p-3 bg-background"
            >
              {/* Compact header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2 text-left"
                  onClick={() =>
                    setExpandedIndex(isExpanded ? null : index)
                  }
                >
                  <span className="font-medium text-sm">
                    {seed.name || '(intet navn)'}
                  </span>
                  {seed.variety && (
                    <span className="text-xs text-muted-foreground">
                      {seed.variety}
                    </span>
                  )}
                  {guideName && (
                    <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                      {guideName}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeSeed(index)}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded edit form */}
              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-0.5">
                        Navn *
                      </label>
                      <Input
                        value={seed.name}
                        onChange={(e) =>
                          updateSeed(index, { name: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-0.5">
                        Sort
                      </label>
                      <Input
                        value={seed.variety ?? ''}
                        onChange={(e) =>
                          updateSeed(index, {
                            variety: e.target.value || null,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-0.5">
                        Mærke
                      </label>
                      <Input
                        value={seed.brand ?? ''}
                        onChange={(e) =>
                          updateSeed(index, {
                            brand: e.target.value || null,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-0.5">
                        Guide
                      </label>
                      <Select
                        value={seed.guide_id ?? ''}
                        onChange={(e) =>
                          updateSeed(index, {
                            guide_id: e.target.value || null,
                          })
                        }
                        className="text-sm"
                      >
                        <option value="">Ingen</option>
                        {guides.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name_da}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-0.5">
                        Antal
                      </label>
                      <Input
                        type="number"
                        value={seed.quantity ?? ''}
                        onChange={(e) =>
                          updateSeed(index, {
                            quantity: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-0.5">
                        Købsår
                      </label>
                      <Input
                        type="number"
                        value={seed.year_purchased ?? ''}
                        onChange={(e) =>
                          updateSeed(index, {
                            year_purchased: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-0.5">
                        Udløb
                      </label>
                      <Input
                        type="number"
                        value={seed.expiry_year ?? ''}
                        onChange={(e) =>
                          updateSeed(index, {
                            expiry_year: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onBack}>
          Tilbage
        </Button>
        <Button
          onClick={() => onSave(validSeeds)}
          disabled={saving || validSeeds.length === 0}
        >
          {saving
            ? 'Gemmer...'
            : `Gem ${validSeeds.length} frø`}
        </Button>
      </div>
    </div>
  )
}
