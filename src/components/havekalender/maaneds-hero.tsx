import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import { saeson } from '@/lib/datetime'
import { Leaf, Sprout, Flower2, Bug, Droplets, Scissors, Carrot, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/** Drivhus-ikon (lucide har ingen) — i samme streg-stil som resten. */
function IconDrivhus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3 3 8.5V21h18V8.5L12 3Z" />
      <path d="M3 8.5h18" />
      <path d="M12 3v18" />
      <path d="M7.5 5.8V21" />
      <path d="M16.5 5.8V21" />
    </svg>
  )
}

/** Krans-ikon (julekrans) — ring med sløjfe forneden. */
function IconKrans(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="11" r="7.5" />
      <path d="M9.3 18.3 12 20.3l2.7-2" />
      <path d="M9.3 18.3c-1.3 1.1-2.6 1.6-3.8 1.7M14.7 18.3c1.3 1.1 2.6 1.6 3.8 1.7" />
    </svg>
  )
}

/** Kålhoved-ikon — rundt hoved med lagvis kålblade. */
function IconKaal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 5c-2.6 2.6-3.6 6-2.6 11" />
      <path d="M12 5c2.6 2.6 3.6 6 2.6 11" />
      <path d="M5.4 9.5c1 2.8 1.1 5.6.4 8.4M18.6 9.5c-1 2.8-1.1 5.6-.4 8.4" />
    </svg>
  )
}

/** Krukke-ikon — havekrukke med rand og tilspidset krop. */
function IconKrukke(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.5 7.5h15" />
      <path d="M6 7.5l1.5 12.2a1 1 0 0 0 1 .8h7a1 1 0 0 0 1-.8L18 7.5" />
    </svg>
  )
}

/** Høst-kurv-ikon — flettekurv med hank. */
function IconKurv(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 9a5 5 0 0 1 10 0" />
      <path d="M3 9h18l-1.5 9.4a2 2 0 0 1-2 1.6H6.5a2 2 0 0 1-2-1.6L3 9Z" />
      <path d="M9 12.5l.8 5M15 12.5l-.8 5M12 12.5v5" />
    </svg>
  )
}

/** Græs-tot-ikon — buket af græsstrå fra fælles base. */
function IconGraes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 21C9 17 7 13 7 8" />
      <path d="M12 21C11 16 10 12 9.5 7" />
      <path d="M12 21V6.5" />
      <path d="M12 21C13 16 14 12 14.5 7" />
      <path d="M12 21C15 17 17 13 17 8" />
    </svg>
  )
}

/** Græskar-ikon — ribbet græskar med stilk. */
function IconGraeskar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 7c0-1.8 1-3 2.6-3.2" />
      <path d="M12 7C7.6 7 4 10 4 14s3.6 7 8 7 8-3 8-7-3.6-7-8-7Z" />
      <path d="M9 7.6C7.5 10 7.5 18 9 20.4" />
      <path d="M15 7.6C16.5 10 16.5 18 15 20.4" />
    </svg>
  )
}

/** Regnorm-ikon — buet, segmenteret orm. */
function IconRegnorm(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 19c1.5-3 3.2-3 4.5-.6 1.4 2.4 3 .9 4-1.6 1-2.5 2.6-4.4 4.5-5.3" />
      <path d="M8.4 17.1l.9 1.5M12.3 15.6l.9-1.5M15.8 11.6l1.2 1.1" />
    </svg>
  )
}

/** Matchende ikon pr. fokus-kategori (ikke ét generisk blad). */
function ikonFor(kategori: string): ComponentType<SVGProps<SVGSVGElement>> {
  const c = kategori.toLowerCase()
  if (/drivhus|varme/.test(c)) return IconDrivhus
  if (/juledekoration|krans|adventskrans/.test(c)) return IconKrans
  if (/vinterdyrk|k(å|aa)l/.test(c)) return IconKaal
  if (/krukke|potte|urtepotte/.test(c)) return IconKrukke
  if (/halloween|gr(æ|ae)skar/.test(c)) return IconGraeskar
  if (/jordforbedr|regnorm|kompost/.test(c)) return IconRegnorm
  if (/udplant|s(å|aa)ning|forkultiv|spir/.test(c)) return Sprout
  if (/blomst|staud/.test(c)) return Flower2
  if (/biodivers|bi(er)?|insekt|sommerfugl/.test(c)) return Bug
  if (/vand/.test(c)) return Droplets
  if (/besk(æ|ae)r/.test(c)) return Scissors
  if (/h(ø|oe)st|kurv/.test(c)) return IconKurv
  if (/gr(æ|ae)s|pl(æ|ae)ne/.test(c)) return IconGraes
  if (/k(ø|oe)kkenhave|gr(ø|oe)nt/.test(c)) return Carrot
  return Leaf
}

const sans = 'var(--font-manrope)'

/**
 * Foto pr. måned. Fotos lægges i /public/images og hedder
 * hero-<månedsnavn>-foto.png (fuldt dansk navn, lowercase).
 * Mangler et foto, falder den blødt tilbage på sæson-grøn.
 */
const MAANED_SLUG = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
] as const

/**
 * Måneds-hero — en STEMNING, ikke et kort. Fuldbredde forårsfoto
 * der dominerer; mørkt overlay KUN i venstre side bag teksten,
 * mens højre side (blomst/lys) får lov at leve. Off-white
 * Cormorant-månedsnavn; alt andet Manrope. Blød asymmetrisk
 * landskabs-bundkant der bleeder helt til kant — ingen ramme.
 */
export function MaanedsHero({
  month, year, focusTags = [],
  onForrige, onNaeste,
}: {
  month: number
  year: number
  focusTags?: string[]
  /** Diskret måneds-navigation i eyebrow-linjen (valgfri — uden callbacks
   *  rendres heroen præcis som før). Skifter måned og BLIVER ved heroen. */
  onForrige?: () => void
  onNaeste?: () => void
}) {
  const monthName = MONTHS_DA[month - 1].full
  const forrigeNavn = MONTHS_DA[(month + 10) % 12].full.toLowerCase()
  const naesteNavn = MONTHS_DA[month % 12].full.toLowerCase()
  const stemning = MAANEDS_STEMNING[month]
  const sa = saeson(month)
  const foto = `/images/heroes-maaneder/hero-${MAANED_SLUG[month - 1]}-foto.webp`
  const lys = '#F6F3EA'
  // Blød tekst-skygge: holder teksten læsbar over de lyse blade
  // UDEN at gøre billedet mørkere (ingen ekstra overlay).
  const skygge = '0 1px 14px rgba(18,28,10,0.55), 0 1px 3px rgba(18,28,10,0.40)'

  return (
    <section
      className="relative -mx-4 overflow-hidden"
      style={{ backgroundColor: '#d8e6b6' }}
    >
      {/* Fotoet er hovedpersonen — fylder, intet globalt slør */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url('${foto}')`,
          backgroundPosition: '68% center',
        }}
      />
      {/* Meget subtil venstre-gradient — kun til tekstlæsbarhed.
          Højre side beholder sol, bokeh og blomster urørt. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(20,32,12,0.55) 0%, rgba(20,32,12,0.28) 35%, rgba(20,32,12,0.08) 60%, rgba(20,32,12,0) 100%)',
        }}
      />
      {/* Lyse forårstoner: varm pollen-gul/creme der løfter lyset
          (additivt — ikke et mørkt slør). */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(58% 50% at 86% 8%, rgba(249,231,97,0.20) 0%, transparent 60%),' +
            'radial-gradient(70% 40% at 50% 100%, rgba(247,243,222,0.16) 0%, transparent 70%)',
        }}
      />

      {/* Indhold — langsomt, roligt, venstre safe-zone.
          Bund-padding skal RYDDE den høje landskabsbølge
          (150/180/210px) så pillerne aldrig havner bag den. */}
      <div
        className="relative w-[90%] max-w-[520px] px-6 pb-[176px] sm:pb-[206px] lg:pb-[236px]"
        style={{ paddingTop: 'clamp(48px, 8vw, 96px)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-[11px] font-semibold uppercase"
            style={{ fontFamily: sans, letterSpacing: '0.28em', color: 'rgba(246,243,234,0.85)', textShadow: skygge }}
          >
            {sa} · {year}
          </p>
          {/* Diskret måneds-navigation (Anna 3/8): mindst mulige tilføjelse —
              tekstlinks i eyebrow-rækken, ingen ny header/faner/sticky linje.
              Skifter måned og bliver ved heroen (ingen scroll-hop). */}
          {(onForrige || onNaeste) && (
            <span className="flex items-center gap-2.5 whitespace-nowrap">
              {onForrige && (
                <button
                  type="button"
                  onClick={onForrige}
                  aria-label={`Gå til ${forrigeNavn}`}
                  className="flex items-center gap-0.5 uppercase hover:opacity-100 transition-opacity"
                  style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(246,243,234,0.72)', textShadow: skygge, opacity: 0.85 }}
                >
                  <ChevronLeft className="h-3 w-3" aria-hidden />
                  {forrigeNavn}
                </button>
              )}
              {onNaeste && (
                <button
                  type="button"
                  onClick={onNaeste}
                  aria-label={`Gå til ${naesteNavn}`}
                  className="flex items-center gap-0.5 uppercase hover:opacity-100 transition-opacity"
                  style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(246,243,234,0.72)', textShadow: skygge, opacity: 0.85 }}
                >
                  {naesteNavn}
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </button>
              )}
            </span>
          )}
        </div>

        <h2
          className="mt-6"
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontWeight: 600,
            fontSize: 'clamp(4rem, 16vw, 6rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: lys,
            textShadow: skygge,
          }}
        >
          {monthName}
        </h2>

        <p
          className="mt-8 text-xl leading-snug"
          style={{ fontFamily: sans, fontWeight: 700, color: lys, textShadow: skygge }}
        >
          {stemning.tagline}
        </p>
        <p
          className="mt-5 text-sm leading-relaxed"
          style={{ fontFamily: sans, fontWeight: 500, color: 'rgba(246,243,234,0.94)', textShadow: skygge }}
        >
          {stemning.description}
        </p>

        {focusTags.length > 0 && (
          <div className="mt-10">
            <p
              className="text-[10px] font-semibold uppercase"
              style={{ fontFamily: sans, letterSpacing: '0.26em', color: 'rgba(246,243,234,0.82)', textShadow: skygge }}
            >
              Månedens fokus
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {focusTags.map(tag => {
                const PIcon = ikonFor(tag)
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] capitalize"
                    style={{
                      fontFamily: sans,
                      fontWeight: 600,
                      color: lys,
                      background: 'rgba(255,255,255,0.14)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.22)',
                    }}
                  >
                    <PIcon className="h-3 w-3 opacity-80" strokeWidth={1.75} />
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lagdelt landskabs-bundkant — bløde, asymmetriske bakker med
          stor amplitude og parallaks-dybde. Tåge-lag mellem bakkerne;
          fjern bakke lysere/blurret, nær bakke solid med skarp kant.
          Dramatisk også på mobil (ingen flad responsive-scaling). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px] sm:h-[180px] lg:h-[210px]"
      >
        {/* Atmosfærisk tåge mellem bakkelagene */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.16) 100%)',
          }}
        />
        <svg
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
          className="absolute inset-0 block h-full w-full"
        >
          {/* Fjerneste bakker — lysest tone (atmosfærisk dybde) */}
          <path
            d="M0 90 C 260 50 520 110 760 86 C 980 64 1140 22 1440 56 L1440 240 L0 240 Z"
            fill="rgba(246,243,234,0.40)"
          />
          {/* Mellemste bakkedrag — mellemtone */}
          <path
            d="M0 120 C 220 80 430 150 680 116 C 900 86 1050 30 1280 74 C 1350 88 1400 70 1440 80 L1440 240 L0 240 Z"
            fill="rgba(246,243,234,0.70)"
          />
          {/* Tynd skyggekant under nær-bakken — blød terræn-dybde */}
          <path
            d="M0 152 C 240 104 470 188 700 150 C 910 116 1040 48 1250 98 C 1340 120 1395 96 1440 108 L1440 240 L0 240 Z"
            fill="rgba(20,32,12,0.10)"
          />
          {/* Nærmeste bakke — solid sidebaggrund, skarp kant */}
          <path
            d="M0 140 C 240 92 470 176 700 138 C 910 104 1040 36 1250 86 C 1340 108 1395 84 1440 96 L1440 240 L0 240 Z"
            fill="var(--background)"
          />
        </svg>
      </div>
    </section>
  )
}
