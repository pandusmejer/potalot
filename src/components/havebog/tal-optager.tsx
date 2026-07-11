'use client'

import { useEffect, useRef, useState } from 'react'
import { fortolkTale } from '@/actions/tale'
import { gemOptagelse, behandlOptagelse } from '@/actions/optagelser'
import type { TaleForslag, ForslagType } from '@/lib/tale-fortolk'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

type Fase = 'idle' | 'lytter' | 'skriver' | 'fortolker' | 'forslag' | 'gemmer' | 'gemt' | 'fejl'

const TYPE_LABEL: Record<ForslagType, string> = {
  note: 'Note',
  observation: 'Observation',
  hoest: 'Høst',
  opgave: 'Opgave',
}

// Minimal Web Speech-typning (ikke i standard lib.dom alle steder).
interface TaleGenkender {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onerror: () => void
  onend: () => void
  start: () => void
  stop: () => void
}

function nyGenkender(): TaleGenkender | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => TaleGenkender
    webkitSpeechRecognition?: new () => TaleGenkender
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const r = new Ctor()
  r.lang = 'da-DK'
  r.interimResults = false
  r.continuous = false
  return r
}

/**
 * RUM 3 — "Tal til din have" som ÆGTE inputmotor (V19).
 *
 * Tal (Web Speech, da-DK) eller skriv → Claude foreslår 1-3
 * strukturerede ting → du godkender → Potalot gemmer dem det
 * rigtige sted (note/observation/høst → plante-log, opgave →
 * kalender). Den eneste funktion der producerer eget råstof.
 *
 * Web Speech findes ikke på iOS Safari → tekst-fallbacken ("skriv i
 * stedet") sikrer at motoren virker overalt i dag. En server-side
 * transskription (universel stemme) er flagget som senere valg.
 */
export function TalOptager() {
  const [fase, setFase] = useState<Fase>('idle')
  const [tekst, setTekst] = useState('')
  const [forslag, setForslag] = useState<TaleForslag[]>([])
  const [valgte, setValgte] = useState<Set<string>>(new Set())
  const [resultat, setResultat] = useState<string>('')
  // Optagelsen persisteres (indbakke) og dens id bruges når den behandles.
  const [optagelseId, setOptagelseId] = useState<string | null>(null)
  const [sekunder, setSekunder] = useState(0)
  const genkenderRef = useRef<TaleGenkender | null>(null)

  const harTale = typeof window !== 'undefined' && nyGenkender() !== null

  // Optager-timer (kun mens vi lytter).
  useEffect(() => {
    if (fase !== 'lytter') { setSekunder(0); return }
    const t = setInterval(() => setSekunder(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [fase])
  const mmss = `${String(Math.floor(sekunder / 60)).padStart(2, '0')}:${String(sekunder % 60).padStart(2, '0')}`

  function startLyt() {
    const r = nyGenkender()
    if (!r) {
      setFase('skriver')
      return
    }
    genkenderRef.current = r
    r.onresult = e => {
      const t = e.results?.[0]?.[0]?.transcript ?? ''
      setTekst(t)
      void fortolk(t)
    }
    r.onerror = () => setFase('skriver')
    r.onend = () => setFase(f => (f === 'lytter' ? 'idle' : f))
    setFase('lytter')
    r.start()
  }

  function stopLyt() {
    genkenderRef.current?.stop()
  }

  async function fortolk(t: string) {
    const trimmet = t.trim()
    if (!trimmet) {
      setFase('idle')
      return
    }
    setFase('fortolker')
    // Persistér optagelsen som det FØRSTE (indbakke): den findes i arkivet
    // som 'unprocessed' uanset om brugeren behandler den nu eller senere.
    const gem = await gemOptagelse(trimmet)
    if ('id' in gem) setOptagelseId(gem.id)
    const res = await fortolkTale(trimmet)
    if ('error' in res || res.forslag.length === 0) {
      setResultat('error' in res ? res.error : 'Jeg fangede ikke noget brugbart — prøv igen.')
      setFase('fejl')
      return
    }
    setForslag(res.forslag)
    setValgte(new Set(res.forslag.map(f => f.id)))
    setFase('forslag')
  }

  function toggle(id: string) {
    setValgte(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function gem() {
    const valgteForslag = forslag.filter(f => valgte.has(f.id))
    if (valgteForslag.length === 0 || !optagelseId) return
    setFase('gemmer')
    // Behandl optagelsen: opret log/opgave på OPTAGELSENS dato + opdatér status.
    const res = await behandlOptagelse(optagelseId, valgteForslag)
    if ('error' in res) {
      setResultat(res.error)
      setFase('fejl')
      return
    }
    setResultat('Gemt i din havebog.')
    setFase('gemt')
  }

  function nulstil() {
    setTekst('')
    setForslag([])
    setValgte(new Set())
    setResultat('')
    setOptagelseId(null)
    setFase('idle')
  }

  const optager = fase === 'lytter'
  return (
    <section className="flex flex-col items-center" style={{ textAlign: 'center' }}>
      <style>{`
        @keyframes tal-breath {
          0%, 100% { transform: scale(1); box-shadow: 0 12px 30px rgba(31,45,29,0.18); }
          50%      { transform: scale(1.035); box-shadow: 0 18px 42px rgba(31,45,29,0.22); }
        }
        @keyframes tal-halo {
          0%, 100% { transform: scale(0.92); opacity: 0; }
          50%      { transform: scale(1.18); opacity: 0.16; }
        }
        @keyframes tal-rec {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        @keyframes tal-halo-rec {
          0%, 100% { transform: scale(0.98); opacity: 0.1; }
          50%      { transform: scale(1.3); opacity: 0.28; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tal-breath, .tal-halo { animation: none !important; }
        }
      `}</style>

      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.26em',
          lineHeight: 1.5,
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
          marginBottom: 46,
        }}
      >
        Tryk og tal
        <br />
        til din have
      </p>

      {(fase === 'idle' || fase === 'lytter') && (
        <>
          <div style={{ position: 'relative', width: 104, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              aria-hidden
              className="tal-halo"
              style={{
                position: 'absolute',
                width: 132,
                height: 132,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(55,76,45,0.55) 0%, rgba(55,76,45,0.22) 45%, rgba(55,76,45,0) 72%)',
                animation: `${optager ? 'tal-halo-rec' : 'tal-halo'} ${optager ? '2.2s' : '4.4s'} ease-in-out infinite`,
              }}
            />
            <button
              type="button"
              onClick={optager ? stopLyt : startLyt}
              aria-label={optager ? 'Stop optagelse' : 'Tryk og tal til din have'}
              className={optager ? undefined : 'tal-breath'}
              style={{
                position: 'relative',
                width: 92,
                height: 92,
                borderRadius: '50%',
                border: 'none',
                background: optager ? '#2C3A22' : '#3B4A2F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(31,45,29,0.18)',
                cursor: 'pointer',
                animation: optager ? 'tal-rec 2.2s ease-in-out infinite' : 'tal-breath 4.4s ease-in-out infinite',
              }}
            >
              {optager ? (
                <span aria-hidden style={{ width: 22, height: 22, borderRadius: 5, background: '#F4EFDC' }} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="9" y="3" width="6" height="11" rx="3" fill="#F4EFDC" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="#F4EFDC" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          {optager ? (
            <p
              className="uppercase"
              style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#5A6F45', margin: 0, marginTop: 28 }}
            >
              Optager… {mmss}
            </p>
          ) : (
            <>
              <p
                style={{
                  fontFamily: serif,
                  fontWeight: 400,
                  fontSize: 'clamp(18px, 4.2vw, 22px)',
                  lineHeight: 1.32,
                  color: 'rgba(36,48,31,0.72)',
                  margin: 0,
                  marginTop: 28,
                  maxWidth: '22ch',
                }}
              >
                Fortæl hvad du ser.<br />Potalot hjælper dig med at gemme det rigtigt.
              </p>
              <button
                type="button"
                onClick={() => setFase('skriver')}
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(36,48,31,0.5)',
                  background: 'none',
                  border: 'none',
                  marginTop: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {harTale ? 'Skriv i stedet' : 'Skriv hvad der skete'}
              </button>
            </>
          )}
        </>
      )}

      {fase === 'skriver' && (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <textarea
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            rows={3}
            placeholder="Fx: De første agurker er kommet, og husk at så mere salat i næste uge."
            style={{
              width: '100%',
              fontFamily: serif,
              fontSize: 19,
              lineHeight: 1.4,
              color: '#24301F',
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(36,48,31,0.18)',
              borderRadius: 14,
              padding: 16,
              resize: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => void fortolk(tekst)}
            style={{
              marginTop: 14,
              padding: '12px 24px',
              borderRadius: 999,
              border: 'none',
              background: '#3B4A2F',
              color: '#F4EFDC',
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fortolk
          </button>
        </div>
      )}

      {fase === 'fortolker' && (
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: 'rgba(36,48,31,0.6)', margin: '20px 0' }}>
          Lytter efter, hvad du mener…
        </p>
      )}

      {fase === 'forslag' && (
        <div style={{ width: '100%', textAlign: 'left' }}>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(18px,4vw,22px)', color: 'rgba(36,48,31,0.7)', margin: '0 0 18px' }}>
            Skal jeg gemme det her?
          </p>
          <div className="space-y-3">
            {forslag.map(f => {
              const valgt = valgte.has(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: `1.5px solid ${valgt ? '#3B4A2F' : 'rgba(36,48,31,0.15)'}`,
                    background: valgt ? 'rgba(59,74,47,0.05)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      marginTop: 2,
                      border: `1.5px solid ${valgt ? '#3B4A2F' : 'rgba(36,48,31,0.3)'}`,
                      background: valgt ? '#3B4A2F' : 'transparent',
                      color: '#F4EFDC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                    }}
                  >
                    {valgt ? '✓' : ''}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(36,48,31,0.45)' }}>
                      {TYPE_LABEL[f.type]}
                      {f.plantNavn ? ` · ${f.plantNavn}` : ''}
                      {f.dato ? ` · ${f.dato}` : ''}
                    </span>
                    <span style={{ display: 'block', fontFamily: serif, fontSize: 'clamp(19px,4.4vw,24px)', fontWeight: 500, color: '#24301F', lineHeight: 1.2, marginTop: 3 }}>
                      {f.titel}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center" style={{ gap: 16, marginTop: 22 }}>
            <button
              type="button"
              onClick={() => void gem()}
              disabled={valgte.size === 0}
              style={{
                padding: '12px 26px',
                borderRadius: 999,
                border: 'none',
                background: valgte.size === 0 ? 'rgba(36,48,31,0.2)' : '#3B4A2F',
                color: '#F4EFDC',
                fontFamily: sans,
                fontSize: 14,
                fontWeight: 600,
                cursor: valgte.size === 0 ? 'default' : 'pointer',
              }}
            >
              Gem {valgte.size > 0 ? `(${valgte.size})` : ''}
            </button>
            <button
              type="button"
              onClick={nulstil}
              style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: 'rgba(36,48,31,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Fortryd
            </button>
          </div>
        </div>
      )}

      {(fase === 'gemmer' || fase === 'gemt' || fase === 'fejl') && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: serif, fontStyle: fase === 'fejl' ? 'normal' : 'italic', fontSize: 'clamp(20px,4.6vw,26px)', color: '#24301F', margin: '8px 0 0' }}>
            {fase === 'gemmer' ? 'Gemmer…' : resultat}
          </p>
          {fase !== 'gemmer' && (
            <button
              type="button"
              onClick={nulstil}
              style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: 'rgba(36,48,31,0.55)', background: 'none', border: 'none', marginTop: 16, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Fortæl mere
            </button>
          )}
        </div>
      )}
    </section>
  )
}
