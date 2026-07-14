'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

const sans = 'var(--font-manrope)'

/**
 * Kontekst-aware tilbage-link i Forvandlinger (detail OG oversigt).
 *
 * Kom brugeren fra Havebog-mosaikken (`?from=havebog`), skal "tilbage" føre
 * tilbage til Havebog PRÆCIS ved mosaikken (anker), ikke til Forvandlinger-
 * oversigten og ikke til Havebog-toppen. Kom de andetsteds fra (intet param),
 * bruges den side-specifikke fallback. Eksplicit href ud fra param — ingen
 * browser-history-gæt.
 *
 * Siderne er `force-static`, hvor `useSearchParams()` forbliver tom. Derfor
 * læses parammet direkte fra `window.location.search` efter mount. Initial
 * render = fallback (matcher SSR → ingen hydration-mismatch), som opgraderes
 * til Havebog-linket når parammet findes.
 *
 * Havebog-forsiden bor på roden '/', ikke '/havebog' (kun subruter som
 * /havebog/forvandlinger findes). Anker-hash på roden lander ved mosaikken.
 */
export function ForvandlingTilbageLink({
  fallbackHref,
  fallbackLabel,
}: {
  fallbackHref: string
  fallbackLabel: string
}) {
  const [fromHavebog, setFromHavebog] = useState(false)
  useEffect(() => {
    setFromHavebog(new URLSearchParams(window.location.search).get('from') === 'havebog')
  }, [])

  const href = fromHavebog ? '/#det-kan-haven-blive-til' : fallbackHref
  const label = fromHavebog ? 'Havebog' : fallbackLabel
  return (
    <Link
      href={href}
      className="flex w-fit items-center no-underline"
      style={{ gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.55)', marginBottom: 22 }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  )
}
