import { koerMotor } from '@/lib/motor/engine'
import { NextResponse } from 'next/server'

/**
 * Trigger reaktiv motor på demand.
 * Bruges af:
 *  - Dashboard ved load (for daglig opsummering)
 *  - Kalendersiden ved load
 *  - Scheduled function (fremtidig Netlify cron)
 */
export async function POST() {
  try {
    const result = await koerMotor()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Motor refresh error:', error)
    return NextResponse.json(
      { error: 'Motoren kunne ikke opdatere forslag' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}
