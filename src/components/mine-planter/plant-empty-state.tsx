import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Leaf, Plus } from 'lucide-react'

export function PlantEmptyState() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-[linear-gradient(145deg,#223321,#4f6840)] p-5 text-white shadow-soft">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(255,255,255,0.2),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.18))]" />
      <div className="relative flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white">
          <Leaf className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl leading-tight">Ingen aktive planter endnu</h2>
          <p className="mt-2 text-sm leading-6 text-white/76">
            Start med at tilføje en plante fra din frøbank, når du sår, forspirer eller planter ud.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm" className="bg-white/90 text-primary hover:bg-white">
              <Link href="/froebank">
                Tilføj fra frøbank
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-white/28 bg-white/10 text-white hover:bg-white/16 hover:text-white">
              <Link href="/froebank">
                <Plus className="h-4 w-4" />
                Opret ny plante
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
