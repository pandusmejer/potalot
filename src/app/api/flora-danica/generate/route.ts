/**
 * POST /api/flora-danica/generate
 *
 * Genererer en Flora Danica-illustration via OpenAI gpt-image-1.
 * Retunerer base64-billede.
 *
 * TODO (storage): Upload til Supabase Storage, gem MediaAsset-reference.
 * TODO (database): Opdater Guide med primaryImageId.
 * TODO (kurator): Markér illustration som approved=false til kurator-review.
 */

import { NextResponse } from 'next/server'
import { buildFloraDanicaPrompt, type FloraDanicaInput } from '@/lib/flora-danica/prompt'

export async function POST(req: Request) {
  try {
    const body = await req.json() as FloraDanicaInput

    if (!body.plantName) {
      return NextResponse.json({ error: 'plantName er påkrævet' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY mangler — billed-generering deaktiveret',
        prompt: buildFloraDanicaPrompt(body),
      }, { status: 503 })
    }

    const prompt = buildFloraDanicaPrompt(body)

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        quality: 'medium',
        n: 1,
      }),
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error('OpenAI error:', txt)
      return NextResponse.json({ error: 'Billed-generering fejlede' }, { status: 502 })
    }

    const data = await res.json()
    const imageBase64 = data?.data?.[0]?.b64_json

    if (!imageBase64) {
      return NextResponse.json({ error: 'Intet billede returneret' }, { status: 500 })
    }

    return NextResponse.json({
      imageBase64,
      // TODO (storage): persist til Supabase Storage og returner public URL
      url: `data:image/png;base64,${imageBase64}`,
      approved: false,
      prompt,
    })
  } catch (error) {
    console.error('Flora Danica generate error:', error)
    return NextResponse.json({ error: 'Intern fejl' }, { status: 500 })
  }
}
