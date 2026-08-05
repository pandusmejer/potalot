const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 FORSIDE-HERO — personlig, ikke regneark.
 *
 * Anna (16. juni 2026): "Mennesker tænker i historier. Regneark tænker i
 * tal." Heroen åbner med en tidsbaseret hilsen + én historie-linje. Foto
 * bærer stemningen; teksten er hovedpersonen.
 *
 * Revideret 16/6 (aften): heroen må IKKE blive et høstkort for ét
 * salathoved. Den åbner HELE Planter, så historie-linjen taler om
 * plantestandens TILSTAND som helhed ("Dine planter vokser videre.") +
 * én rolig meta-linje med tal ("46 planter · 3 kræver opmærksomhed").
 * Lettere behandling: lysere scrim (mere grønt slipper igennem),
 * overskrift ~13% mindre, radius 28 (ikke "Netflix-thumbnail-rund").
 */
export function ForsideHero({
  greeting,
  story,
  storyNote,
}: {
  greeting: string
  story: string
  storyNote?: string | null
}) {
  return (
    <header
      className="relative h-[216px] overflow-hidden rounded-[28px]"
      style={{ boxShadow: '0 10px 30px -12px rgba(28,38,22,0.42)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async"
        src="/images/heroes-sider/hero-planter-forside.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'brightness(1.06) saturate(1.05)' }}
      />
      {/* Scrim: mørk i bunden så teksten læses; lyser op i toppen. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,22,14,0) 0%, rgba(18,22,14,0) 34%, rgba(18,22,14,0.14) 56%, rgba(18,22,14,0.54) 100%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-5">
        {greeting && (
          <p
            style={{
              fontFamily: sans,
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: '0.01em',
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 1px 8px rgba(18,14,8,0.5)',
              margin: '0 0 7px',
            }}
          >
            {greeting}
          </p>
        )}
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(26px, 7.2vw, 34px)',
            lineHeight: 1.05,
            letterSpacing: '-0.005em',
            color: '#FFFFFF',
            textShadow: '0 2px 18px rgba(18,14,8,0.5)',
            margin: 0,
          }}
        >
          {story}
        </h1>
        {storyNote && (
          <p
            style={{
              fontFamily: sans,
              fontSize: 13.5,
              fontWeight: 600,
              lineHeight: 1.4,
              letterSpacing: '0.01em',
              color: 'rgba(255,255,255,0.82)',
              textShadow: '0 1px 8px rgba(18,14,8,0.55)',
              margin: '7px 0 0',
            }}
          >
            {storyNote}
          </p>
        )}
      </div>
    </header>
  )
}
