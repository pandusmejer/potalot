import { SpoergGartneren } from '@/components/guides/spoerg-gartneren'
import { AiSamtykkeKort } from '@/components/ai/ai-samtykke-kort'
import { getAiSamtykke } from '@/actions/ai-samtykke'

// Samtykket er pr. bruger, så siden kan ikke længere være statisk.
export const dynamic = 'force-dynamic'

/**
 * 💬 SPØRG POTALOT — MVP 1.0's fjerde navigationspunkt.
 *
 * Menupunktet hedder "Spørg Potalot"; identiteten inde på siden er stadig
 * Gartneren (låst). Siden GENBRUGER den eksisterende komponent og motor
 * (/api/ai/gartner) — samme universelle indgang som på Guides-forsiden.
 *
 * Fase 4: ét samtykke-kort (standard FRA). Uden samtykke sendes KUN det,
 * brugeren selv skriver. Med samtykke må serveren tilføje frøbank, planter,
 * stednavn og vejret nu — og svaret viser, hvad der blev brugt. Kortet er
 * skjult for anonyme og når valget ikke kan gemmes (migration B ikke kørt).
 */
export default async function SpoergPage() {
  const samtykke = await getAiSamtykke()
  return (
    <div className="space-y-6">
      <SpoergGartneren />
      <AiSamtykkeKort status={samtykke} />
    </div>
  )
}
