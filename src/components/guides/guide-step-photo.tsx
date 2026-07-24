/**
 * StepPhoto — inline foto i et guide-trin (primært teknikguider).
 *
 * ANNA-LÅST regel (24/7): teknik-fotos placeres inline VED det trin de hjælper
 * med — aldrig galleri/hero. Fotoet lever eller dør på, om det hjælper brugeren
 * med at UDFØRE handlingen. Se editorial-rules.md §"Billeder i teknikguider".
 *
 * Forfatteren skriver et @foto-direktiv som sit eget "afsnit" i trinnets body,
 * mellem tekstblokke — så placeringen bestemmes af teksten:
 *
 *   Et sideskud vokser i bladhjørnet ...
 *
 *   @foto knibning-af-tomater/sideskud
 *   caption: Sideskuddet sidder her
 *   note: Mellem hovedstammen og bladstilken.
 *   marker: Sideskud
 *
 *   Fjern ikke selve bladet ...
 *
 * Server-component: tjekker om billedet findes → ellers en rolig
 * "Foto kommer"-placeholder, så slots kan lægges ind FØR fotos lander.
 */

import { existsSync } from 'node:fs'

const sans = 'var(--font-manrope)'

interface Foto {
  src: string
  caption?: string
  note?: string
  marker?: string
}

function parseFoto(raw: string): Foto {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const src = (lines[0] ?? '').replace(/^@foto\s*/, '').trim()
  const f: Record<string, string> = {}
  for (const l of lines.slice(1)) {
    const m = l.match(/^([a-zA-Z]+):\s*(.*)$/)
    if (m) f[m[1].toLowerCase()] = m[2].trim()
  }
  return { src, caption: f.caption, note: f.note, marker: f.marker }
}

/** src = "<mappe>/<navn>" → /images/makro/<mappe>/<navn>.{jpg,png} hvis filen findes. */
function resolveFoto(src: string): string | null {
  if (!src) return null
  if (src.startsWith('/')) return existsSync(`public${src}`) ? src : null
  for (const ext of ['jpg', 'png']) {
    if (existsSync(`public/images/makro/${src}.${ext}`)) {
      return `/images/makro/${src}.${ext}`
    }
  }
  return null
}

export function StepPhoto({ raw }: { raw: string }) {
  const { src, caption, note, marker } = parseFoto(raw)
  const resolved = resolveFoto(src)

  return (
    <figure style={{ margin: '20px 0 22px' }}>
      {/* Næsten fuld bredde i tekstkolonnen, afrundede hjørner, INGEN kort-
          container. 4:3. */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#ECE6D6',
          border: '1px solid rgba(45,42,36,0.08)',
        }}
      >
        {resolved ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={resolved}
            alt={caption ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 8,
              borderRadius: 12,
              border: '1px dashed rgba(90,106,60,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(90,106,60,0.7)',
            }}
          >
            Foto kommer
          </div>
        )}

        {/* Diskret markør oven på billedet — tynd oliven-streg + label. Ikke
            en stor instruktionsgrafik; skal kunne afkodes på to sekunder. */}
        {marker && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '4px 9px 4px 8px',
              borderRadius: 999,
              background: 'rgba(45,42,36,0.55)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <span aria-hidden style={{ width: 14, height: 2, background: '#B9CE86', borderRadius: 2 }} />
            <span
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: '#F1F3E7',
              }}
            >
              {marker}
            </span>
          </div>
        )}
      </div>

      {(caption || note) && (
        <figcaption style={{ margin: '9px 0 0', paddingLeft: 2 }}>
          {caption && (
            <span
              className="uppercase"
              style={{
                display: 'block',
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: '#5A6A3C',
              }}
            >
              {caption}
            </span>
          )}
          {note && (
            <span
              style={{
                display: 'block',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.45,
                color: 'rgba(45,42,36,0.62)',
                margin: '3px 0 0',
              }}
            >
              {note}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
