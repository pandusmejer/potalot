import { SpoergGartneren } from '@/components/guides/spoerg-gartneren'

// Ingen serverdata: siden er en ren skal om den eksisterende Gartner-
// komponent. Spørgsmålet sendes først, når brugeren selv trykker.
export const dynamic = 'force-static'

/**
 * 💬 SPØRG POTALOT — MVP 1.0's fjerde navigationspunkt (fase 0).
 *
 * Menupunktet hedder "Spørg Potalot"; identiteten inde på siden er stadig
 * Gartneren (låst). Siden GENBRUGER den eksisterende komponent og motor
 * (/api/ai/gartner) uændret — samme universelle indgang som på Guides-
 * forsiden, uden guide- eller plantekontekst.
 *
 * Bevidst IKKE i fase 0: automatisk kontekst fra brugerens frøbank, planter
 * og lokation. Den kræver det gemte samtykke (ny profilindstilling) og
 * kommer i en senere fase. Her sendes KUN det, brugeren selv skriver.
 */
export default function SpoergPage() {
  return (
    <div className="space-y-6">
      <SpoergGartneren />
    </div>
  )
}
