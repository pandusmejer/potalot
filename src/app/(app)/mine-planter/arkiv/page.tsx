import Link from 'next/link'
import { ArrowLeft, ArrowRight, Archive } from 'lucide-react'
import { getAllPlants } from '@/actions/mine-planter'

export const dynamic = 'force-dynamic'

const sans = 'var(--font-manrope)'

/**
 * Sæsonarkiv — de arkiverede planter samlet ét pålideligt sted. Hvert kort
 * åbner plantens detalje-side, hvor den kan hentes tilbage ("Fjern fra arkiv")
 * eller slettes. Både Planter ("Tidligere sæsoner") og Havebogens "Historien
 * fortsætter" peger hertil, så flowet ikke længere ender i heroen eller i tomme
 * klik.
 */
export default async function ArkivPage() {
  const plants = await getAllPlants()
  const arkiverede = plants.filter(p => p.isArchived)

  return (
    <div className="w-full max-w-xl" style={{ paddingBottom: 40 }}>
      <Link href="/mine-planter" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground no-underline" style={{ marginBottom: 20 }}>
        <ArrowLeft className="h-4 w-4" /> Mine planter
      </Link>

      <p className="uppercase" style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(36,48,31,0.5)', margin: '0 0 6px' }}>
        Sæsonarkiv
      </p>
      <h1 className="text-3xl font-serif text-foreground" style={{ margin: '0 0 20px' }}>Tidligere sæsoner</h1>

      {arkiverede.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
          <Archive className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.7} />
          <p className="mt-3 text-sm text-foreground">Du har ingen arkiverede planter endnu.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Når en sæson er slut, kan du arkivere en plante fra dens side. Så samles den her.
          </p>
        </div>
      ) : (
        <div style={{ background: '#F5F2EA', border: '1px solid rgba(36,48,31,0.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(36,48,31,0.04)' }}>
          {arkiverede.map((plant, i) => (
            <Link
              key={plant.id}
              href={`/mine-planter/${plant.id}`}
              className="group flex items-center gap-3 transition-colors active:bg-[rgba(36,48,31,0.04)]"
              style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid rgba(36,48,31,0.07)' : 'none' }}
            >
              <Archive className="h-[18px] w-[18px] shrink-0" strokeWidth={2} style={{ color: 'rgba(36,48,31,0.45)' }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate" style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: '#24301F' }}>
                  {plant.name}{plant.variety ? ` ${plant.variety}` : ''}{plant.growingYear ? ` · ${plant.growingYear}` : ''}
                </span>
                <span className="block" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(36,48,31,0.55)', margin: '2px 0 0' }}>
                  Åbn for at hente tilbage eller slette
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} style={{ color: '#5A7038' }} aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
