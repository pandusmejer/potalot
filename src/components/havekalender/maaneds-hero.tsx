import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import { saeson } from '@/lib/datetime'
import { Leaf, Sprout, Flower, Bug, Droplets, Scissors, Carrot } from 'lucide-react'
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

/** Matchende ikon pr. fokus-kategori (ikke ét generisk blad). */
function ikonFor(kategori: string): ComponentType<SVGProps<SVGSVGElement>> {
  const c = kategori.toLowerCase()
  if (/drivhus|varme/.test(c)) return IconDrivhus
  if (/udplant|s(å|aa)ning|forkultiv|spir/.test(c)) return Sprout
  if (/blomst|staud/.test(c)) return Flower
  if (/biodivers|bi(er)?|insekt|sommerfugl/.test(c)) return Bug
  if (/vand/.test(c)) return Droplets
  if (/besk(æ|ae)r/.test(c)) return Scissors
  if (/k(ø|oe)kkenhave|h(ø|oe)st|gr(ø|oe)nt/.test(c)) return Carrot
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
}: {
  month: number
  year: number
  focusTags?: string[]
}) {
  const monthName = MONTHS_DA[month - 1].full
  const stemning = MAANEDS_STEMNING[month]
  const sa = saeson(month)
  const foto = `/images/hero-${MAANED_SLUG[month - 1]}-foto.png`
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

      {/* Indhold — langsomt, roligt, venstre safe-zone */}
      <div
        className="relative w-[90%] max-w-[520px] px-6 pb-28"
        style={{ paddingTop: 'clamp(48px, 8vw, 96px)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase"
          style={{ fontFamily: sans, letterSpacing: '0.28em', color: 'rgba(246,243,234,0.85)', textShadow: skygge }}
        >
          {sa} · {year}
        </p>

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
            <div className="mt-4 flex flex-wrap gap-2.5">
              {focusTags.map(tag => {
                const PIcon = ikonFor(tag)
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs capitalize"
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
                    <PIcon className="h-3.5 w-3.5 opacity-80" strokeWidth={1.75} />
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
