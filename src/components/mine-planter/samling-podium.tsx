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
 * serif-titel, samlet meta, og en rolig divider-medaljon som overgang
 * ned til grupperne.
 *
 * 17/6: bladillustration fjernet; top- og bundkant er nu samme sand-tone,
 * begge kantstreger tyndere (1,4px); medaljonen overlapper båndets bundkant.
 */
export function SamlingPodium({ planter, sorter }: { planter: number; sorter: number }) {
  const sand = 'rgba(184,154,74,0.5)'
  return (
    <div className="-mx-4">
      {/* Tone-i-tone podium-bånd. Ikke et kort — en redaktionel ramme.
          Sand top- og bundkant (1,4px); bundkanten ER sektionens bundlinje. */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(165deg, #F1EBDA 0%, #EAE1CC 100%)',
          borderTop: `1.4px solid ${sand}`,
        }}
      >
        <div className="relative px-5 pb-10 pt-8">
          {/* Lodret accent-streg til venstre for hele tekstblokken. */}
          <div style={{ borderLeft: `2px solid ${sand}`, paddingLeft: 18 }}>
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

        {/* Bundstreg i sand = sektionens bundkant. To segmenter med luft
            omkring medaljonen, så stregen ikke gennemskærer ikonet. */}
        <div aria-hidden className="absolute" style={{ left: 0, bottom: 0, height: 1.4, width: 'calc(50% - 35px)', background: sand }} />
        <div aria-hidden className="absolute" style={{ right: 0, bottom: 0, height: 1.4, width: 'calc(50% - 35px)', background: sand }} />

        {/* Medaljon — straddler bundkanten og overlapper det mørkere felt. */}
        <div
          className="absolute left-1/2 flex items-center justify-center rounded-full"
          style={{
            bottom: 0,
            transform: 'translate(-50%, 50%)',
            width: 46,
            height: 46,
            background: 'var(--background)',
            border: '1.5px solid rgba(184,154,74,0.65)',
          }}
        >
          <GlyphSpire size={20} />
        </div>
      </div>

      {/* Plads til medaljonens nederste halvdel + lidt luft før grupperne. */}
      <div style={{ height: 38 }} />
    </div>
  )
}
