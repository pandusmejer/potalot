import { redirect } from 'next/navigation'

/**
 * SKJULT INDTIL VIDERE: /havelandskab (Challenges/Seasonal Challenges-
 * laget) lanceres ikke endnu — kerneproduktet (5 hovedmenupunkter)
 * først. Layoutet redirecter til forsiden. Side-koden bevares til
 * senere relancering.
 */
export default function HavelandskabLayout(_: { children: React.ReactNode }) {
  redirect('/')
}
