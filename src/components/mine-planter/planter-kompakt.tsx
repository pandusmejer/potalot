/**
 * "PlanterKompakt" — MVP 1.0's Mine planter (fase 2).
 *
 * Svarer på ét spørgsmål: HVAD DYRKER JEG LIGE NU? Frøbanken svarer på, hvad
 * man HAR; her er der ingen frøtal, ingen udløb og ingen lagerstatus — kun
 * dyrkningens status, sådato, placering og næste opgave.
 *
 * Én række pr. DYRKNING (en række i plants_v2). Samme sort kan derfor stå
 * flere gange, hver gang med sin egen sådato og placering. Rækken åbner den
 * eksisterende plantedetalje, som også linker tilbage til den oprindelige
 * frøpose ("Oprettet fra Frøbanken").
 *
 * Ren servervisning uden state. Vises kun når MVP_PLANTER.kompaktListe er
 * slået til (mvp-config.ts); den oprindelige forside (MinePlanterClient)
 * ligger urørt og vender tilbage, når MVP slås fra.
 */

import Link from 'next/link'
import { Archive, ChevronRight, Package, Sprout } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EgenPlanteDialog } from '@/components/mine-planter/egen-plante-dialog'
import { PLANT_STATUS_META } from '@/lib/constants'
import { formatDatoKort, formatDatoMedAar, parseDate } from '@/lib/datetime'
import { resolvePlantCard } from '@/lib/images/resolve-potalot-image'
import { plantColor } from '@/lib/plant-color'
import { erOpgaveForsinket, grupperPlanter, naesteOpgavePrPlante } from '@/lib/plante-oversigt'
import type { CalendarTask, GardenLocation, Plant } from '@/lib/types'

const sans = 'var(--font-manrope)'
const gabarito = 'var(--font-gabarito), var(--font-manrope), sans-serif'

interface Props {
  plants: Plant[]
  /** Brugerens opgaver. Tom i demo — så vises der ingen "næste opgave". */
  tasks: CalendarTask[]
  gardenLocations: GardenLocation[]
  /** Dagens dato (YYYY-MM-DD), fra serveren. */
  today: string
  isLoggedIn: boolean
}

/** Det, rækkerne skal bruge for at vise sted, år og næste opgave. */
interface Kontekst {
  naeste: Map<string, CalendarTask>
  stedNavn: Map<string, string>
  today: string
  aarNu: number
}

export function PlanterKompakt({ plants, tasks, gardenLocations, today, isLoggedIn }: Props) {
  const { dyrkes, planlagte, klarTilArkiv } = grupperPlanter(plants)
  const kontekst: Kontekst = {
    naeste: naesteOpgavePrPlante(tasks),
    stedNavn: new Map(gardenLocations.map((s) => [s.id, s.name])),
    today,
    aarNu: parseDate(today).getFullYear(),
  }

  const harIntet = dyrkes.length + planlagte.length + klarTilArkiv.length === 0
  const oversigt = [
    dyrkes.length > 0 ? `${dyrkes.length} ${dyrkes.length === 1 ? 'dyrkning' : 'dyrkninger'} i gang` : null,
    planlagte.length > 0 ? `${planlagte.length} planlagt` : null,
  ].filter(Boolean).join(' · ')

  return (
    <section className="space-y-5" style={{ fontFamily: sans }}>
      <header className="space-y-1">
        <h1
          className="text-[26px] leading-tight text-foreground"
          style={{ fontFamily: gabarito, fontWeight: 600 }}
        >
          Mine planter
        </h1>
        {oversigt && <p className="text-[13px] text-muted-foreground tabular-nums">{oversigt}</p>}
      </header>

      {/* Vejen ind: en dyrkning starter i frøbanken ("Så et frø" på sorten).
          Har brugeren allerede planter i jorden, kan de tilføjes direkte. */}
      <div className="space-y-2">
        <Button asChild className="h-12 w-full gap-2 rounded-xl text-[15px]">
          <Link href="/froebank" className="no-underline">
            <Package className="h-[18px] w-[18px]" /> Så fra min frøbank
          </Link>
        </Button>
        {isLoggedIn && <EgenPlanteDialog gardenLocations={gardenLocations} />}
      </div>

      {harIntet ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[14px] leading-relaxed text-muted-foreground">
          Du dyrker ikke noget endnu. Åbn en sort i din frøbank og tryk &quot;Så et frø&quot;,
          så dukker dyrkningen op her med sine opgaver.
        </p>
      ) : (
        <>
          <Gruppe titel="I gang" plants={dyrkes} kontekst={kontekst} />
          <Gruppe titel="Planlagt" plants={planlagte} kontekst={kontekst} />
          <Gruppe titel="Sæsonen er slut" plants={klarTilArkiv} kontekst={kontekst} />
        </>
      )}

      <Link
        href="/mine-planter/arkiv"
        className="flex items-center gap-2 px-1 text-[13px] text-muted-foreground no-underline hover:text-foreground"
      >
        <Archive className="h-4 w-4" aria-hidden /> Tidligere sæsoner
        <ChevronRight className="ml-auto h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  )

}

function Gruppe({ titel, plants: liste, kontekst }: { titel: string; plants: Plant[]; kontekst: Kontekst }) {
  if (liste.length === 0) return null
  return (
    <div className="space-y-2">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {titel}
      </h2>
      <ul className="overflow-hidden rounded-2xl border border-border bg-card">
        {liste.map((p, i) => (
          <li key={p.id} className={i > 0 ? 'border-t border-border/70' : undefined}>
            <Raekke plant={p} kontekst={kontekst} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Raekke({ plant, kontekst }: { plant: Plant; kontekst: Kontekst }) {
  const { naeste, stedNavn, today, aarNu } = kontekst
  const opgave = naeste.get(plant.id) ?? null
  const billede = resolvePlantCard({
    guideId: plant.guideId,
    name: plant.name,
    variety: plant.variety,
    preferredSrc: plant.primaryImageId,
  })
  const harBillede = billede.source !== 'fallback'
  const { field } = plantColor(plant.name, plant.variety)
  const sort = plant.variety?.trim()
  const status = PLANT_STATUS_META[plant.status]

  // Sådato med årstal, når den ikke er i år — to dyrkninger af samme sort
  // fra forskellige sæsoner skal kunne skelnes.
  const saadato = plant.sowDate
    ? `Sået ${parseDate(plant.sowDate).getFullYear() === aarNu ? formatDatoKort(plant.sowDate) : formatDatoMedAar(plant.sowDate)}`
    : null
  const sted = (plant.gardenLocationId && stedNavn.get(plant.gardenLocationId)) || plant.location || null
  const meta = [saadato, sted].filter(Boolean).join(' · ')
  const forsinket = opgave ? erOpgaveForsinket(opgave, today) : false

  return (
    <Link
      href={`/mine-planter/${plant.id}`}
      className="flex items-center gap-3 px-3 py-2.5 no-underline transition-colors hover:bg-accent/30 active:bg-accent/40"
    >
      <span
        className="relative block h-[60px] w-[48px] shrink-0 overflow-hidden rounded-lg"
        style={{ background: field }}
      >
        {harBillede ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={billede.src}
            alt=""
            width={48}
            height={60}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Sprout className="absolute inset-0 m-auto h-5 w-5 text-white/85" aria-hidden />
        )}
      </span>

      <span className="min-w-0 flex-1">
        {sort && (
          <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {plant.name}
          </span>
        )}
        <span
          className="block truncate text-[16px] leading-snug text-foreground"
          style={{ fontFamily: gabarito, fontWeight: 600 }}
        >
          {sort || plant.name}
        </span>
        {/* Status og fakta på samme linje; den lange status ("Klar til
            udplantning") må ikke æde sortsnavnet. */}
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Badge
            variant={(status.badgeVariant as 'muted') ?? 'muted'}
            className="shrink-0 px-2 py-0 text-[10.5px]"
          >
            {status.label}
          </Badge>
          {meta && <span className="text-[13px] text-muted-foreground">{meta}</span>}
        </span>
        {opgave && (
          <span
            className="mt-0.5 block truncate text-[12.5px]"
            style={{ color: forsinket ? '#8A5A1C' : 'rgba(36,48,31,0.72)' }}
          >
            <span className="font-semibold">{forsinket ? 'Forsinket' : 'Næste'}:</span>{' '}
            {opgave.title} · {formatDatoKort(opgave.date)}
          </span>
        )}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
