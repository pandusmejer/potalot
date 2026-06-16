'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Plant } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

// Atmosfæriske have-/sæsonfotos (ikke et falsk "dit drivhus"-foto —
// stemning, ikke dokumentation). Roteres pr. sted for variation.
const STEMNINGSFOTOS = [
  '/images/heroes-maaneder/hero-juni-foto.png',
  '/images/heroes-maaneder/hero-maj-foto.png',
  '/images/heroes-maaneder/hero-foraar.png',
  '/images/heroes-maaneder/hero-april-foto.png',
]

const STED_TYPER = ['Højbed', 'Drivhus', 'Krukke', 'Vindueskarm', 'Altan', 'Friland', 'Andet']

interface LokaltSted {
  name: string
  type: string
}

/**
 * 📍 MINE STEDER — hvor de levende ting bor.
 *
 * Anna (spec): "Store destinationskort. Brugeren går ind i et sted."
 * Grupperer aktive planter efter lokation. Revision 16. juni: tydelig
 * oprettelsesvej — "Tilføj sted +" i headeren + "+ Nyt sted"-kort + en
 * inline opret-form (navn + type) + tom-tilstand. V1 gemmer kun i
 * sessionen; persistens (entity), Profil/Min have-admin og inline-ved-
 * plante-oprettelse er udskudte trin.
 */
export function MineSteder({ plants }: { plants: Plant[] }) {
  const [created, setCreated] = useState<LokaltSted[]>([])
  const [showForm, setShowForm] = useState(false)
  const [navn, setNavn] = useState('')
  const [type, setType] = useState(STED_TYPER[0])

  // Steder udledt af planternes lokation + brugerens egne nyoprettede.
  const byLocation = new Map<string, number>()
  for (const p of plants) {
    const loc = p.location?.trim()
    if (!loc) continue
    byLocation.set(loc, (byLocation.get(loc) ?? 0) + (p.quantity ?? 0))
  }
  const derived = [...byLocation.entries()].sort((a, b) => b[1] - a[1]).map(([name, antal]) => ({ name, antal }))
  const nyoprettede = created.filter((c) => !byLocation.has(c.name)).map((c) => ({ name: c.name, antal: 0 }))
  const steder = [...derived, ...nyoprettede]

  function gem() {
    const n = navn.trim()
    if (!n) return
    setCreated((prev) => [...prev, { name: n, type }])
    setNavn('')
    setType(STED_TYPER[0])
    setShowForm(false)
  }

  return (
    <section>
      <header className="mb-3.5 flex items-baseline justify-between gap-3 px-0.5">
        <h2
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.52)', margin: 0 }}
        >
          Mine steder
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1 transition-colors"
          style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: '#5E7D4F', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          Tilføj sted
          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
        </button>
      </header>

      {/* Inline opret-form. */}
      {showForm && (
        <div
          className="mb-3"
          style={{ background: '#FBF8EC', border: '1px solid rgba(36,48,31,0.10)', borderRadius: 18, padding: 16 }}
        >
          <label
            className="uppercase block"
            style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(36,48,31,0.5)', margin: '0 0 8px' }}
          >
            Nyt sted
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              value={navn}
              onChange={(e) => setNavn(e.target.value)}
              placeholder="Navn (fx Højbed 2)"
              onKeyDown={(e) => { if (e.key === 'Enter') gem() }}
              className="min-w-0 flex-1"
              style={{ fontFamily: sans, fontSize: 14, color: '#24301F', background: '#FFFFFF', border: '1px solid rgba(36,48,31,0.16)', borderRadius: 12, padding: '10px 12px' }}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ fontFamily: sans, fontSize: 14, color: '#24301F', background: '#FFFFFF', border: '1px solid rgba(36,48,31,0.16)', borderRadius: 12, padding: '10px 12px' }}
            >
              {STED_TYPER.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={gem}
              disabled={!navn.trim()}
              style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: '#FFFFFF', background: navn.trim() ? '#5A7038' : 'rgba(36,48,31,0.25)', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: navn.trim() ? 'pointer' : 'default' }}
            >
              Gem sted
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNavn('') }}
              style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: 'rgba(36,48,31,0.6)', background: 'transparent', border: 'none', padding: '9px 8px', cursor: 'pointer' }}
            >
              Annuller
            </button>
          </div>
        </div>
      )}

      {steder.length === 0 ? (
        // Tom-tilstand — ikke falske demo-steder.
        !showForm && (
          <div
            className="flex flex-col items-start"
            style={{ background: '#FBF8EC', border: '1px dashed rgba(36,48,31,0.16)', borderRadius: 20, padding: '22px 20px' }}
          >
            <p style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 400, lineHeight: 1.45, color: 'rgba(36,48,31,0.7)', margin: 0, maxWidth: '34ch' }}>
              Organisér dine planter efter hvor de vokser.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 inline-flex items-center gap-1.5"
              style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: '#FFFFFF', background: '#5A7038', border: 'none', borderRadius: 999, padding: '10px 18px', cursor: 'pointer' }}
            >
              Opret dit første sted →
            </button>
          </div>
        )
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {steder.map((sted, i) => (
              <Link
                key={sted.name}
                href="/mine-planter"
                className="group relative block shrink-0 overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-0.5"
                style={{ width: 208, height: 168, borderRadius: 22 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={STEMNINGSFOTOS[i % STEMNINGSFOTOS.length]}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(18,22,14,0.10) 0%, rgba(18,22,14,0.28) 50%, rgba(18,22,14,0.74) 100%)' }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p style={{ fontFamily: serif, fontWeight: 600, fontSize: 24, lineHeight: 1.05, color: '#FFFFFF', textShadow: '0 1px 10px rgba(18,14,8,0.5)', margin: 0 }}>
                    {sted.name}
                  </p>
                  <p
                    className="mt-1"
                    style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.86)', textShadow: '0 1px 6px rgba(18,14,8,0.5)', margin: '3px 0 0' }}
                  >
                    {sted.antal === 0 ? 'Ingen planter endnu' : `${sted.antal} ${sted.antal === 1 ? 'plante' : 'planter'}`}
                  </p>
                </div>
              </Link>
            ))}

            {/* + Nyt sted — sidste kort i rækken. */}
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex shrink-0 flex-col items-center justify-center gap-2 transition-colors"
              style={{ width: 132, height: 168, borderRadius: 22, background: '#F1EEE2', border: '1px dashed rgba(36,48,31,0.22)', cursor: 'pointer' }}
            >
              <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(90,112,56,0.12)' }}>
                <Plus className="h-5 w-5" strokeWidth={2.2} style={{ color: '#5A7038' }} aria-hidden />
              </span>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.66)' }}>Nyt sted</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
