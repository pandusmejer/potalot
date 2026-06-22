import * as React from 'react'

/**
 * MobilePreviewFrame — låser preview-/QA-indhold til MOBIL-bredde, så design
 * ALTID vurderes som det ser ud på en telefon (ikke strakt til desktop).
 *
 * Anna (22/6): "preview skal ALTID vise mobil — alle sektioner på samtlige
 * sider. Ellers kan jeg ikke vurdere designet."
 *
 * Sidens baggrund må gerne være fuld-bredde; det er KUN indholdskolonnen, der
 * låses. 390px = gængs telefon-bredde (matcher app'ens mobile-first kontrakt).
 */
export const MOBILE_PREVIEW_WIDTH = 390

export function MobilePreviewFrame({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-[390px] ${className}`}>{children}</div>
  )
}
