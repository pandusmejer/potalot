'use client'

/**
 * Din have-sektionen ("Dine egne" / "Dyrker du denne?") — KLIENT-ø.
 *
 * Guide-detaljen er statisk genereret, så brugerens frøbank/plante-koblinger
 * kan ikke læses i render-stien. Sektionen renderes derfor i sin anonyme
 * grundform (CTA-branchen uden ønskeliste-knap = deterministisk SSR) og
 * opgraderes efter mount via getGuideKoblinger, KUN når der findes en
 * auth-cookie. Markup er den ANNA-LÅSTE C6-blok, flyttet 1:1.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Sprout } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GemTilOenskeliste } from '@/components/guides/gem-til-oenskeliste'
import { getGuideKoblinger, type GuideKoblinger } from '@/actions/guide-links'

/** Kopi af guide-artiklens debug-strip (kun QA-ruter). */
function DebugBlock({ name, note }: { name: string; note?: string }) {
  return (
    <div
      className="my-1.5 inline-flex items-center gap-2 rounded-md px-2.5 py-1"
      style={{
        background: '#2D2A24', color: '#F4F0E5', fontSize: 10, fontWeight: 600,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        letterSpacing: '0.02em', lineHeight: 1.2,
      }}
    >
      <span style={{ opacity: 0.6 }}>▶</span>
      <span>{name}</span>
      {note && <span style={{ opacity: 0.65 }}>· {note}</span>}
    </div>
  )
}

export function DinHaveSektion({
  effectiveId,
  parentId,
  plantName,
  variety,
  isSpecies,
  artPlural,
  debug = false,
}: {
  effectiveId: string
  parentId: string | null
  plantName: string
  variety: string | null
  isSpecies: boolean
  artPlural: string
  debug?: boolean
}) {
  const [koblinger, setKoblinger] = useState<GuideKoblinger | null>(null)

  useEffect(() => {
    // Ingen auth-cookie → anonym grundform står; intet server-kald.
    const harAuthCookie = document.cookie
      .split('; ')
      .some((c) => c.startsWith('sb-') && c.includes('-auth-token'))
    if (!harAuthCookie) return
    let active = true
    getGuideKoblinger(effectiveId, parentId)
      .then((r) => { if (active) setKoblinger(r) })
      .catch(() => {})
    return () => { active = false }
  }, [effectiveId, parentId])

  const inventory = koblinger?.inventory ?? []
  const plants = koblinger?.plants ?? []
  const loggedIn = koblinger?.loggedIn ?? false

  return (
    <>
      {inventory.length > 0 || plants.length > 0 ? (
        <>
          {debug && (
            <DebugBlock
              name="DineEgne"
              note={`4. Frøbank ${inventory.length} + planter ${plants.length}`}
            />
          )}
          <Card className="bg-secondary/20 border-secondary">
            <CardContent className="space-y-3 py-4">
              <p
                style={{
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(36,48,31,0.55)',
                  margin: 0,
                }}
              >
                Dine egne
              </p>
              {inventory.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    I din frøbank
                  </p>
                  <div className="space-y-1.5">
                    {inventory.map((item) => (
                      <Link
                        key={item.id}
                        href={`/froebank/${item.id}`}
                        className="flex items-center gap-2 text-sm hover:underline"
                      >
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.name}
                        {item.variety ? ` — ${item.variety}` : ''}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {plants.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    Aktive dyrkninger
                  </p>
                  <div className="space-y-1.5">
                    {plants.map((plant) => (
                      <Link
                        key={plant.id}
                        href={`/mine-planter/${plant.id}`}
                        className="flex items-center gap-2 text-sm hover:underline"
                      >
                        <Sprout className="h-3.5 w-3.5 text-muted-foreground" />
                        {plant.name}
                        {plant.variety ? ` — ${plant.variety}` : ''}
                        {plant.isArchived && plant.archivedYear && (
                          <Badge variant="muted" className="text-[9px]">
                            Arkiv {plant.archivedYear}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Formindsket fuge til kalender-sektionen ovenfor (12px, samme som
        // Din have↔Tip). Nested -mt så space-y-fugen overskrives.
        <div>
          <div className="-mt-2">
          {debug && (
            <DebugBlock name="DinHave (tom-tilstand)" note="4F — buffer" />
          )}
          <section
            className="rounded-[28px] px-6 py-6"
            style={{
              background: '#F4F0E5',
              border: '1px solid rgba(36,48,31,0.10)',
            }}
          >
            <p
              className="m-0 uppercase"
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                lineHeight: 1.25,
                color: '#7F8F6A',
              }}
            >
              Din have
            </p>
            <h3
              style={{
                fontFamily: 'var(--font-plex-condensed), sans-serif',
                fontSize: 'clamp(23px, 5.5vw, 27px)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.08,
                color: '#2D2A24',
                // Luft mellem DIN HAVE-eyebrow og heading. (Inline, fordi en
                // mt-klasse ville blive overskrevet af margin herunder.)
                margin: '15px 0 0',
                maxWidth: '24ch',
              }}
            >
              {isSpecies
                ? `Dyrker du ${artPlural}?`
                : `Dyrker du ${variety ?? plantName}?`}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.5,
                color: 'rgba(36,48,31,0.62)',
                // Luft mellem heading og brødtekst (inline, da mt-klasse ellers
                // overskrives af margin herunder).
                margin: '7px 0 0',
                maxWidth: '46ch',
              }}
            >
              {isSpecies
                ? `Vælg en sort til frøbanken, eller opret en ${plantName.toLowerCase()}plante du allerede dyrker.`
                : 'Tilføj sorten til din frøbank eller opret den som plante.'}
            </p>
            {/* Piller deler bredden ligeligt (flex-1) og bliver på én linje —
                også når arts-labels som "Opret tomatplante" er lange. */}
            <div className="mt-5 flex gap-2">
              <Link
                href={
                  isSpecies
                    ? '#sortsvarianter'
                    : // Sortsguide → forudfyld BÅDE art og sort i manuel oprettelse
                      // (autofill-motoren tager over). Ingen blindgyder.
                      `/froebank/tilfoej?mode=manuel&navn=${encodeURIComponent(plantName)}${variety ? `&sort=${encodeURIComponent(variety)}` : ''}`
                }
                className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 hover:opacity-90 transition"
                style={{
                  background: '#7F8F6A',
                  color: '#F4F0E5',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  textDecoration: 'none',
                }}
              >
                <Package className="h-3.5 w-3.5" />
                {isSpecies
                  ? `Se ${plantName.toLowerCase()}sorter`
                  : 'Tilføj til frøbank'}
              </Link>
              <Link
                href="/mine-planter"
                className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 hover:bg-secondary/30 transition"
                style={{
                  background: 'transparent',
                  color: '#2D2A24',
                  border: '1px solid rgba(36,48,31,0.20)',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  textDecoration: 'none',
                }}
              >
                <Sprout className="h-3.5 w-3.5" />
                {isSpecies
                  ? `Opret ${plantName.toLowerCase()}plante`
                  : 'Opret plante'}
              </Link>
            </div>
            {/* Tredje vej: parkér idéen på ønskelisten (broen Forvandlinger →
                Guides → Frøbank). Kun for indloggede (OBS: isDemo betyder her
                "statisk importeret guide" — IKKE anonym bruger). */}
            {loggedIn && (
              <GemTilOenskeliste name={plantName} variety={variety} />
            )}
          </section>
          </div>
        </div>
      )}
    </>
  )
}
