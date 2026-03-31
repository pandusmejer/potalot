'use client'

import { createGuideManual, updateGuideManual } from '@/actions/guides'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { GUIDE_CATEGORIES } from '@/lib/constants'
import type { PlantGuide } from '@/lib/types'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface GuideFormProps {
  open: boolean
  onClose: () => void
  guide?: PlantGuide | null
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50 rounded-lg transition-colors"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  )
}

export function GuideForm({ open, onClose, guide }: GuideFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const isEdit = !!guide

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = guide
        ? await updateGuideManual(guide.id, formData)
        : await createGuideManual(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
        if (!guide && 'slug' in result && result.slug) {
          router.push(`/guides/${result.slug}`)
        } else {
          router.refresh()
        }
      }
    })
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogTitle>{isEdit ? 'Rediger guide' : 'Ny dyrkningsguide'}</DialogTitle>
      <form action={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">

        {/* === Grunddata === */}
        <Section title="Grunddata" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Dansk navn *</label>
              <Input name="name_da" required defaultValue={guide?.name_da ?? ''} placeholder="fx. Tomat" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Engelsk navn</label>
              <Input name="name_en" defaultValue={guide?.name_en ?? ''} placeholder="fx. Tomato" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Botanisk navn</label>
              <Input name="botanical_name" defaultValue={guide?.botanical_name ?? ''} placeholder="fx. Solanum lycopersicum" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Kategori</label>
              <Select name="category" defaultValue={guide?.category ?? 'vegetable'}>
                {Object.entries(GUIDE_CATEGORIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Intro / beskrivelse</label>
            <Textarea name="description" rows={3} defaultValue={guide?.description ?? ''} placeholder="Kort, levende intro om planten" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium mb-1">Sådybde (mm) *</label>
              <Input name="depth_mm" type="number" min="0" step="1" required defaultValue={0} placeholder="0 = overfladen" />
              <p className="text-[10px] text-muted-foreground mt-0.5">0 mm = sås på overfladen</p>
            </div>
          )}
        </Section>

        {/* === Quick Reference === */}
        {isEdit && (
          <Section title="Sol, vand og afstand">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Sol</label>
                <Select name="sun_requirement" defaultValue={guide?.sun_requirement ?? ''}>
                  <option value="">Ikke angivet</option>
                  <option value="full_sun">Fuld sol</option>
                  <option value="partial_shade">Halvskygge</option>
                  <option value="shade">Skygge</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Vandbehov</label>
                <Select name="water_need" defaultValue={guide?.water_need ?? ''}>
                  <option value="">Ikke angivet</option>
                  <option value="low">Lavt</option>
                  <option value="medium">Medium</option>
                  <option value="high">Højt</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Frosttolerant</label>
                <Select name="frost_hardy" defaultValue={guide?.frost_hardy ? 'true' : 'false'}>
                  <option value="false">Nej</option>
                  <option value="true">Ja</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Afstand (cm)</label>
                <Input name="spacing_cm" type="number" defaultValue={guide?.spacing_cm ?? ''} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Sådybde (mm) *</label>
                <Input name="depth_mm" type="number" min="0" step="1" required defaultValue={guide?.depth_mm ?? 0} placeholder="0 = overfladen" />
                <p className="text-[10px] text-muted-foreground mt-0.5">0 mm = sås på overfladen</p>
              </div>
            </div>
          </Section>
        )}

        {/* === Kalender === */}
        {isEdit && (
          <Section title="Kalender og timing">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Så indendørs fra</label>
                <Input name="sow_indoor_start" defaultValue={guide?.sow_indoor_start ?? ''} placeholder="fx. mar" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Så indendørs til</label>
                <Input name="sow_indoor_end" defaultValue={guide?.sow_indoor_end ?? ''} placeholder="fx. apr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Så udendørs fra</label>
                <Input name="sow_outdoor_start" defaultValue={guide?.sow_outdoor_start ?? ''} placeholder="fx. maj" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Så udendørs til</label>
                <Input name="sow_outdoor_end" defaultValue={guide?.sow_outdoor_end ?? ''} placeholder="fx. jun" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Prikl ud (uger)</label>
                <Input name="prick_out_weeks_after_sow" type="number" defaultValue={guide?.prick_out_weeks_after_sow ?? ''} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Plant ud fra</label>
                <Input name="plant_out_start" defaultValue={guide?.plant_out_start ?? ''} placeholder="fx. maj" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Plant ud til</label>
                <Input name="plant_out_end" defaultValue={guide?.plant_out_end ?? ''} placeholder="fx. jun" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Høst fra</label>
                <Input name="harvest_start" defaultValue={guide?.harvest_start ?? ''} placeholder="fx. jul" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Høst til</label>
                <Input name="harvest_end" defaultValue={guide?.harvest_end ?? ''} placeholder="fx. okt" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Spiretid min (dage)</label>
                <Input name="days_to_germination_min" type="number" defaultValue={guide?.days_to_germination_min ?? ''} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Spiretid max (dage)</label>
                <Input name="days_to_germination_max" type="number" defaultValue={guide?.days_to_germination_max ?? ''} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Tid til høst min (dage)</label>
                <Input name="days_to_harvest_min" type="number" defaultValue={guide?.days_to_harvest_min ?? ''} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Tid til høst max (dage)</label>
                <Input name="days_to_harvest_max" type="number" defaultValue={guide?.days_to_harvest_max ?? ''} />
              </div>
            </div>
          </Section>
        )}

        {/* === Prose sektioner === */}
        {isEdit && (
          <Section title="Såning og etablering">
            <Textarea name="sowing_info" rows={4} defaultValue={guide?.sowing_info ?? ''} placeholder="Forspiring, såtidspunkt, spiringstid, sådybde, jord..." />
          </Section>
        )}

        {isEdit && (
          <Section title="Ompotning">
            <Textarea name="repotting_info" rows={4} defaultValue={guide?.repotting_info ?? ''} placeholder="Tidspunkt, trigger, potstørrelse, jordtype..." />
          </Section>
        )}

        {isEdit && (
          <Section title="Udplantning">
            <Textarea name="planting_out_info" rows={4} defaultValue={guide?.planting_out_info ?? ''} placeholder="Tidspunkt, afstand, temperatur, lysbehov..." />
          </Section>
        )}

        {isEdit && (
          <Section title="Vækst og pasning">
            <Textarea name="care_info" rows={4} defaultValue={guide?.care_info ?? ''} placeholder="Vanding, gødning, opbinding, beskæring, knibning..." />
          </Section>
        )}

        {isEdit && (
          <Section title="Miljø og voksested">
            <Textarea name="environment_info" rows={4} defaultValue={guide?.environment_info ?? ''} placeholder="Drivhus, friland, krukke, jordtype..." />
          </Section>
        )}

        {isEdit && (
          <Section title="Biologi og relationer">
            <Textarea name="biology_info" rows={4} defaultValue={guide?.biology_info ?? ''} placeholder="Companion planting, skadedyr, sygdomme..." />
          </Section>
        )}

        {/* === Frøinfo === */}
        {isEdit && (
          <Section title="Frøinformation">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Frøtype</label>
                <Input name="seed_type" defaultValue={guide?.seed_type ?? ''} placeholder="fx. F1, heirloom, økologisk" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Frøhøst mulig</label>
                <Select name="seed_harvest_possible" defaultValue={guide?.seed_harvest_possible != null ? String(guide.seed_harvest_possible) : ''}>
                  <option value="">Ukendt</option>
                  <option value="true">Ja</option>
                  <option value="false">Nej</option>
                </Select>
              </div>
            </div>
          </Section>
        )}

        {/* === Callouts === */}
        {isEdit && (
          <Section title="Tips, advarsler og typiske fejl">
            <div>
              <label className="block text-xs font-medium mb-1">Tips</label>
              <Textarea name="tips" rows={2} defaultValue={guide?.tips ?? ''} placeholder="Gode råd og tricks..." />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Advarsler</label>
              <Textarea name="warnings" rows={2} defaultValue={guide?.warnings ?? ''} placeholder="Vigtige ting at være opmærksom på..." />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Typiske fejl</label>
              <Textarea name="common_mistakes" rows={2} defaultValue={guide?.common_mistakes ?? ''} placeholder="Fejl man bør undgå..." />
            </div>
          </Section>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-card pb-1">
          <Button type="button" variant="secondary" onClick={onClose}>Annuller</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Gemmer...' : isEdit ? 'Opdater' : 'Opret guide'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
