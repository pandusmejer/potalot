import type { HistoryYear, HistoryMonth } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  years: HistoryYear[]
}

/**
 * 🌳 PRIMÆR SEKTION — Havebogens hjerte.
 *
 * Historik skal visuelt være den STØRSTE sektion på siden. Hvis plads
 * skal prioriteres mellem sektioner, prioriter Historik over alle andre.
 * Havebogens primære funktion er at bevare og genopleve dyrkningshistorie.
 *
 * Per måned vises:
 *   - måned + år
 *   - metadata: {n} noter · {n} billeder · {n} sorter
 *   - billed-mosaik
 *
 * Bruger native <details>/<summary> til år-accordion: latest expanded,
 * tidligere år collapsed. Ingen JavaScript påkrævet.
 */
export function Historik({ years }: Props) {
  return (
    <section className="space-y-6 sm:space-y-7">
      <header className="space-y-2">
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
          }}
        >
          Historik
        </p>
        <h2
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(30px, 6vw, 44px)',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: '#24301F',
            margin: 0,
            maxWidth: 480,
          }}
        >
          Sådan har haven set ud
        </h2>
      </header>

      {years.length === 0 ? (
        // Historik er sidens primære sektion; tom-tilstand skal have
        // tilsvarende vægt. To linjer der placerer brugeren i en
        // gennemførbar fremtid — "din første note" er konkret, ikke
        // abstrakt "kom igang med at logge".
        <div style={{ paddingBlock: '4px 0' }}>
          <p
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 19,
              lineHeight: 1.55,
              color: 'rgba(36,48,31,0.55)',
              margin: 0,
              maxWidth: 460,
            }}
          >
            Endnu har haven ingen historik.<br />
            Din første note bliver sidens første side.
          </p>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {years.map((y, idx) => (
            <YearBlock key={y.year} year={y} defaultOpen={idx === 0} />
          ))}
        </div>
      )}
    </section>
  )
}

function YearBlock({ year, defaultOpen }: { year: HistoryYear; defaultOpen: boolean }) {
  const totalNotes = year.months.reduce((sum, m) => sum + m.noteCount, 0)
  return (
    <details
      open={defaultOpen}
      className="group"
      style={{ borderTop: '1px solid rgba(36,48,31,0.10)', paddingTop: 20 }}
    >
      <summary
        className="flex cursor-pointer list-none items-baseline justify-between gap-3"
        style={{ userSelect: 'none' }}
      >
        <h3
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(38px, 8vw, 56px)',
            lineHeight: 1,
            letterSpacing: '-0.025em',
            color: '#24301F',
            margin: 0,
          }}
        >
          {year.year}
        </h3>
        <span
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.50)',
            letterSpacing: '0.01em',
            flexShrink: 0,
          }}
        >
          {totalNotes} {totalNotes === 1 ? 'note' : 'noter'} · {year.months.length}{' '}
          {year.months.length === 1 ? 'måned' : 'måneder'}
        </span>
      </summary>
      <div className="mt-6 space-y-7 sm:space-y-9">
        {year.months.map(m => (
          <MonthBlock key={m.monthIdx} month={m} year={year.year} />
        ))}
      </div>
    </details>
  )
}

function MonthBlock({ month, year }: { month: HistoryMonth; year: number }) {
  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <p
          style={{
            fontFamily: sans,
            fontSize: 16,
            fontWeight: 700,
            color: '#24301F',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {month.monthName} {year}
        </p>
        <p
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
          }}
        >
          {month.noteCount} {month.noteCount === 1 ? 'note' : 'noter'} ·{' '}
          {month.imageCount} {month.imageCount === 1 ? 'billede' : 'billeder'} ·{' '}
          {month.varietyCount} {month.varietyCount === 1 ? 'sort' : 'sorter'}
        </p>
      </header>
      {month.imageUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2">
          {month.imageUrls.slice(0, 12).map((url, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src={url}
              alt=""
              className="aspect-square w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}
    </div>
  )
}
