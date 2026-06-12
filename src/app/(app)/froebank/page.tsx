import { getAllInventoryItems, getCustomSubcategories } from '@/actions/froebank'
import { DEMO_INVENTORY } from '@/lib/demo-inventory'
import { HaveStemning } from '@/components/havekalender/have-stemning'
import { FroebankBrowser } from '@/components/froebank/froebank-browser'
import { FroebankHero } from '@/components/froebank/froebank-hero'
import { pickGardenNote } from '@/lib/garden-notes'
import { aktuelMaaned } from '@/lib/datetime'

export const dynamic = 'force-dynamic'

export default async function FroebankPage() {
  const [realInventory, customSubcategories] = await Promise.all([
    getAllInventoryItems(),
    getCustomSubcategories(),
  ])

  // Hvis brugeren ikke er logget ind eller endnu ikke har tilføjet
  // egne frø, vis hele demo-puljen så designet kan ses i drift —
  // første frø bliver hero-kortet, resten sidder inde i mappestakken.
  // Skifter automatisk til brugerens rigtige inventory ved første
  // tilføjelse. Når brugeren har < 12 frø, fader resten af mappestakken
  // ud som tomme mapper.
  const inventory = realInventory.length === 0 ? DEMO_INVENTORY : realInventory

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
      {/* Stats til hero-row — beregnes fra den faktiske inventory.
          • antal sorter = antal items
          • antal frø = sum af seedsRemaining eller seedCount
          • udløber snart = items ældre end 2 år (frø-pose-heuristik) */}
      <FroebankHero
        title="Frøbank"
        tagline={'Din samling af frø,\nløg, knolde og stauder.'}
        stats={(() => {
          const sorterCount = inventory.length
          const seedTotal = inventory.reduce((sum, i) => {
            const r = i.seedsRemaining ?? i.seedCount ?? 0
            return sum + r
          }, 0)
          const nowYear = new Date().getFullYear()
          const udloeberSnart = inventory.filter(
            i => i.purchaseYear != null && nowYear - i.purchaseYear >= 2,
          ).length
          const parts: string[] = []
          if (sorterCount > 0) parts.push(`${sorterCount} ${sorterCount === 1 ? 'sort' : 'sorter'}`)
          if (seedTotal > 0) parts.push(`${seedTotal} frø`)
          if (udloeberSnart > 0) parts.push(`${udloeberSnart} udløber snart`)
          return parts
        })()}
      />

      {/* Filtrerings/sorterings-modul + det komplette arkivsystem.
          Filtrene styrer hvilke frø der vises i hero + stack. */}
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
