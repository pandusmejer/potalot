import { NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { adminTools } from '@/lib/admin/tools'
import { executeAdminTool } from '@/lib/admin/tool-executor'
import { buildAdminSystemPrompt } from '@/lib/admin/system-prompt'
import type { MessageParam, ContentBlockParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages'

export async function POST(req: Request) {
  // Verify admin password
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 401 })
  }

  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Ingen besked' }, { status: 400 })
  }

  const client = getAnthropicClient()
  const systemPrompt = buildAdminSystemPrompt()

  // Build API messages from chat history
  const apiMessages: MessageParam[] = messages.map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const allToolResults: Array<{ tool: string; input: unknown; result: unknown }> = []
  let finalText = ''

  try {
    // Tool use loop — max 10 iterations to prevent runaway
    for (let i = 0; i < 10; i++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: adminTools,
        messages: apiMessages,
      })

      // Process response content blocks
      const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = []

      for (const block of response.content) {
        if (block.type === 'text') {
          finalText += block.text
        }
        if (block.type === 'tool_use') {
          toolUseBlocks.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          })
        }
      }

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
        break
      }

      // Execute all tool calls
      const toolResults: ToolResultBlockParam[] = []
      for (const toolUse of toolUseBlocks) {
        const result = await executeAdminTool(toolUse.name, toolUse.input)
        allToolResults.push({ tool: toolUse.name, input: toolUse.input, result })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
      }

      // Add assistant response + tool results to conversation
      apiMessages.push({
        role: 'assistant',
        content: response.content as ContentBlockParam[],
      })
      apiMessages.push({
        role: 'user',
        content: toolResults,
      })
    }

    return NextResponse.json({
      response: finalText,
      toolResults: allToolResults,
    })
  } catch (err) {
    console.error('Admin chat error:', err)
    return NextResponse.json(
      { error: 'Der opstod en fejl. Prøv igen.' },
      { status: 500 }
    )
  }
}
