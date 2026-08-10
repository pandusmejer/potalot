'use client'

/**
 * Gartnerens svar — delt streaming-forbruger for alle indgange (spec:
 * Docs/product/ai-gartner-integration.md).
 *
 * Låste principper: ingen ✨, ingen AI-brand, én identitet ("Gartneren",
 * plante-glyffen). Teksthandlinger — ikke knapper med ikoner. Svaret
 * streames asynkront; brugeren kan altid fortsætte imens.
 */

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { harAuthCookie } from '@/lib/auth-cookie'
import { resolveGuideLink } from '@/lib/gartner-guide-link'
import { createPlantLog } from '@/actions/mine-planter'
import { createTask } from '@/actions/havekalender'
import { saveGartnerSvar } from '@/actions/gartner-gemte'

const sans = 'var(--font-manrope)'

export interface GartnerKontekst {
  plantId?: string
  logId?: string
  guideId?: string
  /** 'problem' = konkret registreret problem (log). 'general' = generelt blik
   * — Gartneren opfinder ikke problemer, og "Markér som løst" tilbydes IKKE. */
  intent?: 'general' | 'problem'
}

type Tilstand = 'idle' | 'streamer' | 'faerdig' | 'login' | 'fejl'

/**
 * Svar-strukturen (Annas retning 5/8 + 10/8): scannbare sektions-labels.
 * Første label graduerer efter Gartnerens reelle sikkerhed ("Det ligner" /
 * "Mulige årsager" / "Jeg mangler lidt for at vurdere det") — prompten
 * forbyder skråsikre diagnoser. "Sandsynlig årsag" beholdes af hensyn til
 * gemte vurderinger fra før 10/8.
 */
const SEKTIONS_LABELS = new Set([
  'Sandsynlig årsag',
  'Det ligner',
  'Mulige årsager',
  'Jeg mangler lidt for at vurdere det',
  'Gør dette nu',
  'Hold øje med',
  'Relevant guide',
])

function sektionsLabel(tekst: string, foerste: boolean, key: React.Key): React.ReactNode {
  return (
    <span
      key={key}
      style={{
        display: 'block',
        fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: 'rgba(78,97,56,0.85)',
        marginTop: foerste ? 0 : 10, marginBottom: 2,
      }}
    >
      {tekst}
    </span>
  )
}

function formaterSvar(svar: string): React.ReactNode[] {
  const linjer = svar.split('\n')
  const noder: React.ReactNode[] = []
  for (let i = 0; i < linjer.length; i++) {
    const trimmet = linjer[i].trim()

    // "Relevant guide" renderes KUN når navnet på næste linje resolver mod en
    // faktisk Potalot-guide (Anna 10/8): AI'en må aldrig opfinde et guidenavn
    // eller et link. Uresolvet navn (eller midt i stream) → hele sektionen ud.
    if (trimmet === 'Relevant guide') {
      let j = i + 1
      while (j < linjer.length && !linjer[j].trim()) j++
      const navn = j < linjer.length ? linjer[j].trim() : ''
      const link = navn ? resolveGuideLink(navn) : null
      if (link) {
        noder.push(sektionsLabel('Relevant guide', noder.length === 0, i))
        noder.push(
          <Link
            key={`guide-${i}`}
            href={`/guides/${link.id}`}
            style={{
              display: 'inline-block',
              fontFamily: sans, fontWeight: 600, color: '#4E6138',
              textDecoration: 'underline', textUnderlineOffset: 3,
              textDecorationColor: 'rgba(78,97,56,0.35)',
            }}
          >
            {link.titel} →
          </Link>,
        )
      }
      i = j
      continue
    }

    if (SEKTIONS_LABELS.has(trimmet)) {
      noder.push(sektionsLabel(trimmet, i === 0, i))
      continue
    }
    noder.push(<span key={i}>{linjer[i] + '\n'}</span>)
  }
  return noder
}

/**
 * Delt visning af et Gartner-svar UDEN panel-krom — bruges hvor gemte svar
 * vises igen (Gemt fra Gartneren, Dine gemte noter). Samme formatering som
 * live-svaret: labels løftes, guide-linket resolves og forbliver klikbart.
 */
export function GartnerSvarTekst({ svar }: { svar: string }) {
  return (
    <div
      style={{
        fontFamily: sans, fontSize: 13.5, fontWeight: 450, lineHeight: 1.5,
        color: '#2E2A21', whiteSpace: 'pre-wrap',
      }}
    >
      {formaterSvar(svar)}
    </div>
  )
}

/** Selve svar-panelet + hook til at starte en vurdering. */
export function useGartner() {
  const [tilstand, setTilstand] = useState<Tilstand>('idle')
  const [svar, setSvar] = useState('')
  const kører = useRef(false)

  const spoerg = useCallback(async (question: string, kontekst?: GartnerKontekst) => {
    if (kører.current) return
    if (!harAuthCookie()) {
      setTilstand('login')
      return
    }
    kører.current = true
    setSvar('')
    setTilstand('streamer')
    try {
      const res = await fetch('/api/ai/gartner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, ...kontekst }),
      })
      if (res.status === 401) { setTilstand('login'); return }
      if (!res.ok || !res.body) { setTilstand('fejl'); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setSvar(prev => prev + decoder.decode(value, { stream: true }))
      }
      setTilstand('faerdig')
    } catch {
      setTilstand('fejl')
    } finally {
      kører.current = false
    }
  }, [])

  const nulstil = useCallback(() => { setTilstand('idle'); setSvar('') }, [])

  return { tilstand, svar, spoerg, nulstil }
}

/** Lokal dags-dato som YYYY-MM-DD (ikke UTC — 23:30 i DK er stadig i dag). */
function iDag(): string {
  return new Date().toLocaleDateString('sv-SE')
}

/** Første punkt under "Gør dette nu" → opgavetitel. Fallback: generisk. */
function foersteHandling(svar: string): string {
  const linjer = svar.split('\n')
  const start = linjer.findIndex(l => l.trim() === 'Gør dette nu')
  if (start >= 0) {
    for (const linje of linjer.slice(start + 1)) {
      const t = linje.trim()
      if (t.startsWith('-')) return t.replace(/^-\s*/, '').slice(0, 80)
      if (SEKTIONS_LABELS.has(t)) break
    }
  }
  return 'Følg op på Gartnerens råd'
}

type HandlingStatus = 'klar' | 'gemmer' | 'gjort' | 'fejl'

/**
 * "Gem til senere" (Annas design 10/8, spec: Docs/product/gem-fra-gartneren.md):
 * én diskret teksthandling — IKKE auto-gem af alle samtaler. Gemmer ALTID
 * spørgsmål + svar + kontekst sammen; findes igen under Guides → Gemt fra
 * Gartneren og som "Dine gemte noter" på den relevante guide.
 */
function GemTilSenere({
  question,
  svar,
  guideId,
  plantId,
  intent,
  fraLog = false,
}: {
  question?: string
  svar: string
  guideId?: string
  plantId?: string
  intent: 'general' | 'problem'
  /** Svaret hører til en konkret logpost — feedbacken peger på historikken. */
  fraLog?: boolean
}) {
  const [status, setStatus] = useState<HandlingStatus>('klar')
  const [bekraeftelse, setBekraeftelse] = useState('')

  // Uden eksplicit spørgsmål (auto-vurderinger fra log-flowet) gemmes en
  // læsbar overskrift — "Når hvad er klar?"-problemet må aldrig opstå.
  const effektivtSpoergsmaal =
    question?.trim() ||
    (intent === 'general' ? 'Generel vurdering af planten' : 'Vurdering af et registreret problem')

  if (status === 'gjort') {
    return (
      <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}>
        {bekraeftelse}
      </span>
    )
  }
  if (status === 'fejl') {
    return (
      <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(120,60,40,0.8)' }}>
        Kunne ikke gemme — prøv igen om lidt.
      </span>
    )
  }
  return (
    <button
      type="button"
      disabled={status === 'gemmer'}
      onClick={async () => {
        setStatus('gemmer')
        try {
          const res = await saveGartnerSvar({
            question: effektivtSpoergsmaal,
            answer: svar.trim(),
            guideId: guideId ?? null,
            plantId: plantId ?? null,
          })
          if ('error' in res) { setStatus('fejl'); return }
          // Gem-feedback skal ALTID fortælle, hvor svaret findes igen
          // (Annas regel 10/8): plante-svar bor på planten, guide-svar
          // under Guides → Gemt fra Gartneren.
          setBekraeftelse(
            res.sted === 'plante'
              ? fraLog
                ? '✓ Gemt på planten — du finder vurderingen igen i plantens historik og under Gemte råd.'
                : `✓ Gemt på planten — du finder svaret igen på ${res.planteNavn ? `${res.planteNavn}s` : 'plantens'} side under Gemte råd.`
              : '✓ Gemt — du finder svaret igen under Guides → Gemt fra Gartneren.',
          )
          setStatus('gjort')
        } catch {
          setStatus('fejl')
        }
      }}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: sans, fontSize: 12.5, fontWeight: 600,
        color: status === 'gemmer' ? 'rgba(78,97,56,0.5)' : '#4E6138',
        textDecoration: 'underline', textUnderlineOffset: 3,
        textDecorationColor: 'rgba(78,97,56,0.3)',
      }}
    >
      Gem til senere
    </button>
  )
}

/**
 * Cirkel-lukningen (Annas backlog-top 5/8): svaret fører direkte til
 * handling — log vurderingen, opret opgave, eller markér problemet løst.
 * Kun når vurderingen handler om en konkret plante. Teksthandlinger i
 * samme register som resten; ingen knap-krom.
 *
 * "Markér som løst" logger en note — ALDRIG en auto-trivsel (låst regel:
 * trivsel er brugerens egen vurdering).
 */
function EfterHandlinger({
  plantId,
  svar,
  intent = 'problem',
  ekstra,
}: {
  plantId: string
  svar: string
  intent?: 'general' | 'problem'
  /** Ekstra teksthandling(er) i samme række — fx "Gem til senere". */
  ekstra?: React.ReactNode
}) {
  const [log, setLog] = useState<HandlingStatus>('klar')
  const [opgave, setOpgave] = useState<HandlingStatus>('klar')
  const [loest, setLoest] = useState<HandlingStatus>('klar')

  async function koer(
    saet: (s: HandlingStatus) => void,
    fn: () => Promise<{ error?: string } | { id: string }>,
  ) {
    saet('gemmer')
    try {
      const res = await fn()
      saet('error' in res && res.error ? 'fejl' : 'gjort')
    } catch {
      saet('fejl')
    }
  }

  const alleHandlinger: {
    status: HandlingStatus
    label: string
    bekraeftelse: string
    kunProblem?: boolean
    onClick: () => void
  }[] = [
    {
      status: log,
      label: 'Log denne vurdering',
      bekraeftelse: 'Logget i plantens historik.',
      onClick: () =>
        koer(setLog, () =>
          createPlantLog({
            plantId,
            date: iDag(),
            type: 'note',
            title: 'Gartnerens vurdering',
            note: svar.trim(),
          }),
        ),
    },
    {
      status: opgave,
      label: 'Opret som opgave',
      bekraeftelse: 'Opgave oprettet i kalenderen.',
      onClick: () =>
        koer(setOpgave, () =>
          createTask({
            title: foersteHandling(svar),
            date: iDag(),
            linkedPlantId: plantId,
          }),
        ),
    },
    {
      status: loest,
      kunProblem: true,
      label: 'Markér problemet som løst',
      bekraeftelse: 'Markeret som løst i loggen.',
      onClick: () =>
        koer(setLoest, () =>
          createPlantLog({
            plantId,
            date: iDag(),
            type: 'note',
            title: 'Problemet er løst',
            note: 'Fulgte Gartnerens råd — problemet er løst.',
          }),
        ),
    },
  ]

  // General vurdering: intet registreret problem → "Markér som løst" ville
  // lade Gartneren diagnosticere sin egen diagnose. Kun log + opgave.
  const handlinger = alleHandlinger.filter(h => intent === 'problem' || !h.kunProblem)

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: '1px solid rgba(86, 111, 60, 0.16)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 14px',
      }}
    >
      {handlinger.map(h => (
        <span key={h.label}>
          {h.status === 'gjort' ? (
            <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}>
              {h.bekraeftelse}
            </span>
          ) : h.status === 'fejl' ? (
            <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(120,60,40,0.8)' }}>
              Kunne ikke gemme — prøv igen fra planten.
            </span>
          ) : (
            <button
              type="button"
              onClick={h.onClick}
              disabled={h.status === 'gemmer'}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: sans, fontSize: 12.5, fontWeight: 600,
                color: h.status === 'gemmer' ? 'rgba(78,97,56,0.5)' : '#4E6138',
                textDecoration: 'underline', textUnderlineOffset: 3,
                textDecorationColor: 'rgba(78,97,56,0.3)',
              }}
            >
              {h.label}
            </button>
          )}
        </span>
      ))}
      {ekstra}
    </div>
  )
}

/** Panelet der viser det streamede svar — rolig salvie-flade, ingen chat-UI. */
export function GartnerSvarPanel({
  tilstand,
  svar,
  plantId,
  intent = 'problem',
  question,
  guideId,
  fraLog = false,
}: {
  tilstand: Tilstand
  svar: string
  /** Sat → cirkel-lukningen vises efter svaret (log/opgave/løst). */
  plantId?: string
  intent?: 'general' | 'problem'
  /** Det stillede spørgsmål — gemmes SAMMEN med svaret ved "Gem til senere". */
  question?: string
  /** Guide-konteksten svaret blev stillet fra — binder det gemte til guiden. */
  guideId?: string
  /** Svaret hører til en konkret logpost — styrer gem-feedbackens copy. */
  fraLog?: boolean
}) {
  if (tilstand === 'idle') return null

  return (
    <div
      style={{
        background: 'rgba(232, 236, 218, 0.45)',
        border: '1px solid rgba(86, 111, 60, 0.22)',
        borderRadius: 18,
        padding: '14px 16px',
        marginTop: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async"
          src="/images/glyphs/plante.png"
          alt=""
          aria-hidden
          style={{ width: 'auto', height: 16, display: 'block' }}
        />
        <span
          style={{
            fontFamily: sans, fontSize: 10.5, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)',
          }}
        >
          Gartneren
        </span>
      </div>

      {tilstand === 'login' && (
        <p style={{ fontFamily: sans, fontSize: 13.5, lineHeight: 1.5, color: '#4A4438', margin: 0 }}>
          Gartneren hjælper dig, når du er logget ind — så kender den din have.{' '}
          <Link href="/opret" style={{ color: '#4E6138', fontWeight: 600 }}>Opret bruger</Link>
          {' '}eller{' '}
          <Link href="/login" style={{ color: '#4E6138', fontWeight: 600 }}>log ind</Link>.
        </p>
      )}

      {tilstand === 'fejl' && (
        <p style={{ fontFamily: sans, fontSize: 13.5, lineHeight: 1.5, color: '#4A4438', margin: 0 }}>
          Gartneren kunne ikke svare lige nu. Prøv igen om lidt.
        </p>
      )}

      {(tilstand === 'streamer' || tilstand === 'faerdig') && (
        <div
          style={{
            fontFamily: sans, fontSize: 14, fontWeight: 450, lineHeight: 1.55,
            color: '#2E2A21', whiteSpace: 'pre-wrap',
          }}
        >
          {formaterSvar(svar)}
          {tilstand === 'streamer' && (
            <span aria-hidden style={{ opacity: 0.45 }}>{svar ? ' ▍' : 'Gartneren kigger på det …'}</span>
          )}
        </div>
      )}

      {tilstand === 'faerdig' && svar.trim() && (
        plantId ? (
          <EfterHandlinger
            plantId={plantId}
            svar={svar}
            intent={intent}
            ekstra={
              <GemTilSenere
                question={question}
                svar={svar}
                guideId={guideId}
                plantId={plantId}
                intent={intent}
                fraLog={fraLog}
              />
            }
          />
        ) : (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid rgba(86, 111, 60, 0.16)',
            }}
          >
            <GemTilSenere question={question} svar={svar} guideId={guideId} intent={intent} />
          </div>
        )
      )}
    </div>
  )
}

/**
 * Gemt vurdering vist INDE i sin logpost (Annas model 8/8): child-indhold,
 * ikke en selvstændig hændelse — ingen egen prik/dato/redigér/slet.
 * Sammenfoldet som standard (CSS line-clamp, IKKE et separat AI-resumé —
 * præcis samme tekst, blot forkortet visuelt). Genåbning kalder aldrig AI.
 */
export function GartnerVurderingVisning({ svar }: { svar: string }) {
  const [udfoldet, setUdfoldet] = useState(false)
  return (
    <div
      style={{
        background: 'rgba(232, 236, 218, 0.45)',
        border: '1px solid rgba(86, 111, 60, 0.18)',
        borderRadius: 14,
        padding: '10px 12px',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async"
          src="/images/glyphs/plante.png" alt="" aria-hidden
          style={{ width: 'auto', height: 13, display: 'block' }}
        />
        <span
          style={{
            fontFamily: sans, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)',
          }}
        >
          Gartnerens vurdering
        </span>
      </div>

      {udfoldet ? (
        <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 450, lineHeight: 1.5, color: '#2E2A21', whiteSpace: 'pre-wrap' }}>
          {formaterSvar(svar)}
        </div>
      ) : (
        <p
          style={{
            fontFamily: sans, fontSize: 13.5, fontWeight: 450, lineHeight: 1.5,
            color: '#2E2A21', margin: 0, overflow: 'hidden',
            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
          }}
        >
          {svar.split('\n').filter(l => l.trim() && !SEKTIONS_LABELS.has(l.trim())).join(' ')}
        </p>
      )}

      <button
        type="button"
        onClick={() => setUdfoldet(u => !u)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          marginTop: 6, fontFamily: sans, fontSize: 12, fontWeight: 600,
          color: '#4E6138',
        }}
      >
        {udfoldet ? 'Skjul vurderingen ↑' : 'Vis hele vurderingen ↓'}
      </button>
    </div>
  )
}

/**
 * Teksthandling → vurdering. Samme ordlyd pr. flade (spec-tabellen):
 * "Få Gartnerens vurdering" (log), "Undersøg denne plante" (plante) osv.
 * Ren tekst i oliven — ingen ikoner, ingen knap-krom.
 */
export function GartnerHandling({
  label,
  question,
  kontekst,
  visGlyf = false,
  gemTitel,
}: {
  label: string
  question?: string
  kontekst?: GartnerKontekst
  /** Plante-glyffen foran labelen — til den generelle indgang ved statuskortet. */
  visGlyf?: boolean
  /** Overskrift til "Gem til senere" når intet spørgsmål stilles (fx logpostens
   * titel, "Lus på blade") — så det gemte kort aldrig er anonymt. */
  gemTitel?: string
}) {
  const { tilstand, svar, spoerg } = useGartner()

  return (
    <div>
      {tilstand === 'idle' && (
        <button
          type="button"
          onClick={() => spoerg(question ?? '', kontekst)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#4E6138',
          }}
        >
          {visGlyf && (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async"
              src="/images/glyphs/plante.png"
              alt=""
              aria-hidden
              style={{ width: 'auto', height: 15, display: 'block' }}
            />
          )}
          <span
            style={{
              textDecoration: 'underline', textUnderlineOffset: 3,
              textDecorationColor: 'rgba(78,97,56,0.35)',
            }}
          >
            {label}
          </span>
        </button>
      )}
      <GartnerSvarPanel
        tilstand={tilstand}
        svar={svar}
        plantId={kontekst?.plantId}
        intent={kontekst?.intent ?? 'problem'}
        question={question ?? gemTitel}
        guideId={kontekst?.guideId}
        fraLog={!!kontekst?.logId}
      />
    </div>
  )
}
