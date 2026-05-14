import { redirect } from 'next/navigation'

/**
 * /havebog er flettet ind i Overblik (forsiden) per maj 2026.
 * Behold som redirect for backward-kompatibilitet med eksisterende
 * links og bookmarks.
 */
export default function HavebogRedirect(): never {
  redirect('/')
}
