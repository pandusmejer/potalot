import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Admin ikke konfigureret' }, { status: 500 })
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Forkert adgangskode' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
