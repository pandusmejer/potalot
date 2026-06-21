import {
  DetKanDuGoereEditorialPlanner,
  EDITORIAL_PLANNER_DEMO_ITEMS,
} from '@/components/havekalender/det-kan-du-goere-editorial-planner'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

export default function MonthlyPlannerPreviewPage() {
  return (
    <main
      className="overflow-x-clip pb-20"
      style={{ background: '#EAE6D8', minHeight: '100dvh' }}
    >
      <div className="mx-auto max-w-[820px] px-6 pb-8 pt-8">
        <p
          style={{
            color: 'rgba(36,48,31,0.55)',
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.2em',
            lineHeight: 1.25,
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          QA-preview · ikke implementeret
        </p>
        <h1
          style={{
            color: '#2D2A24',
            fontFamily: serif,
            fontSize: 'clamp(34px, 9vw, 52px)',
            fontWeight: 600,
            letterSpacing: '0',
            lineHeight: 1,
            margin: '10px 0 10px',
          }}
        >
          Editorial monthly planner
        </h1>
        <p
          style={{
            color: 'rgba(36,48,31,0.64)',
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 620,
          }}
        >
          Isoleret visning af den nye retning for "Det kan du gøre i [måned]".
          Kalenderen bruger stadig den gamle komponent.
        </p>
      </div>

      <div className="mx-auto max-w-[860px] px-0 sm:px-6">
        <DetKanDuGoereEditorialPlanner
          month={6}
          items={EDITORIAL_PLANNER_DEMO_ITEMS}
        />
      </div>
    </main>
  )
}
