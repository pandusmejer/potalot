import Link from 'next/link'
import { PLANT_STATUS_META } from '@/lib/constants'
import type { Plant } from '@/lib/types'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { statusColor } from '@/components/mine-planter/plant-card'
import { forventetSpiring, fokusOpsummering } from '@/lib/afledninger'

interface GreenhouseNowProps {
  plants: Plant[]
}

/**
 * Fokus-prioritet — strippen hedder "I fokus", så den skal vise de
 * 6 mest fokus-værdige planter, ikke de første 6 i arrayet ("en
 * teknisk sandhed der visuelt lyver").
 *
 *   0  Høstklar                    (belønningen venter)
 *   1  Klar til udplantning        (kræver handling)
 *   2  Spiring bør tjekkes         (afledt: "Er den spiret?" /
 *                                   "Tjek spiring" — sået + vinduet
 *                                   nået eller passeret)
 *   3  I vækst / spirer / udplantet
 *   4  Sået, afventer (alt går som planlagt — ingen grund til fokus)
 *
 * Stabil sort bevarer array-rækkefølgen inden for hvert trin.
 */
function fokusPrioritet(plant: Plant): number {
  switch (plant.status) {
    case 'hoestklar':
      return 0
    case 'klar_til_udplantning':
      return 1
    case 'saaet': {
      const spiring = forventetSpiring(plant)
      return spiring?.kind === 'attention' ? 2 : 4
    }
    case 'spirer':
    case 'i_vaekst':
    case 'udplantet':
      return 3
    default:
      return 5
  }
}

export function GreenhouseNow({ plants }: GreenhouseNowProps) {
  const visiblePlants = plants
    .filter(plant => !plant.isArchived)
    .sort((a, b) => fokusPrioritet(a) - fokusPrioritet(b))
    .slice(0, 6)
  if (!visiblePlants.length) return null

  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        {/* "I fokus" — IKKE "Dit drivhus lige nu". Folk dyrker på
            friland, i højbede og altankasser; drivhus-framingen var
            for snæver. */}
        <h2 className="font-serif text-xl leading-tight text-foreground">I fokus</h2>
        {/* "6 i gang" sagde ingenting — den mest presserende bucket
            siger noget: "1 høstklar" / "2 klar til udplantning".
            Beregnes på HELE det aktive sæt, ikke kun de 6 viste. */}
        <p className="text-xs font-medium text-muted-foreground">
          {fokusOpsummering(plants.filter(p => !p.isArchived))}
        </p>
      </div>
      <div className="-mx-4 overflow-hidden sm:mx-0">
        <div className="scrollbar-hide flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:px-0 [-webkit-overflow-scrolling:touch]">
          {visiblePlants.map(plant => {
            // Canonical resolver — aldrig hardcoded paths. Hvis ingen
            // gyldig kilde findes returnerer resolveren placeholder, og
            // vi viser i stedet en neutral pattern-baggrund. Forkert
            // billede er værre end intet billede.
            const { src, source } = resolvePotalotImage({
              guideId: plant.guideId,
              varietySlug: plant.guideId,
              role: 'plant-card',
              preferredSrc: plant.primaryImageId,
            })
            const showImage = source !== 'fallback'
            return (
            <Link
              key={plant.id}
              href={`/mine-planter/${plant.id}`}
              className="group relative h-28 min-w-[31%] max-w-[31%] snap-start overflow-hidden rounded-2xl bg-secondary shadow-soft min-[390px]:min-w-[29%] min-[390px]:max-w-[29%]"
            >
              {showImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img loading="lazy" decoding="async"
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                // Foto-løs fallback: flad status-farvet blok med
                // sortens forbogstav — samme ærlige sprog som
                // VarietyCard i art-rækkerne. Det udvaskede
                // botanical-mønster lignede en fejl i en foto-strip.
                // "Forkert billede er værre end intet billede" —
                // vi viser aldrig en anden sorts foto.
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: statusColor(plant.status) }}
                >
                  <span
                    className="text-[26px] font-extrabold text-white/85"
                    aria-hidden
                  >
                    {(plant.variety ?? plant.name).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,14,10,0.08),rgba(18,14,10,0.72))]" />
              <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                <p className="line-clamp-1 text-[11px] font-semibold leading-4">
                  {plant.name}
                </p>
                {plant.variety && (
                  <p className="line-clamp-1 text-[10px] leading-3 text-white/78">{plant.variety}</p>
                )}
                <p className="mt-1 line-clamp-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/64">
                  {PLANT_STATUS_META[plant.status].label} · {plant.quantity} stk
                </p>
              </div>
            </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
