/**
 * "Næste måned" — atmosfærisk anticipations-card (sidste sektion i
 * kalender-scrollet). Billede + scrim + radius + spacing + editorial
 * typografi:
 *
 *   • NÆSTE MÅNED eyebrow (sans, uppercase, lav opacity)
 *   • Månedsnavn (Cormorant Garamond 500, stort — det første øjet ser)
 *   • Kort horizontal divider-streg
 *   • Subtitle (sans, dæmpet creme)
 *   • Tre bløde dot-bullets med næste måneds gøremål
 *
 * Gradient-overlay går fra venstre (mørk) til højre (næsten klar) så
 * teksten er læsbar og foto-motivet i højre side får luft.
 *
 * (Tidligere defineret inline i kalender-client.tsx som
 * `KommendeNaesteMaaned` — nu udtrukket til egen fil med skærm-navn =
 * kode-navn: NaesteMaaned.)
 */

import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import type { GeneralGardenTask } from '@/lib/types'

/** Lille versal-eyebrow der gør sidens narrativ eksplicit. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </p>
  )
}

/**
 * Baggrundsbilleder pr. måned til "Næste måned"-card'et. Bruges som
 * fuld-bleed atmosfærisk baggrund. Tilføj flere efter behov.
 */
const KOMMENDE_BAGGRUNDE: Record<number, string> = {
  6: '/images/kalender/Baggrund kommende maaned juni.png',
}

export function NaesteMaaned({ month, generalTasks }: { month: number; generalTasks: GeneralGardenTask[] }) {
  const next = month === 12 ? 1 : month + 1
  const navn = MONTHS_DA[next - 1].full
  const tagline = MAANEDS_STEMNING[next]?.tagline ?? ''
  const kommende = generalTasks
    .filter(g => g.month === next && !g.isHiddenByMe)
    .slice(0, 3)
  const bg = KOMMENDE_BAGGRUNDE[next]
  const sans = 'var(--font-manrope), sans-serif'
  const serif = 'var(--font-cormorant), Georgia, serif'

  return (
    <section className="space-y-2">
      <Eyebrow>Næste måned</Eyebrow>
      <div
        className="relative overflow-hidden rounded-tr-[1.75rem] rounded-bl-[1.75rem] rounded-tl-md rounded-br-md px-6 py-6"
        style={
          bg
            ? {
                // Left-to-right scrim per editorial spec: mørk venstre
                // hvor teksten ligger, fader til næsten klar mod højre
                // hvor tomatplanten kan ses tydeligt.
                backgroundImage: `linear-gradient(90deg, rgba(32,38,28,0.58) 0%, rgba(32,38,28,0.32) 45%, rgba(32,38,28,0.04) 100%), url("${bg}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Fallback-baggrund når der ikke er noget billede */}
        {!bg && (
          <div aria-hidden className="absolute inset-0 bg-surface-2" />
        )}

        <div className="relative">
          {/* Indre "NÆSTE MÅNED" label er fjernet — sektion-eyebrow
              over card'et bærer nu den rolle. Månedsnavnet starter
              derfor direkte i toppen af card-indholdet. */}

          {/* Månedsnavn — primær fokuspunkt. Cormorant Garamond 500,
              langsom og elegant, ikke en almindelig app-heading.
              clamp: 54-62px mobile, 78-92px desktop. */}
          <h2
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(54px, 13vw, 92px)',
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              color: bg ? 'rgba(255,255,255,0.92)' : '#24311D',
              margin: 0,
              marginTop: 8,
            }}
          >
            {navn}
          </h2>

          {/* Divider — kort horizontal streg, ikke et em-dash tegn.
              Visuel åndepause mellem titel og subtitle. */}
          <div
            aria-hidden
            style={{
              width: 42,
              height: 1,
              background: bg ? 'rgba(255,255,255,0.45)' : 'rgba(36,48,31,0.35)',
              marginTop: 26,
            }}
          />

          {/* Subtitle — poetisk, filmisk, IKKE marketing-copy. */}
          {tagline && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 22,
                fontWeight: 400,
                lineHeight: 1.25,
                color: bg ? 'rgba(255,255,255,0.78)' : '#4A5842',
                margin: 0,
                marginTop: 18,
              }}
            >
              {tagline}
            </p>
          )}

          {/* Listepunkter — bløde runde dots, ingen hårde bullets. */}
          {kommende.length > 0 && (
            <ul
              style={{
                margin: 0,
                marginTop: 30,
                padding: 0,
                listStyle: 'none',
              }}
            >
              {kommende.map((g, i) => (
                <li
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginTop: i === 0 ? 0 : 16,
                    fontFamily: sans,
                    fontSize: 17,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: bg ? 'rgba(255,255,255,0.74)' : '#55634D',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: bg ? 'rgba(255,255,255,0.55)' : 'rgba(85,99,77,0.55)',
                      marginTop: 9,
                    }}
                  />
                  <span>{g.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
