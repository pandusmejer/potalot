'use client'

/**
 * Diskret indgang til /guides/gemt på Guides-forsiden — KLIENT-ø (forsiden
 * er force-static). Toner KUN ind, når brugeren faktisk har gemte noter:
 * anonyme og brugere uden gemte ser ingenting. Ingen tom sektion, intet
 * arkiv der skal "fyldes op".
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { harAuthCookie } from '@/lib/auth-cookie'
import { getAlleGemte } from '@/actions/gartner-gemte'

const sans = 'var(--font-manrope)'

export function GemtFraGartnerenLink() {
  const [antal, setAntal] = useState(0)

  useEffect(() => {
    if (!harAuthCookie()) return
    let aktiv = true
    getAlleGemte()
      .then(n => { if (aktiv) setAntal(n.length) })
      .catch(() => {})
    return () => { aktiv = false }
  }, [])

  if (antal === 0) return null

  return (
    <Link
      href="/guides/gemt"
      className="flex items-center gap-2 no-underline transition-colors hover:bg-[rgba(36,48,31,0.04)]"
      style={{
        border: '1px solid rgba(86, 111, 60, 0.22)',
        background: 'rgba(232, 236, 218, 0.38)',
        borderRadius: 16,
        padding: '11px 14px',
        marginTop: 10,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async"
        src="/images/glyphs/plante.png" alt="" aria-hidden
        style={{ width: 'auto', height: 15, display: 'block' }}
      />
      <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: 'rgba(36,48,31,0.72)' }}>
        Gemt fra Gartneren · <span style={{ fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}>{antal} {antal === 1 ? 'note' : 'noter'}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} style={{ color: 'rgba(36,48,31,0.4)', marginLeft: 'auto' }} aria-hidden />
    </Link>
  )
}
