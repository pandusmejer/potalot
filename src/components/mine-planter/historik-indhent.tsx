'use client'

import { useState, useSyncExternalStore } from 'react'
import { History, Activity, Ruler, X, Sprout, ArrowUpRight, TreePine, Wheat } from 'lucide-react'
import { LogForm } from '@/components/mine-planter/log-form'

const sans = 'var(--font-manrope)'

// Ingen abonnement — "sprunget over" ændrer sig kun via denne komponents egen
// skip() (lokal state), så vi behøver ikke lytte på storage-events.
const noSubscribe = () => () => {}

/**
 * "Hvordan har planten det i dag?" — indhentning efter en TILBAGEVIRKENDE
 * oprettelse.
 *
 * Når en bruger registrerer en plante med en sådato langt i fortiden, bliver
 * planten pludselig fx 164 dage gammel, kalenderen rykker, og loggen er tom.
 * Systemet opfører sig korrekt, men det føles forkert fordi intet forklares
 * (Anna 16/7). Dette kort forklarer hvad Potalot har udledt, og inviterer —
 * frivilligt — til at registrere plantens AKTUELLE tilstand.
 *
 * Vigtigt: trivsel/højde logges via LogForm, som dateres til I DAG (idag()),
 * altså som aktuelle observationer — ikke som hændelser på den historiske
 * sådato. Kortet forsvinder når brugeren har vurderet planten eller trykker
 * "Ikke nu" (husket pr. plante i localStorage).
 */
export function HistorikIndhent({
  plantId,
  ageDays,
  hasAssessment,
}: {
  plantId: string
  ageDays: number
  /** Har planten allerede en trivsels-/højde-registrering? Så er indhentningen sket. */
  hasAssessment: boolean
}) {
  // Læs "sprunget over"-flaget fra localStorage hydrerings-sikkert: serveren
  // (og første klient-render) ser false, hvorefter klient-snapshot slår igennem.
  const skippedBefore = useSyncExternalStore(
    noSubscribe,
    () => {
      try { return localStorage.getItem(`indhent-skip-${plantId}`) === '1' } catch { return false }
    },
    () => false,
  )
  const [dismissed, setDismissed] = useState(false)

  if (skippedBefore || dismissed || hasAssessment) return null

  function skip() {
    try {
      localStorage.setItem(`indhent-skip-${plantId}`, '1')
    } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <section
      style={{ background: '#F2EFE2', border: '1px solid rgba(36,48,31,0.12)', borderRadius: 20, padding: '18px 18px 16px' }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: 38, height: 38, borderRadius: 12, background: '#E7ECDD', color: '#3D4A2C' }}
        >
          <History className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p style={{ fontFamily: sans, fontSize: 15.5, fontWeight: 700, color: '#24301F', margin: 0, lineHeight: 1.2 }}>
            Planten har allerede været i gang i {ageDays} {ageDays === 1 ? 'dag' : 'dage'}
          </p>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'rgba(36,48,31,0.65)', margin: '6px 0 0' }}>
            Vi har sat alderen ud fra din sådato og placeret planten på det
            aktuelle stadie. Vi kan ikke vide hvornår den spirede, blev udplantet
            eller hvordan den har det nu — men det kan du fortælle.
          </p>
        </div>
        <button
          type="button"
          onClick={skip}
          aria-label="Ikke nu"
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-[rgba(36,48,31,0.06)]"
          style={{ color: 'rgba(36,48,31,0.4)' }}
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <p style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(36,48,31,0.5)', margin: '16px 0 8px' }}>
        Hvordan har den det i dag? <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(frivilligt)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <LogForm plantId={plantId} defaultType="health" trigger={indhentChip(<Activity className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />, 'Registrér trivsel')} />
        <LogForm plantId={plantId} defaultType="height_measurement" trigger={indhentChip(<Ruler className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />, 'Mål højden')} />
      </div>

      <p style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(36,48,31,0.5)', margin: '16px 0 8px' }}>
        Kendte milepæle <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(vælg den dato de skete)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <LogForm plantId={plantId} defaultType="germination" trigger={indhentChip(<Sprout className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />, 'Spiret')} />
        <LogForm plantId={plantId} defaultType="repotting" trigger={indhentChip(<ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />, 'Pottet om')} />
        <LogForm plantId={plantId} defaultType="planting_out" trigger={indhentChip(<TreePine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />, 'Udplantet')} />
        <LogForm plantId={plantId} defaultType="harvest" trigger={indhentChip(<Wheat className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />, 'Høstet')} />
      </div>
    </section>
  )
}

/** Native <button> så Radix' asChild-clone på LogForm-triggeren virker. */
function indhentChip(icon: React.ReactNode, label: string) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full transition-transform active:scale-[0.97]"
      style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: '#3D4A2C', background: '#FFFFFF', border: '1px solid rgba(61,74,44,0.18)', padding: '8px 14px' }}
    >
      {icon}
      {label}
    </button>
  )
}
