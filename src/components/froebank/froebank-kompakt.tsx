'use client'

/**
 * "FroebankKompakt" — MVP 1.0's kompakte frøbank (fase 1).
 *
 * Én tæt liste i stedet for mappestakken, så også store samlinger kan
 * overskues: thumbnail · art · sort · beholdning · bedst før · status.
 * Vises kun når MVP_FROEBANK.kompaktListe er slået til (mvp-config.ts);
 * mappestakken (InventoryArchiveStack + SeedBankFolderPanel) ligger urørt
 * og vender tilbage, når MVP slås fra.
 *
 * Komponenten ejer INGEN data- eller filterlogik. Den får allerede
 * filtrerede og sorterede sorter fra FroebankBrowser og genbruger:
 *   - resolveSeedCard → de eksisterende frøkort-fotos (vist som thumbnails;
 *     originalfilerne og deres referencer er uændrede)
 *   - froebank-grupper/froebank-liste → beholdning og udløb, afledt ved visning
 *   - /froebank/[id] → detaljer og redigering, /froebank/tilfoej → scan m.m.
 */

import Link from 'next/link'
import { Camera, ChevronRight, Plus, Search, SlidersHorizontal, Sprout, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { INVENTORY_STATUS_META, manglerOplysninger } from '@/lib/constants'
import { plantColor } from '@/lib/plant-color'
import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import { ThumbImg } from '@/components/ui/thumb-img'
import type { SortsGruppe } from '@/lib/froebank-grupper'
import {
  maengdeForSort, maengdeTekst, udloebForSort, udloebMaerkat, udloebTekst,
  UDLOEBET_FORKLARING, type ArtsValg,
} from '@/lib/froebank-liste'
import type { InventoryItem } from '@/lib/types'
import type { SortOrder } from './filter-bottom-sheet'

const sans = 'var(--font-manrope)'
const gabarito = 'var(--font-gabarito), var(--font-manrope), sans-serif'

const SORTERINGER: { id: SortOrder; label: string }[] = [
  // Standard = frøbankens hidtidige orden: fastgjorte, favoritter, så art A–Å.
  { id: 'standard', label: 'Standard' },
  { id: 'az', label: 'Sort A–Å' },
  { id: 'za', label: 'Sort Å–A' },
  { id: 'stock', label: 'Færrest frø først' },
  { id: 'expiry', label: 'Udløber først' },
  { id: 'recent', label: 'Senest tilføjet' },
]

export interface KompaktRaekke {
  /** Posen der repræsenterer sorten i den viste rækkefølge. */
  item: InventoryItem
  /** Sortens kanoniske gruppe — beregnet på HELE frøbanken, ikke på filtret. */
  gruppe: SortsGruppe
}

interface Props {
  raekker: KompaktRaekke[]
  antalSorter: number
  antalPoser: number
  antalUdloeberSnart: number
  erTomBank: boolean

  soegning: string
  onSoegning: (v: string) => void

  kategorier: { id: string; label: string; count: number }[]
  aktivKategori: string
  onKategori: (id: string) => void

  arter: ArtsValg[]
  aktivArt: string
  onArt: (slug: string) => void

  sortering: SortOrder
  onSortering: (s: SortOrder) => void

  udloeberSnartAktiv: boolean
  onToggleUdloeberSnart: () => void

  /** Øvrige aktive filtre fra filterarket (underkategori, mangler billede …). */
  filterChips: { id: string; label: string }[]
  onFjernFilterChip: (id: string) => void
  onAabnFiltre: () => void
  onNulstil: () => void
}

export function FroebankKompakt(props: Props) {
  const {
    raekker, antalSorter, antalPoser, antalUdloeberSnart, erTomBank,
    soegning, onSoegning, kategorier, aktivKategori, onKategori,
    arter, aktivArt, onArt, sortering, onSortering,
    udloeberSnartAktiv, onToggleUdloeberSnart,
    filterChips, onFjernFilterChip, onAabnFiltre, onNulstil,
  } = props

  // Kategorirækken er kun værd at vise, når der er mere end ét sted at gå hen.
  const visKategorier = kategorier.filter((k) => k.count > 0 || k.id === aktivKategori)
  const harUdloebne = raekker.some((r) => udloebForSort(r.gruppe.poser).antalUdloebet > 0)
  const harAktiveFiltre =
    aktivArt !== 'alle' || udloeberSnartAktiv || filterChips.length > 0 || soegning.trim() !== ''

  return (
    <section className="space-y-4" style={{ fontFamily: sans }}>
      {/* Titel + ét roligt overblik (ingen dashboard-tal, kun optælling). */}
      <header className="space-y-1">
        <h1
          className="text-[26px] leading-tight text-foreground"
          style={{ fontFamily: gabarito, fontWeight: 600 }}
        >
          Min frøbank
        </h1>
        {!erTomBank && (
          <p className="text-[13px] text-muted-foreground tabular-nums">
            {antalSorter} {antalSorter === 1 ? 'sort' : 'sorter'} · {antalPoser}{' '}
            {antalPoser === 1 ? 'pose' : 'poser'}
            {antalUdloeberSnart > 0 && ` · ${antalUdloeberSnart} udløber snart`}
          </p>
        )}
      </header>

      {/* Primære handlinger: Scan frøpose + manuel. Begge fører ind i det
          EKSISTERENDE tilføj-flow (/froebank/tilfoej) — intet nyt flow. */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="h-12 gap-2 rounded-xl text-[15px]">
            <Link href="/froebank/tilfoej?mode=camera" className="no-underline">
              <Camera className="h-[18px] w-[18px]" /> Scan frøpose
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 gap-2 rounded-xl text-[15px]">
            <Link href="/froebank/tilfoej?mode=manuel" className="no-underline">
              <Plus className="h-[18px] w-[18px]" /> Tilføj manuelt
            </Link>
          </Button>
        </div>
        <Link
          href="/froebank/tilfoej"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          Flere måder: upload billede, link, Excel, ønskeliste
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!erTomBank && (
        <div className="space-y-2">
          {/* Søgning + filterark (det eksisterende FilterBottomSheet). */}
          <div className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Søg i frøbanken</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={soegning}
                onChange={(e) => onSoegning(e.target.value)}
                placeholder="Søg art eller sort"
                className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <button
              type="button"
              onClick={onAabnFiltre}
              aria-label="Flere filtre"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent/40"
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </button>
          </div>

          {visKategorier.length > 1 && (
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
              {visKategorier.map((k) => (
                <Chip
                  key={k.id}
                  aktiv={k.id === aktivKategori}
                  onClick={() => onKategori(k.id)}
                >
                  {k.label} <span className="tabular-nums opacity-70">{k.count}</span>
                </Chip>
              ))}
            </div>
          )}

          {/* Art + sortering: native vælgere — hurtige på mobil og skalerer
              til mange arter uden en lang chip-række. */}
          <div className="grid grid-cols-2 gap-2">
            <Vaelger label="Art" value={aktivArt} onChange={onArt}>
              <option value="alle">Alle arter</option>
              {arter.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.label} ({a.antalSorter})
                </option>
              ))}
            </Vaelger>
            <Vaelger
              label="Sortér"
              value={sortering}
              onChange={(v) => onSortering(v as SortOrder)}
            >
              {SORTERINGER.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Vaelger>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Chip aktiv={udloeberSnartAktiv} onClick={onToggleUdloeberSnart}>
              Udløber snart
              {antalUdloeberSnart > 0 && (
                <span className="tabular-nums opacity-70">{antalUdloeberSnart}</span>
              )}
            </Chip>
            {filterChips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onFjernFilterChip(c.id)}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-[13px] font-medium text-primary-foreground"
              >
                {c.label} <X className="h-3 w-3" strokeWidth={2.4} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Listen */}
      {raekker.length > 0 ? (
        <>
          <ul className="overflow-hidden rounded-2xl border border-border bg-card">
            {raekker.map((r, i) => (
              <li key={r.item.id} className={i > 0 ? 'border-t border-border/70' : undefined}>
                <Raekke raekke={r} />
              </li>
            ))}
          </ul>
          {harUdloebne && (
            <p className="px-1 text-[12.5px] leading-snug text-muted-foreground">
              <span className="font-semibold" style={{ color: '#6E5527' }}>UDLØBET</span>{' '}
              betyder, at bedst før-datoen er passeret. {UDLOEBET_FORKLARING}
            </p>
          )}
        </>
      ) : erTomBank ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[14px] leading-relaxed text-muted-foreground">
          Din frøbank er tom. Scan din første frøpose, eller tilføj den manuelt,
          så holder Potalot styr på sort, antal og bedst før.
        </p>
      ) : soegning.trim() !== '' ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-border px-4 py-5">
          <p className="text-[14px] text-muted-foreground">
            Vi kender ikke sorten endnu. Du kan stadig oprette den manuelt,
            og vi hjælper med de oplysninger, vi har.
          </p>
          <Link
            href={`/froebank/tilfoej?mode=manuel&navn=${encodeURIComponent(soegning.trim())}`}
            className="no-underline inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/50"
          >
            Opret &quot;{soegning.trim()}&quot;
          </Link>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-dashed border-border px-4 py-5 text-center">
          <p className="text-[14px] text-muted-foreground">Ingen frø matcher de valgte filtre.</p>
          {harAktiveFiltre && (
            <Button variant="outline" size="sm" onClick={onNulstil}>Nulstil filtre</Button>
          )}
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────

function Raekke({ raekke }: { raekke: KompaktRaekke }) {
  const { item, gruppe } = raekke
  const flerePoser = gruppe.antalPoser > 1

  // Samme billedregel som frøkortet: har sorten flere poser, er fotoet
  // gruppens (deterministisk valgt) — ellers posens eget, ellers frøkortet.
  const billede = resolveSeedCard({
    guideId: item.guideId,
    name: item.name,
    variety: item.variety,
    preferredSrc: flerePoser ? gruppe.forsidefoto : item.primaryImageId,
  })
  const harBillede = billede.source !== 'fallback'
  const { field } = plantColor(item.name, item.variety)

  const ufuldstaendig = manglerOplysninger(item)
  const sort = item.variety?.trim()
  const udloeb = udloebForSort(gruppe.poser)
  const maerkat = udloebMaerkat(udloeb)
  const bedstFoer = udloebTekst(udloeb)
  const status = item.status !== 'i_froebank' ? INVENTORY_STATUS_META[item.status]?.label : null

  const meta = [
    maengdeTekst(maengdeForSort(gruppe)),
    bedstFoer,
    flerePoser ? `${gruppe.antalPoser} poser` : null,
  ].filter(Boolean)

  return (
    <Link
      href={`/froebank/${item.id}`}
      className="flex items-center gap-3 px-3 py-2.5 no-underline transition-colors hover:bg-accent/30 active:bg-accent/40"
    >
      {/* Thumbnail 48×60 (frøkortets 4:5-format). Brugerens egne fotos hentes
          i lille udgave (ThumbImg → /_next/image); originalen er uændret og
          bruges af detaljevisningen. loading="lazy" holder store samlinger lette. */}
      <span
        className="relative block h-[60px] w-[48px] shrink-0 overflow-hidden rounded-lg"
        style={{ background: field }}
      >
        {harBillede ? (
          <ThumbImg
            src={billede.src}
            width={48}
            height={60}
            className="h-full w-full object-cover"
          />
        ) : (
          <Sprout className="absolute inset-0 m-auto h-5 w-5 text-white/85" aria-hidden />
        )}
      </span>

      <span className="min-w-0 flex-1">
        {sort && !ufuldstaendig && (
          <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {item.name}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span
            className="truncate text-[16px] leading-snug text-foreground"
            style={{ fontFamily: gabarito, fontWeight: 600 }}
          >
            {sort && !ufuldstaendig ? sort : item.name}
          </span>
          {item.isFavorite && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-current text-[#B8862F]" aria-label="Favorit" />
          )}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground tabular-nums">
          {meta.join(' · ')}
        </span>
        {(maerkat || status || ufuldstaendig) && (
          <span className="mt-1 flex flex-wrap gap-1">
            {maerkat && (
              <Maerkat title={UDLOEBET_FORKLARING} background="rgba(150,116,58,0.15)" color="#6E5527">
                {maerkat}
              </Maerkat>
            )}
            {ufuldstaendig && (
              <Maerkat background="rgba(86,99,55,0.14)" color="#3D5626">Mangler oplysninger</Maerkat>
            )}
            {status && (
              <Maerkat background="rgba(36,48,31,0.07)" color="rgba(36,48,31,0.72)">{status}</Maerkat>
            )}
          </span>
        )}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}

function Maerkat({
  children, background, color, title,
}: {
  children: React.ReactNode
  background: string
  color: string
  title?: string
}) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-full px-2 py-[1px] text-[10.5px] font-semibold tracking-[0.04em]"
      style={{ background, color }}
    >
      {children}
    </span>
  )
}

function Chip({
  children, aktiv, onClick,
}: {
  children: React.ReactNode
  aktiv: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktiv}
      className={
        'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors ' +
        (aktiv
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-accent/40')
      }
    >
      {children}
    </button>
  )
}

function Vaelger({
  label, value, onChange, children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full min-w-0 rounded-xl border border-border bg-card px-3 text-[15px] text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </label>
  )
}
