import { GlyphSpire } from '@/components/icons/potalot-glyphs'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 SAMLING-PODIUM — editorial section header for "Min plantesamling".
 *
 * Anna (16/6 aften, retningsskift): "Min plantesamling" er en SAMLENDE
 * ramme — en introduktion/udstillingsvæg for alt det, brugeren har i gang.
 * Den skal have sit eget visuelle podium, men IKKE som endnu et kort
 * (ingen stor afrundet container, skygge, foto, CTA — så er vi tilbage i
 * "beige kasser for hele formuen"). Tænk herbarium-intro / arkivblad:
 * tone-i-tone-bånd, kicker + kapitelnummer, lodret accent-streg, stor
 * serif-titel, samlet meta, en svag botanisk silhuet, og en rolig
 * divider-medaljon som overgang ned til grupperne.
 */

/** Svag botanisk silhuet — tone-i-tone herbarium-gestus i båndets højre side. */
function BotaniskSilhuet() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 180 260"
      className="pointer-events-none absolute"
      style={{ right: -8, top: -20, height: 'calc(100% + 60px)', width: 'auto', opacity: 0.15 }}
      fill="none"
      stroke="#5E7D4F"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* stilk */}
      <path d="M104 252 C 92 198, 120 158, 104 106 C 94 72, 110 42, 116 14" />
      {/* blade — par langs stilken, skiftevis side, med midterribbe */}
      <path d="M104 212 C 80 202, 64 178, 62 152 C 88 158, 103 182, 104 212 Z" />
      <path d="M83 178 L 104 212" />
      <path d="M108 180 C 132 172, 148 150, 148 126 C 124 130, 109 152, 108 180 Z" />
      <path d="M128 150 L 108 180" />
      <path d="M101 150 C 78 142, 64 120, 64 96 C 88 100, 100 122, 101 150 Z" />
      <path d="M82 120 L 101 150" />
      <path d="M110 120 C 132 114, 146 94, 146 72 C 124 76, 111 96, 110 120 Z" />
      <path d="M128 94 L 110 120" />
      <path d="M106 92 C 86 86, 74 68, 74 48 C 92 52, 104 70, 106 92 Z" />
      {/* lille knop i toppen */}
      <path d="M116 14 C 110 7, 117 0, 125 3 C 129 9, 124 17, 116 14 Z" />
    </svg>
  )
}

export function SamlingPodium({ planter, sorter }: { planter: number; sorter: number }) {
  return (
    <div className="-mx-4">
      {/* Tone-i-tone podium-bånd. Ikke et kort — en redaktionel ramme. */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #F1EBDA 0%, #EAE1CC 100%)',
          borderTop: '1px solid rgba(36,48,31,0.08)',
          borderBottom: '1px solid rgba(36,48,31,0.06)',
        }}
      >
        <BotaniskSilhuet />
        <div className="relative px-5 pb-8 pt-8">
          {/* Lodret accent-streg til venstre for hele tekstblokken. */}
          <div style={{ borderLeft: '2px solid rgba(184,154,74,0.5)', paddingLeft: 18 }}>
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.24em',
                color: 'rgba(36,48,31,0.5)',
                margin: 0,
              }}
            >
              Min samling
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'rgba(36,48,31,0.36)',
                margin: '4px 0 0',
              }}
            >
              01
            </p>
            <h2
              style={{
                fontFamily: serif,
                fontSize: 'clamp(32px, 9vw, 42px)',
                fontWeight: 600,
                lineHeight: 1.0,
                letterSpacing: '-0.01em',
                color: '#24301F',
                margin: '10px 0 0',
              }}
            >
              Min plantesamling
            </h2>
            <p
              style={{
                fontFamily: sans,
                fontSize: 15,
                fontWeight: 600,
                color: 'rgba(36,48,31,0.55)',
                margin: '10px 0 0',
              }}
            >
              {planter} {planter === 1 ? 'plante' : 'planter'} · {sorter} {sorter === 1 ? 'sort' : 'sorter'}
            </p>
          </div>
        </div>
      </div>

      {/* Divider med medaljon — rolig overgang fra samling ned til grupperne. */}
      <div className="relative flex items-center justify-center" style={{ height: 58 }}>
        <div
          aria-hidden
          className="absolute"
          style={{ left: 16, right: 16, top: '50%', borderTop: '1px solid rgba(36,48,31,0.12)' }}
        />
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 46,
            height: 46,
            background: 'var(--background)',
            border: '1.5px solid rgba(184,154,74,0.6)',
          }}
        >
          <GlyphSpire size={20} />
        </div>
      </div>
    </div>
  )
}
