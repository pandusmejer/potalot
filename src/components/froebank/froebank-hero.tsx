/**
 * "FroebankHero" — kompakt foto-intro til Frøbank-siden.
 *
 * Funktionel intro, ikke landingpage. Fast højde, rounded container,
 * inkluderer stats-række så heroen øjeblikkeligt fortæller brugeren
 * hvad de har i banken.
 *
 * Layout per spec:
 *   • 300/340 px højde, 52 px radius, max-bredde 1040 px
 *   • Foto-baggrund med horisontal mørk-til-lys gradient + subtil
 *     bund-cream fade
 *   • Indhold venstrestillet: kicker → Cormorant-titel → tagline →
 *     stats-række → "+Tilføj frø" pill
 */

import Link from 'next/link'

const sans = 'var(--font-manrope)'

export function FroebankHero({
  kicker,
  title = 'Frøbank',
  tagline = 'Din samling af frø, løg, knolde, buske, træer og stauder.',
  stats,
  addHref = '/froebank/tilfoej',
}: {
  kicker?: string
  title?: string
  tagline?: string
  stats?: Array<string>
  addHref?: string
}) {
  const foto = '/images/heroes-sider/hero-froebank-foto.png'
  const lys = '#F6F3EB'

  return (
    // Heroen er IKKE full-bleed. 16 px inset på begge sider giver
    // editorial spacing og premium-fornemmelse. Max-bredde 1040 px
    // centreret på store skærme.
    <section
      style={{
        paddingInline: 16,
        paddingTop: 24,
        maxWidth: 1040 + 32,
        marginInline: 'auto',
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          // 20 % mindre bue: 52 → 42 px.
          borderRadius: 42,
          backgroundColor: '#24301F',
          // Heroen er bredere end høj: 1.7:1 ratio (i målintervallet
          // 1.65–1.9). aspect-ratio holder forholdet uanset bredde;
          // maxHeight forhindrer at den bliver for høj på store skærme.
          aspectRatio: '1.7 / 1',
          maxHeight: 300,
        }}
      >
        {/* Foto-baggrund */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url('${foto}')`,
            backgroundPosition: '70% 55%',
          }}
        />

        {/* Mørk-til-lys horisontal gradient for tekst-læsbarhed */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(18,22,15,0.72) 0%, rgba(18,22,15,0.46) 42%, rgba(18,22,15,0.18) 100%)',
          }}
        />

        {/* Subtil bund-cream fade — blød overgang ind i sidens baggrund */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[72px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(246,243,235,0) 0%, rgba(246,243,235,0.22) 100%)',
          }}
        />

        {/* Indhold — venstre safe-zone, vertikalt centreret */}
        <div className="relative z-10 flex h-full flex-col justify-center px-7 md:px-12 max-w-[620px]">
          {kicker && (
            <p
              className="mb-4 uppercase"
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: 'rgba(246,243,235,0.80)',
                margin: 0,
                marginBottom: 16,
              }}
            >
              {kicker}
            </p>
          )}

          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              // Yderligere 7 % mindre: 46 px mobile → 62 px desktop.
              fontSize: 'clamp(46px, 8.4vw, 62px)',
              fontWeight: 600,
              lineHeight: 0.86,
              color: lys,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>

          <p
            className="max-w-[520px]"
            style={{
              fontFamily: sans,
              // Endnu en størrelse op: 14 px mobile → 16 px desktop.
              fontSize: 'clamp(14px, 2vw, 16px)',
              fontWeight: 500,
              lineHeight: 1.25,
              color: 'rgba(246,243,235,0.92)',
              margin: 0,
              marginTop: 12,
              whiteSpace: 'pre-line', // respekterer \n line-breaks i tagline
            }}
          >
            {tagline}
          </p>

          {stats && stats.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-2"
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(246,243,235,0.82)',
                marginTop: 12,
              }}
            >
              {stats.map((s, i) => {
                // "udløber snart" får en let terracotta-tone som et
                // blødt varsel uden at virke alarmerende.
                const erUdloeb = /udløber/i.test(s)
                return (
                  <span key={s} className="inline-flex items-center gap-2">
                    {i > 0 && (
                      // Rigtig cirkel i stedet for "·"-glyf — garanteret
                      // lodret centreret midt på linjen. Ø5 px ≈ dobbelt
                      // så stor som en normal punkt-separator.
                      <span
                        aria-hidden
                        style={{
                          display: 'inline-block',
                          // Hel pixel (4 px) — undgår sub-pixel anti-
                          // aliasing der får 4.5 px til at se oval ud.
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: 'currentColor',
                          opacity: 0.78,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span style={erUdloeb ? { color: '#E0A47A' } : undefined}>
                      {s}
                    </span>
                  </span>
                )
              })}
            </div>
          )}

          <Link
            href={addHref}
            className="inline-flex h-[33px] w-fit items-center gap-1.5"
            style={{
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              color: '#24301F',
              paddingInline: 15,
              borderRadius: 11,
              border: '1px solid rgba(246,243,235,0.30)',
              background: 'rgba(246,243,235,0.92)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
            Tilføj frø
          </Link>
        </div>
      </div>
    </section>
  )
}
