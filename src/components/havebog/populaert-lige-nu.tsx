const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  emner: string[]
}

/**
 * RUM 11 (V1.0-prototype) · Populært lige nu.
 *
 * Fællesskab — hvad andre dyrkere læser og dyrker netop nu.
 * Netflix-/Spotify-logik for haven, altid hjælpsomt aldrig dømmende.
 *
 * ⚠️ KRÆVER ÆGTE FÆLLESSKABSDATA. "Mange dyrkere læser om…" må ALDRIG
 * vise opfundne tal (ærligheds-reglen). Dette rum lever indtil videre
 * KUN som prototype i demo — det vises ikke til rigtige brugere, før
 * der findes reel community-data at trække på.
 */
export function PopulaertLigeNu({ emner }: Props) {
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
        Mange dyrkere læser om
      </p>

      <div className="space-y-1.5">
        {emner.map(e => (
          <p
            key={e}
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: 'clamp(24px, 5.4vw, 33px)',
              lineHeight: 1.16,
              color: '#24301F',
              margin: 0,
            }}
          >
            {e}
          </p>
        ))}
      </div>
    </section>
  )
}
