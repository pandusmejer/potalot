import Link from 'next/link'
import type { Plant } from '@/lib/types'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { GlyphSpire } from '@/components/icons/potalot-glyphs'
import { ArrowRight, CalendarDays } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * 🌿 LIGE NU (forside) — det fokuserede nærbillede under heroen.
 *
 * Anna (spec): "Det vigtigste på hele siden. Én plante. Ikke fire. Ikke
 * et dashboard. Én historie."
 *
 * Revideret 16/6 (aften): heroen er stemningen (stort, fotografisk,
 * følelsesdrevet); LIGE NU må IKKE blive en mini-hero, der konkurrerer.
 * Den skal være et roligt SPLIT-CARD — ren creme tekstflade til venstre,
 * tydeligt beskåret makrofoto til højre, INGEN mælkehvid midter-fade
 * (kun en diskret seam-skygge). Lavere + mere horisontalt end heroen,
 * dæmpet outline-CTA. "Fokuseret plantekort med editorial kvalitet",
 * ikke et teatralsk stemningskort. Søskende, ikke rivaler.
 */
export function ForsideLigeNu({ plant, forventning }: { plant: Plant; forventning: string }) {
  const varietySlug = plant.variety ? slugify(`${plant.name}-${plant.variety}`) : null
  const { src: photo } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })

  return (
    // Hele kortet er ét klik-mål (Anna 16/7): på det vigtigste kort på siden
    // skal man kunne trykke hvor som helst — ikke ramme den lille "Se planten"-
    // pille. CTA'en nedenfor er nu en visuel affordance (span), ikke et nested
    // <a> inde i dette <a>. Tydelig tryk-feedback + tastatur-fokus.
    <Link
      href={`/mine-planter/${plant.id}`}
      aria-label={`Se ${plant.variety ?? plant.name}`}
      className="group relative flex overflow-hidden rounded-[24px] no-underline transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A7038]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EFEBDD]"
      style={{
        color: 'inherit',
        border: '1px solid rgba(36,48,31,0.10)',
        minHeight: 168,
        boxShadow: '0 1px 2px rgba(36,48,31,0.04), 0 10px 26px -16px rgba(36,48,31,0.22)',
      }}
    >
      {/* TEKST — venstre, ren creme tekstflade. Ingen fade: rent split. */}
      <div
        className="relative z-10 flex flex-col justify-center"
        style={{
          width: '58%',
          background: 'linear-gradient(158deg, #F4F0E2 0%, #ECE7D6 100%)',
          padding: '18px 14px 18px 20px',
        }}
      >
        <span
          className="flex items-center gap-1.5 uppercase"
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: 'rgba(36,48,31,0.5)',
          }}
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Lige nu
        </span>

        <h2
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(23px, 6.6vw, 28px)',
            lineHeight: 1.04,
            letterSpacing: '-0.005em',
            color: '#24301F',
            margin: '8px 0 0',
          }}
        >
          {plant.variety ?? plant.name}
        </h2>

        <p
          className="line-clamp-2"
          style={{
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'rgba(36,48,31,0.72)',
            margin: '7px 0 0',
          }}
        >
          {forventning}
        </p>

        {/* Visuel CTA-affordance (ikke et nested link) — hele kortet er linket. */}
        <span
          className="mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-full"
          style={{
            border: '1px solid rgba(36,48,31,0.18)',
            color: '#24301F',
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            padding: '7px 13px',
          }}
        >
          Se planten
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
            style={{ color: '#5A7038' }}
            aria-hidden
          />
        </span>
      </div>

      {/* FOTO — højre, tydeligt beskåret makro. Ingen mælkehvid overgang;
          kun en diskret seam-skygge der giver dybde mellem de to zoner. */}
      <div className="relative" style={{ width: '42%' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(158deg, #EBEDE2 0%, #CAD4B6 100%)' }}
          >
            <GlyphSpire size={32} />
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-3"
          style={{ background: 'linear-gradient(90deg, rgba(20,26,16,0.16) 0%, rgba(20,26,16,0) 100%)' }}
        />
      </div>
    </Link>
  )
}
