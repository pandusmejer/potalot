import type { DetailSammenligning } from '@/data/plant-detail'
import { Leaf } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * SAMMENLIGNING — din plante set mod sortens typiske rytme.
 *
 * Anna (14. juni 2026): scoren ("6 dage foran gennemsnittet") føltes som
 * Strava — planter er ikke cykling. Nu er det historie: én rolig dom i
 * serif + en havebog-forklaring i prosa. Perspektiv, ikke point.
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
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
        }}
      >
        Sammenligning
      </p>

      <h2
        className="mt-2 flex items-start gap-2"
        style={{
          fontFamily: serif,
          fontWeight: 600,
          fontSize: 'clamp(26px, 7vw, 31px)',
          lineHeight: 1.05,
          color: '#24301F',
          margin: '8px 0 0',
        }}
      >
        {data.overskrift}
        <Leaf
          className="mt-1 h-5 w-5 shrink-0"
          strokeWidth={2}
          style={{ color: '#617345' }}
          aria-hidden
        />
      </h2>

      <p
        className="mt-3 max-w-[46ch]"
        style={{
          fontFamily: sans,
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.5,
          color: 'rgba(45,42,36,0.74)',
          margin: '12px 0 0',
        }}
      >
        {data.broedtekst}
      </p>
    </section>
  )
}
