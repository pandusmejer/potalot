import { formatPlantDate, type MockPlantLog } from '@/data/mock-plants'

interface PlantLogEntryProps {
  entry: MockPlantLog
}

export function PlantLogEntry({ entry }: PlantLogEntryProps) {
  return (
    <article className="rounded-2xl border border-border bg-card/80 p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {formatPlantDate(entry.date)}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-foreground">{entry.action}</h3>
      {entry.note && (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.note}</p>
      )}
    </article>
  )
}
