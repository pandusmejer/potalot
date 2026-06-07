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
  // V3.1 (Anna's feedback): tom-tilstand fjerner header HELT.
  // "Sådan har haven set ud" virker som en forbrydelse på en side
  // hvor haven endnu ikke har set ud af noget. I stedet: stort
  // foto + tekst-overlay som hovedobjekt.
  if (years.length === 0) {
    return <HistorikEmpty />
  }

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

      <div className="space-y-8 sm:space-y-10">
        {years.map((y, idx) => (
          <YearBlock key={y.year} year={y} defaultOpen={idx === 0} />
        ))}
      </div>
    </section>
  )
}

/**
 * Tom-tilstand med foto som hovedobjekt — Anna's spec:
 *
 *   [dug på blad]
 *   Historien begynder her.
 *   Din første note bliver
 *   Havebogens første side.
 *
 * Ingen "HISTORIK"-eyebrow, ingen "Sådan har haven set ud"-overskrift.
 * Når der er nul historik, er det forkert at annoncere det med en
 * label. Et stort foto + én rolig sætning fortæller historien.
 */
function HistorikEmpty() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        // V3.3 (Anna): "Dugbladet er bedre end hele heroet — det
        // foeles som et fund". Bump aspect 1.5:1 → 1.2:1 og fjern
        // maxHeight, sa fotoet faar feature-article-vægt og laeses
        // som hovedperson, ikke som thumbnail.
        marginInline: -16,
        aspectRatio: '1.2 / 1',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/makro/chili/blad-dug.jpg"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 45%',
          filter: 'saturate(0.92)',
        }}
      />
      {/* Tekstlæsbarhed-gradient — venstre side hvor teksten ligger */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(12,18,8,0.50) 0%, rgba(12,18,8,0.30) 45%, rgba(12,18,8,0.10) 80%, rgba(12,18,8,0) 100%)',
        }}
      />
      {/* Tekst-overlay venstre */}
      <div
        className="relative z-10 flex h-full flex-col justify-center"
        style={{ padding: '0 26px', maxWidth: 360 }}
      >
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(22px, 4.5vw, 30px)',
            lineHeight: 1.2,
            color: 'rgba(244,239,220,0.95)',
            textShadow: '0 1px 14px rgba(12,18,8,0.55)',
            margin: 0,
          }}
        >
          Historien begynder her.
        </p>
        <p
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 'clamp(16px, 3vw, 20px)',
            lineHeight: 1.45,
            color: 'rgba(244,239,220,0.78)',
            textShadow: '0 1px 12px rgba(12,18,8,0.55)',
            margin: 0,
            marginTop: 14,
          }}
        >
          Din første note bliver
          <br />
          Havebogens første side.
        </p>
      </div>
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
