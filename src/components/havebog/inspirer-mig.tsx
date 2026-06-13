import type { InspirerForslag } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  forslag: InspirerForslag
}

/**
 * RUM 4 (V18-fidelitet) · Inspirér mig.
 *
 * Opdage nye ting — ÉT forslag ad gangen, aldrig et feed. Trækker
 * forbindelser mellem frøbank, planter, guides, historik og årstid.
 *
 * V18 (Annas mockup): forslaget får et billede, en "Vis et nyt
 * forslag"-knap, og et sekundært "Måske du også vil prøve".
 *
 * PROTOTYPE: "Vis et nyt forslag" er visuel (ikke koblet til en
 * forslags-rotation endnu); billedet bruger eksisterende frøkort.
 * Demo-only. Ingen døde links.
 */
export function InspirerMig({ forslag }: Props) {
  return (
    <section>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.26em',
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
          marginBottom: 18,
        }}
      >
        {forslag.kicker}
      </p>

      {forslag.billede && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={forslag.billede}
          alt=""
          style={{
            width: '100%',
            maxWidth: 280,
            aspectRatio: '1 / 1',
            objectFit: 'contain',
            margin: '0 0 8px -8px',
            filter: 'saturate(0.96)',
          }}
        />
      )}

      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(30px, 7vw, 44px)',
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
        }}
      >
        {forslag.navn}
      </p>
      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(19px, 4.4vw, 25px)',
          lineHeight: 1.3,
          color: 'rgba(36,48,31,0.7)',
          margin: 0,
          marginTop: 12,
          maxWidth: '22ch',
        }}
      >
        {forslag.begrundelse}
      </p>

      {/* Vis et nyt forslag — den magiske knap (prototype) */}
      <button
        type="button"
        className="flex items-center"
        style={{
          gap: 9,
          marginTop: 22,
          padding: '12px 22px',
          borderRadius: 999,
          border: 'none',
          background: '#3B4A2F',
          color: '#F4EFDC',
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" stroke="#F4EFDC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Vis et nyt forslag
      </button>

      {/* Sekundært — måske du også vil prøve */}
      {forslag.sekundaer && (
        <div
          style={{
            marginTop: 36,
            paddingTop: 26,
            borderTop: '1px solid rgba(36,48,31,0.12)',
          }}
        >
          <p
            className="uppercase"
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: 'rgba(36,48,31,0.42)',
              margin: 0,
              marginBottom: 10,
            }}
          >
            {forslag.sekundaer.kicker}
          </p>
          <p
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(22px, 5vw, 28px)',
              lineHeight: 1.12,
              color: '#24301F',
              margin: 0,
            }}
          >
            {forslag.sekundaer.titel}
          </p>
          <p
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: 'clamp(16px, 3.6vw, 19px)',
              lineHeight: 1.35,
              color: 'rgba(36,48,31,0.66)',
              margin: 0,
              marginTop: 6,
              maxWidth: '26ch',
            }}
          >
            {forslag.sekundaer.tekst}
          </p>
        </div>
      )}
    </section>
  )
}
