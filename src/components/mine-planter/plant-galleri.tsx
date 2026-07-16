import type { DetailBillede } from '@/data/plant-detail'

const sans = 'var(--font-manrope)'

/**
 * BILLEDER — plantens egen fotostrøm (statisk, kuraterede billeder).
 *
 * Spec: "Ikke grid. Store billeder. Føles som Apple Photos." Vandret
 * strøm af kuraterede makrofotos.
 *
 * Bruges KUN til demo-browsing. Logget-ind brugere får det interaktive
 * <PlantFotoManager>, hvor de kan tilføje/skifte egne fotos. (Den gamle
 * "Tilføj billede"-flade her var en død knap uden handler.)
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
      </div>
    </section>
  )
}
