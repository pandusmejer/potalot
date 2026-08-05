'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/**
 * Den låste back-knap fra guide-detaljen (blød creme-cirkel + hårfin border)
 * som ren visning — bruges både af klient-varianten herunder og som
 * Suspense-fallback på statiske sider.
 */
export function TilbageKnapVisning({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Tilbage"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(45,42,36,0.12)] bg-[rgba(255,255,255,0.45)] text-[#2D2A24] transition-colors hover:bg-[rgba(45,42,36,0.06)] active:scale-[0.97]"
    >
      <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
    </Link>
  )
}

/**
 * Læser ?returnTo klient-side, så statiske guide-sider ikke behøver
 * dynamiske searchParams i server-render-stien. Skal wrappes i <Suspense>
 * med <TilbageKnapVisning href={fallbackHref}/> som fallback.
 */
export function GuideTilbageLink({ fallbackHref }: { fallbackHref: string }) {
  const returnTo = useSearchParams().get('returnTo')
  const href =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : fallbackHref
  return <TilbageKnapVisning href={href} />
}
