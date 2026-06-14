import Link from 'next/link'
import type { Plant } from '@/lib/types'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
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
 * 🌿 LIGE NU (forside) — sidens hovedperson.
 *
 * Anna (spec): "Det vigtigste på hele siden. Én plante. Ikke fire. Ikke
 * et dashboard. Én historie. Apple News, ikke Trello." Stort foto + stor
 * serif + én forventning + én CTA. Den giver forsiden et centrum.
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
    <section
      className="relative overflow-hidden rounded-[24px]"
      style={{
        background: 'linear-gradient(158deg, #F4F0E2 0%, #ECE7D6 100%)',
        border: '1px solid rgba(36,48,31,0.10)',
        minHeight: 220,
      }}
    >
      {/* FOTO — højre halvdel, bløder ud til top/bund/højre kant. */}
      <div className="absolute right-0 top-0 bottom-0" style={{ width: '50%' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: '#617345' }} />
        )}
        {/* Blød overgang fra fotoets venstre kant ind i papiret. */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-16"
          style={{ background: 'linear-gradient(90deg, #F1ECDD 0%, rgba(241,236,221,0) 100%)' }}
        />
      </div>

      {/* TEKST — venstre halvdel, magasin-opslag. */}
      <div className="relative z-10 flex flex-col" style={{ width: '57%', padding: '20px 0 20px 20px' }}>
        <span
          className="flex items-center gap-1.5 uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: 'rgba(36,48,31,0.5)',
          }}
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Lige nu
        </span>

        <h2
          className="mt-3"
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(28px, 8vw, 36px)',
            lineHeight: 1.0,
            letterSpacing: '-0.005em',
            color: '#24301F',
            margin: '12px 0 0',
          }}
        >
          {plant.variety ?? plant.name}
        </h2>

        <p
          className="mt-3"
          style={{
            fontFamily: sans,
            fontSize: 14.5,
            fontWeight: 500,
            lineHeight: 1.42,
            color: 'rgba(36,48,31,0.74)',
            margin: '12px 0 0',
          }}
        >
          {forventning}
        </p>

        <Link
          href={`/mine-planter/${plant.id}`}
          className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2.5 text-white transition-transform active:scale-95"
          style={{
            background: '#24301F',
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          Se planten
          <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
