'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Sparkles, User } from 'lucide-react'
import { useRef, useState, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  plantId?: string
  guideId?: string
}

export function ChatInterface({ plantId, guideId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          plantId,
          guideId,
        }),
      })

      if (!response.ok) {
        throw new Error('Fejl i AI-svar')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Ingen stream')

      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages([...newMessages, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        assistantContent += decoder.decode(value, { stream: true })
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
        scrollToBottom()
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Beklager, der opstod en fejl. Prøv igen.' },
      ])
    } finally {
      setIsStreaming(false)
      scrollToBottom()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="h-10 w-10 text-primary/40 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">PotAlot AI</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Stil spørgsmål om dine planter, dyrkning eller sæsonplanlægning.
              AI&apos;en kender dine planter, noter og opgaver.
            </p>
            <div className="mt-4 space-y-2">
              {[
                'Hvad bør jeg så denne uge?',
                'Hvordan passer jeg bedst mine tomater?',
                'Hvad lærte jeg om chili sidste år?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-sm text-primary hover:bg-accent rounded-lg px-3 py-2 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.content || (isStreaming ? '...' : '')}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-border">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Stil et spørgsmål..."
          rows={1}
          className="min-h-[44px] max-h-32 resize-none"
        />
        <Button type="submit" disabled={!input.trim() || isStreaming} className="flex-shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
