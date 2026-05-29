import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PlantHeroProps {
  activeCount: number
  varietyCount: number
}

export function PlantHero({ activeCount, varietyCount }: PlantHeroProps) {
  return (
    <section className="relative min-h-[180px] overflow-hidden rounded-[1.75rem] bg-[#24301f] px-5 py-4 text-white shadow-lift sm:min-h-[200px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-planter-spirer.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,28,16,0.86),rgba(18,28,16,0.52)_55%,rgba(18,28,16,0.18))]" />
      <div className="relative flex min-h-[132px] max-w-[25rem] flex-col items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Levende dyrkning
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-none text-white">
            Mine planter
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/82">
            Følg det, du dyrker lige nu - fra første spire til sidste høst.
          </p>
          <p className="mt-2 inline-flex rounded-full bg-white/14 px-2.5 py-1 text-xs font-medium text-white/78 backdrop-blur-sm">
            {activeCount} aktive planter • {varietyCount} sorter
          </p>
        </div>
        <Button asChild variant="secondary" size="sm" className="bg-white/90 text-primary hover:bg-white">
          <Link href="/froebank">
            <Plus className="h-4 w-4" />
            Tilføj plante
          </Link>
        </Button>
      </div>
    </section>
  )
}
