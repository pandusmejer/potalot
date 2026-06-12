import { CalendarDays, Circle, Leaf, Sprout } from 'lucide-react'
import { GuideComparisonBadge, GuideComparisonList, type ComparisonRow } from './guide-comparison'

const comparisonRows: ComparisonRow[] = [
  {
    label: 'Frugt',
    icon: <Circle />,
    left: 'Slanke, aflange frugter',
    right: 'Ovale, bredere frugter',
  },
  {
    label: 'Konsistens',
    icon: <Leaf />,
    left: 'Få kerner og fast frugtkød',
    right: 'Mere kød end San Marzano',
  },
  {
    label: 'Anvendelse',
    icon: <Sprout />,
    left: 'Perfekt til sauce',
    right: 'God til sauce og konservering',
  },
  {
    label: 'Modning',
    icon: <CalendarDays />,
    left: 'Middeltidlig sort',
    right: 'Middeltidlig sort',
  },
]

export function GuideComparisonDemo() {
  return (
    <div className="space-y-8 overflow-x-clip py-8" style={{ background: '#EAE6D8' }}>
      <GuideComparisonList
        leftTitle="San Marzano"
        rightTitle="Roma"
        rows={comparisonRows}
        ctaLabel="Se guide til Roma"
      />

      <GuideComparisonBadge
        highlight="God til sauce"
        ctaLabel="Se guide til Roma"
        left={{
          title: 'San Marzano',
          subtitle: 'Ranketomat',
          imageSrc: '/images/plantekort/tomat-san-marzano.jpg',
          imageAlt: 'San Marzano tomater på planten',
          description: 'Slanke, aflange frugter med få kerner og fast frugtkød. Perfekt til sauce.',
        }}
        right={{
          title: 'Roma',
          subtitle: 'Ranketomat',
          imageSrc: '/images/placeholder/tomat-roma-comparison.jpg',
          imageAlt: 'Placeholder for Roma tomat',
          description: 'Ovale frugter med mere kød end San Marzano. God til sauce og konservering.',
        }}
      />
    </div>
  )
}
