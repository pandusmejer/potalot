import { ChatInterface } from '@/components/ai/chat-interface'

interface Props {
  searchParams: Promise<{ plantId?: string; guideId?: string }>
}

export default async function AIPage({ searchParams }: Props) {
  const { plantId, guideId } = await searchParams

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">AI Assistent</h1>
        <p className="text-sm text-muted-foreground">Få rådgivning baseret på dine planter og data</p>
      </div>
      <ChatInterface plantId={plantId} guideId={guideId} />
    </div>
  )
}
