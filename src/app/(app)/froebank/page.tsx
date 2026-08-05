import { Suspense } from 'react'
import { getAllInventoryItems, getCustomSubcategories } from '@/actions/froebank'
import { getCurrentUser } from '@/lib/auth'
import { DEMO_INVENTORY } from '@/lib/demo-inventory'
import { HaveStemning } from '@/components/havekalender/have-stemning'
import { FroebankBrowser } from '@/components/froebank/froebank-browser'
import { PageIntroNote } from '@/components/ui/page-intro-note'
import { Package } from 'lucide-react'
import { pickGardenNote } from '@/lib/garden-notes'
import { aktuelMaaned } from '@/lib/datetime'

export const dynamic = 'force-dynamic'

/**
 * Streaming-skal (koldstart-fix 5/8): siden flusher første byte med det
 * samme, så browseren henter CSS/JS/fonte/billeder PARALLELT med serverens
 * datahentning — i stedet for en hvid fane, til alt er færdigt. Indholdet
 * (uændret markup) streames ind, når dataene lander.
 */
export default function FroebankPage() {
  return (
    <Suspense fallback={null}>
      <FroebankIndhold />
    </Suspense>
  )
}

async function FroebankIndhold() {
  const [realInventory, customSubcategories, user] = await Promise.all([
    getAllInventoryItems(),
    getCustomSubcategories(),
    getCurrentUser(),
  ])

  // Hvis brugeren ikke er logget ind eller endnu ikke har tilføjet
  // egne frø, vis hele demo-puljen så designet kan ses i drift —
  // første frø bliver hero-kortet, resten sidder inde i mappestakken.
  // Skifter automatisk til brugerens rigtige inventory ved første tilføjelse.
  //
  // Stak-model (LÅST — se Docs/product/froebank-stack-handoff.md):
  //   /froebank henter inventory → FroebankBrowser filtrerer/sorterer →
  //   InventoryArchiveStack renderer FØRST én mappe pr. rigtigt frøkort og
  //   DEREFTER et fast sæt dekorative tail folders (tomme afslutningsmapper).
  //   Tail folders er KULISSE, ikke slots: de er ikke data, fyldes aldrig op
  //   med kommende frøkort, og antallet af frøkort ændrer dem ikke — de ligger
  //   altid sidst, og stakken kan vokse uendeligt. (IKKE den gamle "fyld op til
  //   12 slots"-model.)
  // Demo-puljen er KUN for anonyme besøgende (design synligt uden konto). En
  // indlogget bruger med 0 frø ser sin egen tomme frøbank, ikke opdigtede frø.
  const inventory = (!user && realInventory.length === 0) ? DEMO_INVENTORY : realInventory

  // Lille sensorisk note — kontekst-aware (måned, tid på dagen).
  // Varierer pr. dag, men skal ALDRIG ramme samme tekst som kalender-
  // sidens hardcodede "Gå i haven uden telefon." — og ikke noget for
  // tæt på (fx "Gå uden telefon.") så de to sider føles distinkte.
  const stemningNote = pickGardenNote(aktuelMaaned(), {
    exclude: ['Gå uden telefon.'],
    offset: 7,
  })

  return (
    <div className="space-y-6">
      <PageIntroNote
        id="froebank"
        icon={<Package className="h-4 w-4" />}
        title="Saml dine frø her"
        body="Potalot kan huske sorter, såtid og forslag til næste sæson for dig."
        hideWhen={realInventory.length >= 5}
      />

      {/* Frøbankens øverste arkivmappe + det komplette arkivsystem.
          Mappens søgning, kategori og filterchips styrer stacken. */}
      <FroebankBrowser inventory={inventory} customSubcategories={customSubcategories} />

      {/* Svævende sansenote efter samlingen — som en stille åndepause
          når brugeren har bladret gennem alle sine kort. Per
          HAVEN_SOM_SANCTUARY.md: "i bunden af et langt scroll". */}
      <div className="pt-6 pb-8">
        <HaveStemning text={stemningNote} />
      </div>
    </div>
  )
}
