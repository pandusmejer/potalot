import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { buildAIContext } from '@/lib/anthropic/context-builder'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const userId = DEMO_USER_ID

    if (false) {
      return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 401 })
    }

    const { messages, plantId, guideId } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: 'Ingen besked' }, { status: 400 })
    }

    const systemPrompt = await buildAIContext(supabase, userId, { plantId, guideId })
    const client = getAnthropicClient()

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Intern fejl' }, { status: 500 })
  }
}
