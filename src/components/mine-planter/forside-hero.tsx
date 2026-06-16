const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 FORSIDE-HERO — personlig, ikke regneark.
 *
 * Anna (16. juni 2026): "Mennesker tænker i historier. Regneark tænker i
 * tal." Heroen åbner med en tidsbaseret hilsen + én historie-linje udledt
 * af havens tilstand ("Din salat er klar til høst." / "Din have har 27
 * aktive planter. 3 ting kræver opmærksomhed i dag."). Foto bærer
 * stemningen; teksten er hovedpersonen.
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
      className="relative h-[216px] overflow-hidden rounded-[32px]"
      style={{ boxShadow: '0 10px 30px -12px rgba(28,38,22,0.42)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/heroes-sider/hero-planter-forside.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Scrim: mørk i bunden så teksten læses; lyser op i toppen. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,22,14,0.05) 0%, rgba(18,22,14,0.20) 40%, rgba(18,22,14,0.68) 100%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-5">
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
            fontSize: 'clamp(30px, 8.4vw, 40px)',
            lineHeight: 1.04,
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
              fontSize: 14.5,
              fontWeight: 600,
              lineHeight: 1.4,
              color: '#F0CE7E',
              textShadow: '0 1px 8px rgba(18,14,8,0.5)',
              margin: '8px 0 0',
            }}
          >
            {storyNote}
          </p>
        )}
      </div>
    </header>
  )
}
