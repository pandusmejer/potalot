const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 FORSIDE-HERO — "Mine planter".
 *
 * Spec (Anna): "Ingen kort. Ingen knapper. Stor typografi. Mere magasin
 * end app. Tekst er design." Fuldbredde artsfoto bærer stemningen; den
 * store serif-titel + én rolig undertekst er hovedpersonen. Antal står
 * som tekst, ikke som KPI-bokse.
 */
export function ForsideHero({ total, attention }: { total: number; attention: number }) {
  return (
    <header
      className="relative h-[264px] overflow-hidden rounded-[32px]"
      style={{ boxShadow: '0 10px 30px -12px rgba(28,38,22,0.42)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/heroes-sider/hero-planter-spirer.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Scrim: mørk i bunden så titlen læses; lyser op i toppen så fotoet ånder. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,22,14,0.06) 0%, rgba(18,22,14,0.18) 42%, rgba(18,22,14,0.64) 100%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(40px, 12vw, 52px)',
            lineHeight: 0.95,
            letterSpacing: '-0.005em',
            color: '#FFFFFF',
            textShadow: '0 2px 18px rgba(18,14,8,0.5)',
            margin: 0,
          }}
        >
          Mine planter
        </h1>
        <p
          className="mt-2.5"
          style={{
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(255,255,255,0.92)',
            textShadow: '0 1px 8px rgba(18,14,8,0.5)',
            margin: 0,
          }}
        >
          {total} {total === 1 ? 'plante vokser' : 'planter vokser'} lige nu.
          {attention > 0 && (
            <>
              {' '}
              <span style={{ color: '#F0CE7E', fontWeight: 600 }}>
                {attention} {attention === 1 ? 'har' : 'har'} brug for opmærksomhed.
              </span>
            </>
          )}
        </p>
      </div>
    </header>
  )
}
