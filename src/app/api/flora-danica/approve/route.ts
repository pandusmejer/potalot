import { NextResponse } from 'next/server'
import { godkendAsset } from '@/lib/flora-danica/assets'

/**
 * Godkend et AI-genereret asset (kurator).
 *
 * POST body: { variety_id: string }
 */
export async function POST(req: Request) {
  try {
    const { variety_id } = await req.json()
    if (!variety_id) {
      return NextResponse.json({ error: 'variety_id påkrævet' }, { status: 400 })
    }

    const result = await godkendAsset(variety_id)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approve error:', error)
    return NextResponse.json({ error: 'Der opstod en fejl' }, { status: 500 })
  }
}
