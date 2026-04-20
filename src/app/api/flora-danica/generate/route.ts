import { NextResponse } from 'next/server'
import { genererFloraDanicaAsset } from '@/lib/flora-danica/assets'

/**
 * Generér Flora Danica-illustration for en variety.
 *
 * POST body: {
 *   variety_id: string,
 *   species_name: string,
 *   variety_name?: string,
 *   botanical_name?: string,
 *   part?: 'fuld_planche' | 'froe_detalje' | ...
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { variety_id, species_name, variety_name, botanical_name, part } = body

    if (!variety_id || !species_name) {
      return NextResponse.json(
        { error: 'variety_id og species_name er påkrævet' },
        { status: 400 }
      )
    }

    const result = await genererFloraDanicaAsset(variety_id, {
      species_name,
      variety_name,
      botanical_name,
      part,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      approved: result.approved,
      message: result.approved
        ? 'Illustration gemt.'
        : 'Illustration gemt — afventer godkendelse før den er officiel.',
    })
  } catch (error) {
    console.error('Flora Danica generate error:', error)
    return NextResponse.json(
      { error: 'Der opstod en fejl ved generering' },
      { status: 500 }
    )
  }
}
