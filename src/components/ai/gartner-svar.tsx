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

const sans = 'var(--font-manrope)'

export interface GartnerKontekst {
  plantId?: string
  logId?: string
  guideId?: string
}

type Tilstand = 'idle' | 'streamer' | 'faerdig' | 'login' | 'fejl'

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

/** Panelet der viser det streamede svar — rolig salvie-flade, ingen chat-UI. */
export function GartnerSvarPanel({
  tilstand,
  svar,
}: {
  tilstand: Tilstand
  svar: string
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
        <p
          style={{
            fontFamily: sans, fontSize: 14, fontWeight: 450, lineHeight: 1.55,
            color: '#2E2A21', margin: 0, whiteSpace: 'pre-wrap',
          }}
        >
          {svar}
          {tilstand === 'streamer' && (
            <span aria-hidden style={{ opacity: 0.45 }}>{svar ? ' ▍' : 'Gartneren kigger på det …'}</span>
          )}
        </p>
      )}
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
}: {
  label: string
  question?: string
  kontekst?: GartnerKontekst
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
            fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#4E6138',
            textDecoration: 'underline', textUnderlineOffset: 3,
            textDecorationColor: 'rgba(78,97,56,0.35)',
          }}
        >
          {label}
        </button>
      )}
      <GartnerSvarPanel tilstand={tilstand} svar={svar} />
    </div>
  )
}
