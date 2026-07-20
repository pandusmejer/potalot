'use client'

import { useEffect, useRef, useState } from 'react'
import { fortolkTale, hentSortsOrdliste } from '@/actions/tale'
import { gemOptagelse, behandlOptagelse, beholdSomNote } from '@/actions/optagelser'
import { createClient } from '@/lib/supabase/client'
import { DiktafonGuideArk } from '@/components/havebog/diktafon-guide-ark'
import type { TaleForslag, ForslagType } from '@/lib/tale-fortolk'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

type Fase = 'idle' | 'lytter' | 'transskriberer' | 'skriver' | 'fortolker' | 'forslag' | 'tomt' | 'gemmer' | 'gemt' | 'fejl'

/** Hård klient-cap på optagelseslængde (spec 2.4). */
const MAX_SEKUNDER = 120

const TYPE_LABEL: Record<ForslagType, string> = {
  observation: 'Observation',
  opgave: 'Opgave',
  hoest: 'Høst',
  problem: 'Problem',
  minde: 'Minde',
  naeste_saeson: 'Næste sæson',
  note: 'Note',
}

/** MediaRecorder + getUserMedia-support (ellers → tekst-fallback). */
function harOptager(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined'
  )
}

/** Vælg en container både MediaRecorder og OpenAI forstår (Safari→mp4). */
function vaelgMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const kandidater = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg']
  return kandidater.find(t => MediaRecorder.isTypeSupported(t))
}

/** Upload lyd til transcribe-Edge Function → dansk tekst. */
async function transskriber(
  blob: Blob,
  filnavn: string,
  prompt: string,
): Promise<{ text: string } | { error: string }> {
  const supabase = createClient()
  const fd = new FormData()
  fd.append('file', blob, filnavn)
  if (prompt) fd.append('prompt', prompt)
  const { data, error } = await supabase.functions.invoke('transcribe', { body: fd })
  if (error) return { error: 'Kunne ikke transskribere lige nu — prøv igen.' }
  const d = data as { text?: string; error?: { message?: string } } | null
  if (d?.error) return { error: d.error.message ?? 'Transskription mislykkedes.' }
  return { text: (d?.text ?? '').trim() }
}

/**
 * RUM 3 — "Tal til din have" som ÆGTE inputmotor.
 *
 * Optag (getUserMedia + MediaRecorder) → server-transskription (dansk, Edge
 * Function `transcribe`) → Claude foreslår 1-3 strukturerede ting → du
 * godkender → Potalot gemmer dem det rigtige sted (log/opgave). Ét-tryk-og-tal
 * virker overalt inkl. iOS Safari. "Skriv i stedet" er fallback, hvis
 * mikrofonen mangler eller afvises.
 */
export function TalOptager({ kontekst = 'havebog' }: { kontekst?: 'havebog' | 'hurtig' } = {}) {
  const hurtig = kontekst === 'hurtig'
  const [fase, setFase] = useState<Fase>('idle')
  const [tekst, setTekst] = useState('')
  const [forslag, setForslag] = useState<TaleForslag[]>([])
  const [valgte, setValgte] = useState<Set<string>>(new Set())
  const [resultat, setResultat] = useState<string>('')
  // Optagelsen persisteres (indbakke) og dens id bruges når den behandles.
  const [optagelseId, setOptagelseId] = useState<string | null>(null)
  const [sekunder, setSekunder] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const promptRef = useRef<string>('')
  const capTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // "Sådan virker det"-ark: vises FØRSTE gang man trykker mic, kan genåbnes.
  const [visGuide, setVisGuide] = useState(false)
  const [harSetGuide, setHarSetGuide] = useState(true) // default true → ingen "flash" for gengangere
  const [guideSkjult, setGuideSkjult] = useState(false) // "vis ikke igen" → skjul genvejen

  const kanOptage = harOptager()

  // Læs guide-tilstand fra localStorage (kun klient).
  useEffect(() => {
    try {
      setHarSetGuide(localStorage.getItem('potalot_diktafon_guide_set') === '1')
      setGuideSkjult(localStorage.getItem('potalot_diktafon_guide_skjult') === '1')
    } catch {
      setHarSetGuide(false) // localStorage utilgængelig → vis guiden
    }
  }, [])

  function markGuide(skjul: boolean) {
    try {
      localStorage.setItem('potalot_diktafon_guide_set', '1')
      if (skjul) localStorage.setItem('potalot_diktafon_guide_skjult', '1')
    } catch { /* ignorér */ }
    setHarSetGuide(true)
    if (skjul) setGuideSkjult(true)
  }

  // Mic-klik: første gang → vis "Sådan virker det"-arket; derefter optag direkte.
  function micKlik() {
    if (fase === 'lytter') { stopOptagelse(); return }
    if (!harSetGuide) { setVisGuide(true); return }
    void startOptagelse()
  }

  // Optager-timer (kun mens vi lytter).
  useEffect(() => {
    if (fase !== 'lytter') { setSekunder(0); return }
    const t = setInterval(() => setSekunder(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [fase])
  const mmss = `${String(Math.floor(sekunder / 60)).padStart(2, '0')}:${String(sekunder % 60).padStart(2, '0')}`

  // Ryd op ved unmount: stop cap-timer + slip mikrofonen hvis vi stadig optager.
  useEffect(() => {
    return () => {
      if (capTimerRef.current) clearTimeout(capTimerRef.current)
      const rec = recorderRef.current
      if (rec && rec.state !== 'inactive') rec.stop()
    }
  }, [])

  async function startOptagelse() {
    if (!kanOptage) {
      setFase('skriver')
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      // Mikrofon afvist eller ingen enhed → tekst-fallback.
      setResultat('Jeg kunne ikke få adgang til mikrofonen. Skriv i stedet, hvad der skete.')
      setFase('skriver')
      return
    }
    // Hent brugerens sortsordliste i baggrunden (biaser transskriptionen).
    promptRef.current = ''
    void hentSortsOrdliste().then(p => { promptRef.current = p }).catch(() => {})

    const mimeType = vaelgMimeType()
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorderRef.current = rec
    chunksRef.current = []
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop()) // slip mikrofonen
      const type = rec.mimeType || 'audio/webm'
      void efterOptagelse(new Blob(chunksRef.current, { type }), type)
    }
    setFase('lytter')
    rec.start()
    // Hård 120s-cap: stop automatisk.
    capTimerRef.current = setTimeout(stopOptagelse, MAX_SEKUNDER * 1000)
  }

  function stopOptagelse() {
    if (capTimerRef.current) {
      clearTimeout(capTimerRef.current)
      capTimerRef.current = null
    }
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
  }

  async function efterOptagelse(blob: Blob, type: string) {
    if (blob.size === 0) {
      setFase('idle')
      return
    }
    setFase('transskriberer')
    const ext = type.includes('mp4') ? 'mp4' : type.includes('mpeg') ? 'mp3' : 'webm'
    const res = await transskriber(blob, `optagelse.${ext}`, promptRef.current)
    if ('error' in res) {
      setResultat(res.error)
      setFase('fejl')
      return
    }
    if (!res.text) {
      // Ingen tale fanget (stilhed/støj) → lad brugeren skrive i stedet.
      setResultat('Jeg fangede ikke nogen tale. Skriv i stedet, hvad der skete.')
      setFase('skriver')
      return
    }
    await fortolk(res.text)
  }

  async function fortolk(t: string) {
    const trimmet = t.trim()
    if (!trimmet) {
      setFase('idle')
      return
    }
    setTekst(trimmet)
    setFase('fortolker')
    // Persistér optagelsen som det FØRSTE (indbakke): den findes i arkivet
    // som 'unprocessed' uanset udfald → teksten er reddet, selv hvis
    // fortolkningen fejler. Genbrug id'et ved gen-fortolkning (undgå dubletter).
    let id = optagelseId
    if (!id) {
      const gem = await gemOptagelse(trimmet)
      if ('id' in gem) {
        id = gem.id
        setOptagelseId(gem.id)
      }
    }
    const res = await fortolkTale(trimmet)
    if ('error' in res) {
      // Ægte net-/API-fejl → "prøv igen". Malformet model (INTERPRETATION_INVALID)
      // behandles som tomt: teksten bevares, brugeren kan rette eller gemme som note.
      if (res.code === 'STT_INTERPRET_FAILED') {
        setResultat(res.error)
        setFase('fejl')
        return
      }
      setFase('tomt')
      return
    }
    if (res.forslag.length === 0) {
      setFase('tomt')
      return
    }
    setForslag(res.forslag)
    setValgte(new Set(res.forslag.map(f => f.id)))
    setFase('forslag')
  }

  // "Gem som note" (tom fortolkning / malformet svar): behold teksten i
  // arkivet uden log/opgave. Teksten er allerede gemt — intet går tabt.
  async function gemSomNote() {
    if (!optagelseId) {
      nulstil()
      return
    }
    setFase('gemmer')
    const res = await beholdSomNote(optagelseId)
    if ('error' in res) {
      setResultat(res.error)
      setFase('fejl')
      return
    }
    setResultat('Gemt i dit optagelses-arkiv.')
    setFase('gemt')
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
        {hurtig ? 'Fang' : 'Fortæl om'}
        <br />
        {hurtig ? 'en tanke' : 'din have'}
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
              onClick={micKlik}
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
                  fontSize: 'clamp(18px, 4.2cqw, 22px)',
                  lineHeight: 1.32,
                  color: 'rgba(36,48,31,0.72)',
                  margin: 0,
                  marginTop: 28,
                  maxWidth: '22ch',
                }}
              >
                {hurtig
                  ? <>En hurtig note til haven.<br />Potalot organiserer resten.</>
                  : <>Fortæl frit om din have.<br />Potalot organiserer resten.</>}
              </p>
              {!guideSkjult && (
                <button
                  type="button"
                  onClick={() => setVisGuide(true)}
                  style={{
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3B4A2F',
                    background: 'none',
                    border: 'none',
                    marginTop: 14,
                    cursor: 'pointer',
                  }}
                >
                  Sådan virker det →
                </button>
              )}
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
                  marginTop: guideSkjult ? 14 : 8,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {kanOptage ? 'Skriv i stedet' : 'Skriv hvad der skete'}
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

      {fase === 'transskriberer' && (
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: 'rgba(36,48,31,0.6)', margin: '20px 0' }}>
          Skriver din tale ned…
        </p>
      )}

      {fase === 'fortolker' && (
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: 'rgba(36,48,31,0.6)', margin: '20px 0' }}>
          Lytter efter, hvad du mener…
        </p>
      )}

      {fase === 'forslag' && (
        <div style={{ width: '100%', textAlign: 'left' }}>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(18px,4cqw,22px)', color: 'rgba(36,48,31,0.7)', margin: '0 0 18px' }}>
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
                    <span style={{ display: 'block', fontFamily: serif, fontSize: 'clamp(19px,4.4cqw,24px)', fontWeight: 500, color: '#24301F', lineHeight: 1.2, marginTop: 3 }}>
                      {f.text}
                    </span>
                    {f.evidence.sourceText && f.evidence.sourceText !== f.text && (
                      <span style={{ display: 'block', fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: 'rgba(36,48,31,0.5)', lineHeight: 1.35, marginTop: 6 }}>
                        Du sagde: «{f.evidence.sourceText}»
                      </span>
                    )}
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

      {fase === 'tomt' && (
        <div style={{ width: '100%', textAlign: 'left' }}>
          <p style={{ fontFamily: serif, fontSize: 'clamp(20px,4.6cqw,26px)', color: '#24301F', margin: '0 0 8px', lineHeight: 1.2 }}>
            Jeg kunne ikke dele noten op
          </p>
          <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(36,48,31,0.6)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Teksten er stadig her. Du kan rette den eller gemme den som en almindelig note.
          </p>
          {tekst && (
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18, color: 'rgba(36,48,31,0.8)', lineHeight: 1.4, margin: '0 0 20px', padding: '12px 16px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(36,48,31,0.14)', borderRadius: 12 }}>
              «{tekst}»
            </p>
          )}
          <div className="flex items-center" style={{ gap: 16, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFase('skriver')}
              style={{ padding: '12px 24px', borderRadius: 999, border: 'none', background: '#3B4A2F', color: '#F4EFDC', fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Ret teksten
            </button>
            <button
              type="button"
              onClick={() => void gemSomNote()}
              style={{ padding: '12px 22px', borderRadius: 999, border: '1.5px solid rgba(36,48,31,0.25)', background: 'transparent', color: '#24301F', fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Gem som note
            </button>
            <button
              type="button"
              onClick={nulstil}
              style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: 'rgba(36,48,31,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Annuller
            </button>
          </div>
        </div>
      )}

      {(fase === 'gemmer' || fase === 'gemt' || fase === 'fejl') && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: serif, fontStyle: fase === 'fejl' ? 'normal' : 'italic', fontSize: 'clamp(20px,4.6cqw,26px)', color: '#24301F', margin: '8px 0 0' }}>
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

      <DiktafonGuideArk
        open={visGuide}
        startVisning={hurtig ? 'kompakt' : 'fuld'}
        onClose={skjul => { setVisGuide(false); markGuide(skjul) }}
        onBegin={skjul => { setVisGuide(false); markGuide(skjul); void startOptagelse() }}
      />
    </section>
  )
}
