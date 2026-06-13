import type { CSSProperties } from 'react'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

interface HeroIdentityStackProps {
  title: string
  latinName?: string
  heroImage: string
  atmosphereImage?: string
  category?: string
  difficulty?: string
  sun?: string
  sowMonths?: string[]
  harvestMonths?: string[]
  intro?: string
}

type ExampleKey = 'tomat' | 'sanMarzano' | 'dahliaCafeAuLait'

const paper = '#F4F0E5'
const ink = '#2D2A24'
const sage = '#7F8F6A'

export function HeroIdentityStack({
  title,
  latinName,
  heroImage,
  atmosphereImage,
  category,
  difficulty,
  sun,
  sowMonths,
  harvestMonths,
  intro,
}: HeroIdentityStackProps) {
  const labels = [
    category,
    difficulty,
    sun,
    sowMonths?.length ? `Så ${sowMonths.join(' / ')}` : null,
    harvestMonths?.length ? `Høst ${harvestMonths.join(' / ')}` : null,
  ].filter(Boolean)

  const atmosphereStyle: CSSProperties = {
    backgroundImage: atmosphereImage ? `url(${atmosphereImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: '44% 48%',
    opacity: 0.28,
    mixBlendMode: 'multiply',
    transform: 'rotate(-2deg)',
    maskImage:
      'radial-gradient(ellipse 66% 58% at 50% 46%, black 0%, rgba(0,0,0,0.72) 42%, transparent 78%)',
    WebkitMaskImage:
      'radial-gradient(ellipse 66% 58% at 50% 46%, black 0%, rgba(0,0,0,0.72) 42%, transparent 78%)',
  }

  return (
    <section
      className="relative isolate overflow-x-clip px-0 pb-8 pt-5"
      style={{ background: 'transparent' }}
    >
      {atmosphereImage && (
        <div
          aria-hidden
          className="pointer-events-none absolute -left-14 -right-16 top-16 h-[360px]"
          style={atmosphereStyle}
        />
      )}

      <div className="relative min-h-[560px]">
        <h1
          className="relative z-30 max-w-[9ch] translate-y-5"
          style={{
            fontFamily: serif,
            fontSize: 'clamp(56px, 17vw, 72px)',
            fontWeight: 500,
            lineHeight: 0.92,
            letterSpacing: 0,
            color: ink,
            margin: 0,
          }}
        >
          {title}
        </h1>

        <div
          className="relative z-10 ml-auto mt-[-18px] h-[385px] w-[82%] overflow-hidden rounded-bl-[42px] rounded-br-[24px] rounded-tl-[26px] rounded-tr-[52px]"
          style={{ border: '1px solid rgba(45,42,36,0.08)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: '50% 45%' }}
          />
        </div>

        {latinName && (
          <p
            className="relative z-40 -mt-8 ml-4 max-w-[260px] rounded-r-[22px] px-3 py-2"
            style={{
              background: 'rgba(244,240,229,0.76)',
              fontFamily: serif,
              fontSize: 'clamp(20px, 6vw, 24px)',
              fontStyle: 'italic',
              lineHeight: 1.1,
              color: ink,
              marginBottom: 0,
            }}
          >
            {latinName}
          </p>
        )}

        {labels.length > 0 && (
          <div className="relative z-40 -mt-2 flex max-w-[330px] flex-wrap gap-2">
            {labels.map((label) => (
              <span
                key={label}
                className="rounded-full px-3 py-2"
                style={{
                  background: paper,
                  border: '1px solid rgba(36,48,31,0.10)',
                  color: sage,
                  fontFamily: sans,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {intro && (
          <p
            className="relative z-20 mt-5 line-clamp-3 max-w-[340px]"
            style={{
              fontFamily: serif,
              fontSize: 22,
              lineHeight: 1.28,
              color: 'rgba(45,42,36,0.78)',
              marginBottom: 0,
            }}
          >
            {intro}
          </p>
        )}
      </div>
    </section>
  )
}

export const heroIdentityStackExamples: Record<ExampleKey, HeroIdentityStackProps> = {
  tomat: {
    title: 'Tomat',
    latinName: 'Solanum lycopersicum',
    heroImage: '/images/arts/tomat.jpg',
    atmosphereImage: '/images/makro/tomat/blad-lys.jpg',
    category: 'Frø',
    difficulty: 'Middel',
    sun: 'Sol',
    sowMonths: ['Mar', 'Apr'],
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    intro:
      'Tomater elsker varme, lys og en lang sæson. Start dem tidligt og giv dem støtte, luft og jævn vanding.',
  },
  sanMarzano: {
    title: 'San Marzano',
    latinName: "Solanum lycopersicum 'San Marzano'",
    heroImage: '/images/plantekort/tomat-san-marzano.jpg',
    atmosphereImage: '/images/makro/tomat-san-marzano/klase.jpg',
    category: 'Frø',
    difficulty: 'Middel',
    sun: 'Sol',
    sowMonths: ['Mar', 'Apr'],
    harvestMonths: ['Aug', 'Sep', 'Okt'],
    intro:
      'Klassisk italiensk pastatomat med fast frugtkød og lavt vandindhold. Særlig god til sauce og konservering.',
  },
  dahliaCafeAuLait: {
    title: 'Café au Lait',
    latinName: "Dahlia 'Café au Lait'",
    heroImage: '/images/plantekort/dahlia-cafe-au-lait.jpg',
    atmosphereImage: '/images/plantekort/dahlia-cafe-au-lait.jpg',
    category: 'Knolde',
    difficulty: 'Let',
    sun: 'Sol',
    sowMonths: ['Apr', 'Maj'],
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    intro:
      'En blød, storblomstret dahlia med creme, rosa og ferskenfarvede toner. En klassiker i skærehaven.',
  },
}
