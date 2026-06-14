import type { DetailSammenligning } from '@/data/plant-detail'
import { Info, Leaf } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const GREEN = '#617345'

/**
 * SAMMENLIGNING — din plante set mod sortens typiske rytme.
 *
 * Anna (spec + vidensmodel): "Meget vigtig. Ikke gamification. Ikke
 * score. Bare perspektiv." Det er forløberen for sammenligningslaget i
 * vidensmodellen ("din spiring 5 dage / master 7–14"). To rolige søjler
 * — din plante (grøn) og det typiske (gråt) — og en venlig dom i serif.
 */
export function PlantSammenligning({ data }: { data: DetailSammenligning }) {
  return (
    <section
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: 'linear-gradient(155deg, #F4F0E2 0%, #EFEADB 100%)',
        border: '1px solid rgba(36,48,31,0.10)',
        padding: 22,
      }}
    >
      <button
        type="button"
        aria-label="Om sammenligningen"
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: 'rgba(36,48,31,0.06)', color: 'rgba(36,48,31,0.50)' }}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>

      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
        }}
      >
        Sammenligning
      </p>

      <h2
        className="mt-2 flex items-center gap-2"
        style={{
          fontFamily: serif,
          fontWeight: 600,
          fontSize: 'clamp(25px, 6.8vw, 30px)',
          lineHeight: 1.05,
          color: '#24301F',
          margin: 0,
        }}
      >
        {data.verdict}
        <Leaf className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: GREEN }} aria-hidden />
      </h2>

      <p
        className="mt-1.5 max-w-[42ch]"
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.45,
          color: 'rgba(45,42,36,0.72)',
        }}
      >
        {data.forklaring}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <CompareColumn
          label="Din plante"
          maaling={data.maaling}
          value={data.dinValue}
          progress={data.dinProgress}
          accent={GREEN}
          valueColor={GREEN}
        />
        <CompareColumn
          label="Typisk"
          maaling={data.maaling}
          value={data.typiskValue}
          progress={data.typiskProgress}
          accent="rgba(36,48,31,0.26)"
          valueColor="rgba(36,48,31,0.55)"
        />
      </div>
    </section>
  )
}

function CompareColumn({
  label,
  maaling,
  value,
  progress,
  accent,
  valueColor,
}: {
  label: string
  maaling: string
  value: string
  progress: number
  accent: string
  valueColor: string
}) {
  return (
    <div>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'rgba(36,48,31,0.46)',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 500,
          color: 'rgba(36,48,31,0.55)',
          margin: '3px 0 0',
        }}
      >
        {maaling}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 14.5,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: valueColor,
          margin: '1px 0 0',
        }}
      >
        {value}
      </p>
      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(36,48,31,0.10)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.round(progress * 100)}%`, background: accent }}
        />
      </div>
    </div>
  )
}
