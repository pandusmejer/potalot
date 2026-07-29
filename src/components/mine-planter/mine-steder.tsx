'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  GlyphHojbed, GlyphDrivhus, GlyphKrukke, GlyphJord, GlyphBlad, GlyphSpire, type GlyphProps,
} from '@/components/icons/potalot-glyphs'
import { slugifySted, inferStedType } from '@/lib/steder'
import { createGardenLocation } from '@/actions/garden-locations'
import type { Plant, GardenLocation } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const STED_TYPER = ['Højbed', 'Drivhus', 'Krukke', 'Vindueskarm', 'Altan', 'Friland', 'Andet']

// Dæmpede botaniske gradienter til no-foto-kort (grøn/creme/terracotta) —
// roteres for variation, så kort uden foto stadig føles forskellige.
const PLACEHOLDER_GRADS = [
  'linear-gradient(158deg, #EBEDE2 0%, #CAD4B6 100%)',
  'linear-gradient(158deg, #F3EEDF 0%, #E4D6B8 100%)',
  'linear-gradient(158deg, #F0E7DD 0%, #D9C0A6 100%)',
]

interface LokaltSted {
  name: string
  type: string
}

interface StedKort {
  name: string
  antal: number
  type: string
  image?: string | null
}

/** Stedtype → Potalot Soft Glyph (ingen dedikeret = rolig botanisk fallback). */
function glyphForType(type: string): (p: GlyphProps) => ReactNode {
  switch (type) {
    case 'Højbed':  return GlyphHojbed
    case 'Drivhus': return GlyphDrivhus
    case 'Krukke':  return GlyphKrukke
    case 'Friland': return GlyphJord
    case 'Vindueskarm':
    case 'Altan':   return GlyphBlad
    default:        return GlyphSpire
  }
}

/**
 * 📍 DYRKNINGSSTEDER — hvor de levende ting bor.
 * (Sektionsoverskrift "Mine steder" → "Dyrkningssteder" 17/6: "steder" alene
 *  var for bredt. "Sted" beholdes i handlinger/flow; komponent stadig MineSteder.)
 *
 * Anna (16. juni 2026): steder må ALDRIG falde tilbage til tomme grå kort
 * eller generiske stockfotos ("smukt bedrag"). Et sted kan eksistere uden
 * foto, men skal stadig føles som et bevidst Potalot-kort: dæmpet botanisk
 * gradient + type-glyph + navn + antal (Løsning A). Fotokort vises kun når
 * stedet faktisk HAR et foto. Tom-tilstand = ingen falske demo-steder.
 */
export function MineSteder({
  plants,
  gardenLocations = [],
  canPersist = false,
}: {
  plants: Plant[]
  gardenLocations?: GardenLocation[]
  canPersist?: boolean
}) {
  const [created, setCreated] = useState<LokaltSted[]>([])
  const [showForm, setShowForm] = useState(false)
  const [navn, setNavn] = useState('')
  const [type, setType] = useState(STED_TYPER[0])
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [fadeRight, setFadeRight] = useState(false)

  // Antal pr. stednavn (case-insensitivt) udledt af planternes location-tekst.
  // Plant.location bevares selv når planten er koblet via garden_location_id,
  // så optællingen rammer både legacy- og nye planter.
  const countByName = new Map<string, number>()
  const labelByKey = new Map<string, string>()
  for (const p of plants) {
    const loc = p.location?.trim()
    if (!loc) continue
    const key = loc.toLowerCase()
    countByName.set(key, (countByName.get(key) ?? 0) + (p.quantity ?? 0))
    if (!labelByKey.has(key)) labelByKey.set(key, loc)
  }

  // Saml steder i prioritet: oprettede entities > udledt af plante-tekst >
  // lokalt tilføjede (demo/optimistisk). Dedup på lille-navn, så et persisteret
  // sted ikke dubleres af sin egen udledte/lokale tvilling.
  const byKey = new Map<string, StedKort>()
  const add = (k: StedKort) => {
    const key = k.name.trim().toLowerCase()
    if (!key || byKey.has(key)) return
    byKey.set(key, k)
  }
  for (const gl of gardenLocations) {
    add({ name: gl.name, type: gl.type, image: gl.imageUrl ?? null, antal: countByName.get(gl.name.trim().toLowerCase()) ?? 0 })
  }
  for (const [key, label] of labelByKey) {
    add({ name: label, type: inferStedType(label), image: null, antal: countByName.get(key) ?? 0 })
  }
  for (const c of created) {
    add({ name: c.name, type: c.type, image: null, antal: 0 })
  }
  const steder = [...byKey.values()].sort(
    (a, b) => b.antal - a.antal || a.name.localeCompare(b.name, 'da'),
  )

  // Fade-hint i højre kant: vis kun når rækken faktisk overflow'er, og
  // skjul den når man er scrollet til enden.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => setFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [steder.length])

  function gem() {
    const n = navn.trim()
    if (!n) return
    const valgtType = type
    setError(null)
    // Optimistisk: vis kortet med det samme.
    setCreated((prev) =>
      prev.some((c) => c.name.toLowerCase() === n.toLowerCase()) ? prev : [...prev, { name: n, type: valgtType }],
    )
    setNavn('')
    setType(STED_TYPER[0])
    setShowForm(false)

    if (!canPersist) return // demo: lokalt/ikke-gemt (markeret ærligt i formen)

    startTransition(async () => {
      const res = await createGardenLocation({ name: n, type: valgtType })
      if ('error' in res) {
        // Rul den optimistiske tilføjelse tilbage og bring formen frem igen.
        setCreated((prev) => prev.filter((c) => c.name.toLowerCase() !== n.toLowerCase()))
        setNavn(n)
        setType(valgtType)
        setShowForm(true)
        setError(res.error)
      }
      // Succes: revalidatePath opdaterer gardenLocations-prop'en; dedup på
      // navn fjerner den lokale dublet, så stedet nu vises som persisteret.
    })
  }

  return (
    <section>
      <header className="mb-3.5 flex items-baseline justify-between gap-3 px-0.5">
        <h2
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.52)', margin: 0 }}
        >
          Dyrkningssteder
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

      {/* Inline opret-form — foto er valgfrit (tilføjes senere). */}
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
          <p style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 400, color: 'rgba(36,48,31,0.45)', margin: '8px 0 0' }}>
            {canPersist ? 'Foto kan tilføjes senere.' : 'Demo — stedet gemmes ikke.'}
          </p>
          {error && (
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#A1483A', margin: '6px 0 0' }}>
              {error}
            </p>
          )}
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
        <div className="relative -mx-4">
          <div ref={scrollerRef} className="overflow-x-auto px-4 scrollbar-hide">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
            {steder.map((sted, i) => {
              const G = glyphForType(sted.type)
              const antalTekst = sted.antal === 0 ? 'Ingen planter endnu' : `${sted.antal} ${sted.antal === 1 ? 'plante' : 'planter'}`
              return (
                <Link
                  key={sted.name}
                  href={`/mine-planter/sted/${slugifySted(sted.name)}`}
                  className="group relative block shrink-0 overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-0.5"
                  style={{ width: 208, height: 146, borderRadius: 22 }}
                >
                  {sted.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async"
                        src={sted.image}
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
                        <p className="uppercase" style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.78)', textShadow: '0 1px 6px rgba(18,14,8,0.5)', margin: 0 }}>{sted.type}</p>
                        <p style={{ fontFamily: serif, fontWeight: 600, fontSize: 22, lineHeight: 1.05, color: '#FFFFFF', textShadow: '0 1px 10px rgba(18,14,8,0.5)', margin: '3px 0 0' }}>{sted.name}</p>
                        <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.86)', textShadow: '0 1px 6px rgba(18,14,8,0.5)', margin: '2px 0 0' }}>{antalTekst}</p>
                      </div>
                    </>
                  ) : (
                    // No-foto: stedkort — gradient + STOR dæmpet type-glyph som
                    // baggrundsform + type-label (overlinje) + navn + antal. Ingen
                    // "Tilføj foto" på forsiden (hører til sted-detail).
                    <div className="absolute inset-0" style={{ background: PLACEHOLDER_GRADS[i % PLACEHOLDER_GRADS.length] }}>
                      <span aria-hidden className="pointer-events-none absolute" style={{ right: -2, top: 4, opacity: 0.18 }}>
                        <G size={92} />
                      </span>
                      <div className="absolute inset-x-0 bottom-0" style={{ padding: 16 }}>
                        <p className="uppercase" style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.45)', margin: 0 }}>{sted.type}</p>
                        <p style={{ fontFamily: serif, fontWeight: 600, fontSize: 22, lineHeight: 1.05, color: '#24301F', margin: '3px 0 0' }}>{sted.name}</p>
                        <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em', color: 'rgba(36,48,31,0.6)', margin: '2px 0 0' }}>{antalTekst}</p>
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}

            {/* + Nyt sted — sidste kort i rækken. */}
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex shrink-0 flex-col items-center justify-center gap-2 transition-colors"
              style={{ width: 132, height: 146, borderRadius: 22, background: '#F1EEE2', border: '1px dashed rgba(36,48,31,0.22)', cursor: 'pointer' }}
            >
              <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(90,112,56,0.12)' }}>
                <Plus className="h-5 w-5" strokeWidth={2.2} style={{ color: '#5A7038' }} aria-hidden />
              </span>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.66)' }}>Nyt sted</span>
            </button>
            </div>
          </div>
          {fadeRight && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0"
              style={{ width: 56, background: 'linear-gradient(to left, var(--background), transparent)' }}
            />
          )}
        </div>
      )}
    </section>
  )
}
