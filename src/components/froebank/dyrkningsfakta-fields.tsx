'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MONTHS_DA, LIGHT_META, WATER_META } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface DyrkningsfaktaState {
  sowingMonths: number[]
  sowingDepthMm: number | null
  preCultivation: boolean | null
  plantingOutMonths: number[]
  harvestMonths: number[]
  light: 'full_sun' | 'partial_shade' | 'shade' | null
  water: 'low' | 'regular' | 'high' | null
  germinationDays: string
  germinationTemperature: string
  plantSpacing: string
  rowSpacing: string
}

interface Props {
  value: DyrkningsfaktaState
  onChange: (next: DyrkningsfaktaState) => void
}

export function DyrkningsfaktaFields({ value, onChange }: Props) {
  function patch<K extends keyof DyrkningsfaktaState>(key: K, v: DyrkningsfaktaState[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Sås (måneder)</Label>
        <MonthsPicker
          value={value.sowingMonths}
          onChange={m => patch('sowingMonths', m)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Sådybde (mm)</Label>
          <Input
            type="number"
            min={0}
            value={value.sowingDepthMm == null ? '' : String(value.sowingDepthMm)}
            onChange={e => {
              const v = e.target.value
              patch('sowingDepthMm', v === '' ? null : parseInt(v, 10))
            }}
            placeholder="0 = overflade"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Forspiring</Label>
          <div className="mt-1.5 flex gap-1 p-1 bg-muted rounded-lg">
            <SegmentBtn active={value.preCultivation === true} onClick={() => patch('preCultivation', true)}>Ja</SegmentBtn>
            <SegmentBtn active={value.preCultivation === false} onClick={() => patch('preCultivation', false)}>Nej</SegmentBtn>
            <SegmentBtn active={value.preCultivation === null} onClick={() => patch('preCultivation', null)}>—</SegmentBtn>
          </div>
        </div>
      </div>

      <div>
        <Label>Plant ud (måneder)</Label>
        <MonthsPicker
          value={value.plantingOutMonths}
          onChange={m => patch('plantingOutMonths', m)}
        />
      </div>

      <div>
        <Label>Høst (måneder)</Label>
        <MonthsPicker
          value={value.harvestMonths}
          onChange={m => patch('harvestMonths', m)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Lys</Label>
          <select
            value={value.light ?? ''}
            onChange={e => patch('light', (e.target.value || null) as DyrkningsfaktaState['light'])}
            className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {(['full_sun', 'partial_shade', 'shade'] as const).map(k => (
              <option key={k} value={k}>{LIGHT_META[k].label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Vand</Label>
          <select
            value={value.water ?? ''}
            onChange={e => patch('water', (e.target.value || null) as DyrkningsfaktaState['water'])}
            className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {(['low', 'regular', 'high'] as const).map(k => (
              <option key={k} value={k}>{WATER_META[k].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Spiretid</Label>
          <Input
            value={value.germinationDays}
            onChange={e => patch('germinationDays', e.target.value)}
            placeholder="fx 7-14 dage"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Spiretemp.</Label>
          <Input
            value={value.germinationTemperature}
            onChange={e => patch('germinationTemperature', e.target.value)}
            placeholder="fx 18-22°C"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Planteafstand</Label>
          <Input
            value={value.plantSpacing}
            onChange={e => patch('plantSpacing', e.target.value)}
            placeholder="fx 40 cm"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Rækkeafstand</Label>
          <Input
            value={value.rowSpacing}
            onChange={e => patch('rowSpacing', e.target.value)}
            placeholder="fx 60 cm"
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  )
}

function MonthsPicker({ value, onChange }: { value: number[]; onChange: (months: number[]) => void }) {
  function toggle(m: number) {
    if (value.includes(m)) onChange(value.filter(x => x !== m))
    else onChange([...value, m].sort((a, b) => a - b))
  }
  return (
    <div className="mt-1.5 grid grid-cols-6 gap-1">
      {MONTHS_DA.map(m => {
        const active = value.includes(m.num)
        return (
          <button
            key={m.num}
            type="button"
            onClick={() => toggle(m.num)}
            className={cn(
              'py-1.5 px-2 rounded-md text-xs font-medium border transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:bg-accent/40'
            )}
          >
            {m.short}
          </button>
        )
      })}
    </div>
  )
}

function SegmentBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
        active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
      )}
    >
      {children}
    </button>
  )
}
