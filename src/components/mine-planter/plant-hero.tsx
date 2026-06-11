import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PlantHeroProps {
  activeCount: number
  varietyCount: number
}

export function PlantHero({ activeCount, varietyCount }: PlantHeroProps) {
  // Kompakt hero (V2.2): højde reduceret ~30%. Det er Planter-siden,
  // ikke en kampagneside — heroen må ikke stjæle fokus fra planterne.
  // Tagline droppet (sidens indhold forklarer sig selv); CTA flyttet
  // op på højre side så hero kun er ét tekstblok højt.
  return (
    <section className="relative min-h-[128px] overflow-hidden rounded-[1.75rem] bg-[#24301f] px-5 py-4 text-white shadow-lift sm:min-h-[140px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/heroes-sider/hero-planter-spirer.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,28,16,0.86),rgba(18,28,16,0.52)_55%,rgba(18,28,16,0.18))]" />
      <div className="relative flex h-full min-h-[96px] items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Levende dyrkning
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-none text-white">
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
