import type { DetailBillede } from '@/data/plant-detail'
import { Plus } from 'lucide-react'

const sans = 'var(--font-manrope)'

/**
 * BILLEDER — plantens egen fotostrøm.
 *
 * Spec: "Ikke grid. Store billeder. Føles som Apple Photos." Vandret
 * strøm af kuraterede makrofotos, afsluttet med en diskret "Tilføj
 * billede"-flade så brugerens egne fotos har et naturligt hjem.
 */
export function PlantGalleri({ billeder }: { billeder: DetailBillede[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'rgba(36,48,31,0.52)',
          }}
        >
          Billeder
        </h2>
        <span
          className="flex items-center gap-1"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.50)',
          }}
        >
          Se alle <span aria-hidden>→</span>
        </span>
      </div>

      <div
        className="mt-4 -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {billeder.map((b) => (
          <div
            key={b.src}
            className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[16px]"
            style={{ boxShadow: '0 6px 16px rgba(26,34,22,0.10)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.src} alt={b.alt} className="h-full w-full object-cover" />
          </div>
        ))}

        {/* Tilføj billede — diskret flade til brugerens egne fotos. */}
        <button
          type="button"
          className="flex h-[104px] w-[104px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[16px] transition-transform active:scale-95"
          style={{
            background: 'var(--surface-2)',
            border: '1.5px dashed rgba(36,48,31,0.20)',
            color: 'rgba(36,48,31,0.52)',
          }}
        >
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
          <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600 }}>
            Tilføj billede
          </span>
        </button>
      </div>
    </section>
  )
}
