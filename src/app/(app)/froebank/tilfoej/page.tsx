import { TilfoejFlow } from '@/components/froebank/tilfoej-flow'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ mode?: string; from?: string; navn?: string; sort?: string }>
}

export default async function TilfoejPage({ searchParams }: Props) {
  const { mode, from, navn, sort } = await searchParams
  const initialMode = (mode === 'camera' || mode === 'library' || mode === 'link' || mode === 'manuel' || mode === 'oenskeliste' || mode === 'excel')
    ? mode
    : 'select'
  // Startet fra onboarding? Så fører tilbage-/færdig-links tilbage til opsætningen
  // (fremskridt bevaret: de tilføjede frø ligger allerede i frøbanken).
  const fromOnboarding = from === 'onboarding'
  return (
    <TilfoejFlow
      initialMode={initialMode}
      returnTo={fromOnboarding ? '/onboarding' : '/froebank'}
      returnLabel={fromOnboarding ? 'opsætning' : 'frøbank'}
      // ?navn=&sort= forudfylder manuel oprettelse (ingen blindgyder:
      // "Opret 'X'" fra søgning og "Tilføj til Frøbank" fra guides lander
      // med felterne udfyldt — autofill-motoren tager over derfra).
      initialName={navn}
      initialVariety={sort}
    />
  )
}
