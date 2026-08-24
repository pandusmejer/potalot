'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MONTHS_DA, LIGHT_META, WATER_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { KildeBadge, type KildeType } from './kilde-badge'

export interface DyrkningsfaktaState {
  sowingMonths: number[]
  sowingDepthMm: number | null
  preCultivation: boolean | null
  plantingOutMonths: number[]
  harvestMonths: number[]
  light: 'full_sun' | 'partial_shade' | 'shade' | null
  water: 'low' | 'regular' | 'high' | null
  soil: string
  germinationDays: string
  germinationTemperature: string
  plantSpacing: string
  rowSpacing: string
}

interface Props {
  value: DyrkningsfaktaState
  onChange: (next: DyrkningsfaktaState) => void
  /**
   * Kilde-badge pr. felt (kun autofyldte/'egen'-felter — tomme felter får
   * ALDRIG badge, jf. Annas regel). Udeladt (edit-dialog) → ingen badges.
   */
  fieldBadges?: Partial<Record<keyof DyrkningsfaktaState, KildeType>>
  /**
   * Autofill-kontekst: tomme tekst-/tal-/select-felter viser placeholderen
   * "Ikke udfyldt endnu" i stedet for eksempel-placeholders. Måneds-grids
   * markeres ikke (fravalg ER synligt dér).
   */
  autofillPlaceholders?: boolean
  /**
   * Grupperet visning (oprettelse): kernefelter synlige, avancerede felter
   * (sådybde, jord, spiretid, spiretemp, planteafstand, rækkeafstand) bag
   * "Flere dyrkningsoplysninger". Auto-åben når et avanceret felt har værdi
   * eller badge — autofyldt må aldrig gemmes væk. Udeladt → flad visning
   * (edit-dialogen, uændret).
   */
  groupAdvanced?: boolean
  /**
   * Felter Potalot POSITIVT ved ikke bruges for denne art/sort
   * (se lib/froebank-feltrelevans.ts). De FJERNES aldrig — de flyttes ned
   * under "Flere dyrkningsoplysninger", så en særmetode altid kan
   * registreres. Udeladt → alt står som hidtil.
   */
  irrelevanteFelter?: Set<keyof DyrkningsfaktaState>
}

const AVANCEREDE: (keyof DyrkningsfaktaState)[] = [
  'sowingDepthMm', 'soil', 'germinationDays', 'germinationTemperature', 'plantSpacing', 'rowSpacing',
]

function harIndhold(key: keyof DyrkningsfaktaState, v: DyrkningsfaktaState): boolean {
  const x = v[key]
  if (x === null || x === undefined) return false
  if (Array.isArray(x)) return x.length > 0
  if (typeof x === 'string') return x.trim().length > 0
  return true
}

export function DyrkningsfaktaFields({ value, onChange, fieldBadges, autofillPlaceholders, groupAdvanced, irrelevanteFelter }: Props) {
  // Autofyldt må aldrig gemmes væk: folden auto-åbner når et avanceret felt
  // FÅR indhold/badge (også efter mount — fx når "Udfyld med Potalots forslag"
  // lander senere). Kun ved overgangen tom→indhold, så brugeren stadig selv
  // kan folde sammen bagefter.
  const harAvanceretIndhold = AVANCEREDE.some(k => harIndhold(k, value) || fieldBadges?.[k])
  const [visAvanceret, setVisAvanceret] = useState(groupAdvanced ? harAvanceretIndhold : true)
  const forrigeIndhold = useRef(harAvanceretIndhold)
  useEffect(() => {
    if (groupAdvanced && harAvanceretIndhold && !forrigeIndhold.current) setVisAvanceret(true)
    forrigeIndhold.current = harAvanceretIndhold
  }, [groupAdvanced, harAvanceretIndhold])

  // Irrelevante felter demoteres — de tæller derfor ALDRIG med i
  // auto-åbningen ovenfor (ellers ville et skjult "Forkultivering: Nej" folde
  // hele sektionen ud hver gang og gøre skjulet meningsløst).
  //
  // Demotering er ENVEJS så længe formularen er åben: et felt må gerne
  // PROMOVERES op i standardvisningen (brugeren svarer "Ja" til forkultivering →
  // feltet hører til dér), men det må aldrig rives væk under fingeren igen,
  // hvis hun fortryder. Ref'en nulstilles ved unmount — dvs. når man går
  // tilbage til trin 1 eller lukker redigér-dialogen.
  const harStaaetFrem = useRef(new Set<keyof DyrkningsfaktaState>())
  const skjult = (k: keyof DyrkningsfaktaState): boolean => {
    if (!irrelevanteFelter?.has(k)) {
      harStaaetFrem.current.add(k)
      return false
    }
    return !harStaaetFrem.current.has(k)
  }
  const [visDemoteredeFlade, setVisDemoteredeFlade] = useState(false)

  function patch<K extends keyof DyrkningsfaktaState>(key: K, v: DyrkningsfaktaState[K]) {
    onChange({ ...value, [key]: v })
  }

  /** Placeholder-regel: autofill-kontekst + tomt felt → "Ikke udfyldt endnu". */
  function ph(key: keyof DyrkningsfaktaState, eksempel: string): string {
    return autofillPlaceholders && !harIndhold(key, value) ? 'Ikke udfyldt endnu' : eksempel
  }

  function FeltLabel({ tekst, felt }: { tekst: string; felt: keyof DyrkningsfaktaState }) {
    const badge = fieldBadges?.[felt]
    return (
      <div className="flex items-center gap-1.5">
        <Label>{tekst}</Label>
        {badge && <KildeBadge kilde={badge} />}
      </div>
    )
  }

  const saas = (
    <div>
      <FeltLabel tekst="Sås (måneder)" felt="sowingMonths" />
      <MonthsPicker value={value.sowingMonths} onChange={m => patch('sowingMonths', m)} />
      {autofillPlaceholders && fieldBadges?.sowingMonths && fieldBadges.sowingMonths !== 'egen' && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Potalots forslag tager udgangspunkt i danske dyrkningsforhold — ret dem, hvis dine er anderledes.
        </p>
      )}
    </div>
  )

  const forspiring = (
    <div>
      <FeltLabel tekst="Forkultivering" felt="preCultivation" />
      <div className="mt-1.5 flex gap-1 p-1 bg-muted rounded-lg">
        <SegmentBtn active={value.preCultivation === true} onClick={() => patch('preCultivation', true)}>Ja</SegmentBtn>
        <SegmentBtn active={value.preCultivation === false} onClick={() => patch('preCultivation', false)}>Nej</SegmentBtn>
        <SegmentBtn active={value.preCultivation === null} onClick={() => patch('preCultivation', null)}>—</SegmentBtn>
      </div>
    </div>
  )

  const saadybde = (
    <div>
      <FeltLabel tekst="Sådybde (mm)" felt="sowingDepthMm" />
      <Input
        type="number"
        min={0}
        value={value.sowingDepthMm == null ? '' : String(value.sowingDepthMm)}
        onChange={e => {
          const v = e.target.value
          patch('sowingDepthMm', v === '' ? null : parseInt(v, 10))
        }}
        placeholder={ph('sowingDepthMm', 'fx 5 · skriv 0 for overflade')}
        className="mt-1.5"
      />
      {/* Tomt felt = ukendt. 0 er et rigtigt svar — bekræft det tilbage,
          så brugeren kan se forskel på "ved ikke" og "sås på overfladen". */}
      {value.sowingDepthMm === 0 && (
        <p className="text-[11px] text-muted-foreground mt-1">Sås på overfladen.</p>
      )}
    </div>
  )

  const plantUd = (
    <div>
      <FeltLabel tekst="Plant ud (måneder)" felt="plantingOutMonths" />
      <MonthsPicker value={value.plantingOutMonths} onChange={m => patch('plantingOutMonths', m)} />
    </div>
  )

  const hoest = (
    <div>
      <FeltLabel tekst="Høst (måneder)" felt="harvestMonths" />
      <MonthsPicker value={value.harvestMonths} onChange={m => patch('harvestMonths', m)} />
    </div>
  )

  const lysVand = (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FeltLabel tekst="Lys" felt="light" />
        <select
          value={value.light ?? ''}
          onChange={e => patch('light', (e.target.value || null) as DyrkningsfaktaState['light'])}
          className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="">{autofillPlaceholders && value.light == null ? 'Ikke udfyldt endnu' : '—'}</option>
          {(['full_sun', 'partial_shade', 'shade'] as const).map(k => (
            <option key={k} value={k}>{LIGHT_META[k].label}</option>
          ))}
        </select>
      </div>
      <div>
        <FeltLabel tekst="Vand" felt="water" />
        <select
          value={value.water ?? ''}
          onChange={e => patch('water', (e.target.value || null) as DyrkningsfaktaState['water'])}
          className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="">{autofillPlaceholders && value.water == null ? 'Ikke udfyldt endnu' : '—'}</option>
          {(['low', 'regular', 'high'] as const).map(k => (
            <option key={k} value={k}>{WATER_META[k].label}</option>
          ))}
        </select>
      </div>
    </div>
  )

  const spire = (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FeltLabel tekst="Spiretid" felt="germinationDays" />
        <Input
          value={value.germinationDays}
          onChange={e => patch('germinationDays', e.target.value)}
          placeholder={ph('germinationDays', 'fx 7-14 dage')}
          className="mt-1.5"
        />
      </div>
      <div>
        <FeltLabel tekst="Spiretemperatur" felt="germinationTemperature" />
        <Input
          value={value.germinationTemperature}
          onChange={e => patch('germinationTemperature', e.target.value)}
          placeholder={ph('germinationTemperature', 'fx 18-22°C')}
          className="mt-1.5"
        />
      </div>
    </div>
  )

  const afstand = (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FeltLabel tekst="Planteafstand" felt="plantSpacing" />
        <Input
          value={value.plantSpacing}
          onChange={e => patch('plantSpacing', e.target.value)}
          placeholder={ph('plantSpacing', 'fx 40 cm')}
          className="mt-1.5"
        />
      </div>
      <div>
        <FeltLabel tekst="Rækkeafstand" felt="rowSpacing" />
        <Input
          value={value.rowSpacing}
          onChange={e => patch('rowSpacing', e.target.value)}
          placeholder={ph('rowSpacing', 'fx 60 cm')}
          className="mt-1.5"
        />
      </div>
    </div>
  )

  const jord = (
    <div>
      <FeltLabel tekst="Jord" felt="soil" />
      <Input
        value={value.soil}
        onChange={e => patch('soil', e.target.value)}
        placeholder={ph('soil', 'fx veldrænet, næringsrig')}
        className="mt-1.5"
      />
    </div>
  )

  // ── Grupperet visning (oprettelse): kerne + "Flere dyrkningsoplysninger" ──
  if (groupAdvanced) {
    return (
      <div className="space-y-4">
        {saas}
        {!skjult('preCultivation') && forspiring}
        {!skjult('plantingOutMonths') && plantUd}
        {hoest}
        {lysVand}

        <button
          type="button"
          onClick={() => setVisAvanceret(v => !v)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', visAvanceret && 'rotate-180')} />
          Flere dyrkningsoplysninger
        </button>

        {visAvanceret && (
          <div className="space-y-4">
            {/* Demoterede felter først: de er stadig fuldt redigerbare —
                brugeren skal altid kunne registrere en særmetode. */}
            {skjult('preCultivation') && forspiring}
            {skjult('plantingOutMonths') && plantUd}
            <div className="grid grid-cols-2 gap-3">
              {saadybde}
              {jord}
            </div>
            {spire}
            {afstand}
          </div>
        )}
      </div>
    )
  }

  // ── Flad visning (edit-dialogen — uændret layout + Jord til sidst) ──
  // Er intet demoteret, ser den ud PRÆCIS som før. Er noget demoteret, får
  // den samme "Flere dyrkningsoplysninger"-fold som oprettelsen, så
  // felterne stadig kan findes og udfyldes.
  const demoterede = [
    skjult('preCultivation') ? <div key="forspiring">{forspiring}</div> : null,
    skjult('plantingOutMonths') ? <div key="plantUd">{plantUd}</div> : null,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      {saas}
      {skjult('preCultivation') ? (
        saadybde
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {saadybde}
          {forspiring}
        </div>
      )}
      {!skjult('plantingOutMonths') && plantUd}
      {hoest}
      {lysVand}
      {spire}
      {afstand}
      {jord}

      {demoterede.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setVisDemoteredeFlade(v => !v)}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', visDemoteredeFlade && 'rotate-180')} />
            Flere dyrkningsoplysninger
          </button>
          {visDemoteredeFlade && <div className="space-y-4">{demoterede}</div>}
        </>
      )}
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
