import Link from 'next/link'
import { Leaf, Flower2, Apple, Sprout, Bug, ChevronRight } from 'lucide-react'
import type { Kompetenceomraade } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  omraader: Kompetenceomraade[]
}

/**
 * Diskret GRUPPE-anker pr. kompetenceområde — lucide-ikon + kategori-farve,
 * ALDRIG custom soft glyphs eller ikon pr. enkelt-kompetence. Ét ikon pr.
 * gruppe; lavmælt markør, ikke badge. V1-mapping (udvides senere i Profil).
 */
function kompetenceMarkoer(omraade: string): { Ikon: typeof Leaf; farve: string } {
  const o = omraade.toLowerCase()
  if (/tomat/.test(o)) return { Ikon: Apple, farve: '#B85A3D' }
  if (/blomst|dahlia|staude|pryd/.test(o)) return { Ikon: Flower2, farve: '#C36F7C' }
  if (/skadedyr|sygdom/.test(o)) return { Ikon: Bug, farve: '#8F9484' }
  if (/salat|blad|agurk|squash|kål|bønne|ært|krydderurt|basilikum|dild/.test(o)) return { Ikon: Leaf, farve: '#6F7E55' }
  return { Ikon: Sprout, farve: '#8F9484' }
}

/**
 * RUM · "Dine kompetencer" (V19 — Annas 390px kort-spec, sektion 7).
 *
 * ⚠️ ANNA-LÅST 12/7 — lucide gruppe-ankre m. kategori-farve godkendt; rør ikke
 * uden ny retning.
 *
 * Udvikling, ikke "X af Y skills": kompetenceområder afledt af faktiske
 * log-handlinger, læst som en rolig linje. Ingen flueben, ingen tomme
 * cirkler, ingen locked/unlocked. Kort-PREVIEW: max 2 grupper med divider
 * + diskret line-ikon; flere findes i Profil ("Se alle kompetencer →").
 */
export function Dyrkerkompetencer({ omraader }: Props) {
  const vist = omraader.slice(0, 2)
  return (
    <section>
      <div
        style={{
          marginInline: -11,
          borderRadius: 14,
          background: '#F5EEDC',
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
          padding: 22,
        }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 20 }}
        >
          Dine kompetencer
        </p>

        {vist.map((o, i) => {
          const { Ikon, farve } = kompetenceMarkoer(o.omraade)
          return (
            <div key={o.omraade}>
              {i > 0 && <div aria-hidden style={{ height: 1, background: 'rgba(143,148,132,0.20)', margin: '18px 0' }} />}
              <div className="flex items-start" style={{ gap: 12 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(24px, 6.6cqw, 30px)', lineHeight: 1.05, color: '#1F2D1D', margin: 0, marginBottom: 8 }}>
                    {o.omraade}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 400, lineHeight: 1.45, color: '#45503F', margin: 0 }}>
                    {o.faerdigheder.join(' · ')}
                  </p>
                </div>
                {/* Lavmælt gruppe-anker — aldrig konkurrere med teksten */}
                <Ikon style={{ width: 36, height: 36, color: farve, opacity: 0.72, flexShrink: 0 }} strokeWidth={1.65} aria-hidden />
              </div>
            </div>
          )
        })}

        <Link
          href="/profil"
          className="no-underline flex items-center"
          style={{ gap: 4, marginTop: 18, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#314829' }}
        >
          Se alle kompetencer
          <ChevronRight style={{ width: 17, height: 17 }} strokeWidth={2.4} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
