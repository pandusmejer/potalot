/**
 * Kreditering af postnummerdata (GeoNames, CC BY 4.0) — vises hvor
 * postnummeropslaget bruges (Indstillinger + onboarding) og på privatlivssiden.
 * Licensen kræver kildeangivelse, link til licensen og oplysning om ændringer.
 *
 * `stor` = brødtekst-størrelse (privatlivssiden); standard er en diskret note.
 */
export function PostnrKreditering({ stor = false }: { stor?: boolean }) {
  return (
    <p className={stor ? 'text-[15px] leading-relaxed text-foreground' : 'text-[11px] leading-snug text-muted-foreground'}>
      Postnumre og stednavne fra{' '}
      <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline">GeoNames</a>
      {' '}(
      <a href="https://creativecommons.org/licenses/by/4.0/deed.da" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>
      ), udvalgt og tilpasset af Potalot.
    </p>
  )
}
