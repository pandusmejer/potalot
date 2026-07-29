import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PlantHeroProps {
  activeCount: number
  varietyCount: number
}

export function PlantHero({ activeCount, varietyCount }: PlantHeroProps) {
  // Kompakt hero (V2.3): yderligere ~17% ned (V2.2 tog de første 30%).
  // "Når jeg åbner Planter, vil jeg se planter. Ikke en plakat for
  // Planter." Kicker droppet, titel en tand mindre, strammere padding.
  return (
    <section className="relative min-h-[104px] overflow-hidden rounded-[1.75rem] bg-[#24301f] px-5 py-3.5 text-white shadow-lift sm:min-h-[112px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async"
        src="/images/heroes-sider/hero-planter-spirer.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,28,16,0.86),rgba(18,28,16,0.52)_55%,rgba(18,28,16,0.18))]" />
      <div className="relative flex h-full min-h-[76px] items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-[26px] leading-none text-white">
            Mine planter
          </h1>
          <p className="mt-2 inline-flex rounded-full bg-white/14 px-2.5 py-1 text-xs font-medium text-white/78 backdrop-blur-sm">
            {activeCount} aktive planter • {varietyCount} sorter
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="shrink-0 bg-white/90 text-primary hover:bg-white"
        >
          <Link href="/froebank">
            <Plus className="h-4 w-4" />
            Tilføj
          </Link>
        </Button>
      </div>
    </section>
  )
}
