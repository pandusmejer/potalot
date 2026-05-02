import { TilfoejFlow } from '@/components/froebank/tilfoej-flow'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ mode?: string }>
}

export default async function TilfoejPage({ searchParams }: Props) {
  const { mode } = await searchParams
  const initialMode = (mode === 'camera' || mode === 'library' || mode === 'manuel' || mode === 'oenskeliste' || mode === 'excel')
    ? mode
    : 'select'
  return <TilfoejFlow initialMode={initialMode} />
}
