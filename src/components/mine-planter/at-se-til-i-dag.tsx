import Link from 'next/link'

const sans = 'var(--font-manrope)'

export interface AtSeItem {
  art: string
  action: string
  href: string
  /** Kort timing-label: "Gør i dag" | "Klar nu" | "Afventer vejr". */
  timing: string
  priority: 'idag' | 'snart' | 'afventer'
}

/**
 * ✅ I HAVEN I DAG — dagens planteopgaver som ÉN samlet arbejdsseddel.
 *
 * Anna (17/6): tre separate kort gjorde siden til "kort-på-kort" (hero-kort,
 * lige nu-kort, opgavekort, plantekort … en stak beige madkasser). Hver
 * opgave fik næsten samme vægt som et plantekort. Redesignet som én kompakt
 * opgaveliste — checkbox-cirkel som hovedsignal, navn + opgave, status-pill,
 * tynde divider-linjer, INGEN per-item-kort/skygge. Bryder card-rytmen og
 * giver variation: "papirliste på havebordet", ikke SaaS-dashboard.
 *
 * NB (ærlig grænse): opgaverne er UDLEDT af plantestatus (ikke gemte to-do'er),
 * så der er endnu ingen "gjort"-tilstand at sætte. Checkbox-cirklen er v1 det
 * visuelle hovedsignal; hele rækken linker til planten. Ægte tap-to-complete
 * + log-bottom-sheet (gem i plantens historie) er et separat skridt — vi
 * fabrikerer ikke en falsk afkrydsning.
 */

const PRIO_META: Record<AtSeItem['priority'], { label: string; chipBg: string }> = {
  idag: { label: '#8A6D1F', chipBg: 'rgba(200,154,53,0.14)' },
  snart: { label: '#4C6038', chipBg: 'rgba(94,125,79,0.13)' },
  afventer: { label: 'rgba(36,48,31,0.5)', chipBg: 'rgba(36,48,31,0.06)' },
}

export function AtSeTilIDag({ items }: { items: AtSeItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
        <h2
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'rgba(36,48,31,0.52)',
            margin: 0,
          }}
        >
          I haven i dag
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: 'rgba(36,48,31,0.45)', margin: 0 }}>
          {items.length} {items.length === 1 ? 'planteopgave' : 'planteopgaver'}
        </p>
      </header>

      {/* Én samlet liste — ingen per-item-kort. Tynde divider-linjer giver
          rytme; checkbox-cirklen er hovedsignalet. */}
      <div>
        {items.slice(0, 3).map((item, i) => {
          const prio = PRIO_META[item.priority]
          return (
            <Link
              key={`${item.art}-${i}`}
              href={item.href}
              className="group flex gap-3 px-0.5 transition-colors active:bg-[rgba(36,48,31,0.035)]"
              style={{
                paddingTop: 14,
                paddingBottom: 14,
                borderTop: '1px solid rgba(36,48,31,0.09)',
              }}
            >
              {/* Checkbox-cirkel — sektionens hovedsignal ("jeg kan handle her"). */}
              <span
                aria-hidden
                className="shrink-0 rounded-full"
                style={{ width: 17, height: 17, marginTop: 2, border: '1.5px solid rgba(36,48,31,0.22)' }}
              />

              <span className="min-w-0 flex-1">
                {/* Navn + status-pill på samme linje. */}
                <span className="flex items-center justify-between gap-2">
                  <span
                    className="truncate"
                    style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: '#24301F' }}
                  >
                    {item.art}
                  </span>
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: 600,
                      color: prio.label,
                      background: prio.chipBg,
                      padding: '3px 9px',
                    }}
                  >
                    {item.timing}
                  </span>
                </span>
                {/* Opgaven under navnet. */}
                <span
                  className="block truncate"
                  style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: 'rgba(36,48,31,0.6)', marginTop: 3 }}
                >
                  {item.action}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
