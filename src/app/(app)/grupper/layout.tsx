import { redirect } from 'next/navigation'

/**
 * SKJULT INDTIL VIDERE: Hele /grupper-sektionen (Communities-laget)
 * lanceres ikke endnu — kerneproduktet (5 hovedmenupunkter) først.
 * Layoutet fanger /grupper og alle undermapper (/udforsk, /[id],
 * /invitation/[token], /[id]/opslag/[postId], /[id]/sorter/[varietyId])
 * og redirecter til forsiden. Side-koden bevares til senere relancering.
 */
export default function GrupperLayout(_: { children: React.ReactNode }) {
  redirect('/')
}
