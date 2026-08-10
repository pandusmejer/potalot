'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GartnerSvarTekst } from '@/components/ai/gartner-svar'
import { deleteGartnerGemt, type GartnerGemt } from '@/actions/gartner-gemte'

const sans = 'var(--font-manrope)'

/**
 * Ét gemt Gartner-svar (spec: Docs/product/gem-fra-gartneren.md). Vises altid
 * som spørgsmål + kontekst + dato med svaret foldet ind under — aldrig kun
 * svaret. Registeret er bevidst NEDTONET og personligt (Gartner-salvie, små
 * teksthandlinger): et gemt AI-svar må aldrig få samme visuelle autoritet
 * som det redaktionelle guide-indhold.
 */
export function GemtNoteItem({
  note,
  visGuideLink = false,
  onFjernet,
}: {
  note: GartnerGemt
  /** Vis kontekst-linket til guiden (listen under Guides) — på selve guiden
   * er konteksten givet og linket udelades. */
  visGuideLink?: boolean
  onFjernet?: (id: string) => void
}) {
  const [udfoldet, setUdfoldet] = useState(false)
  const [fjerner, setFjerner] = useState<'klar' | 'bekraeft' | 'i-gang'>('klar')

  const dato = new Date(note.createdAt).toLocaleDateString('da-DK', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  async function fjern() {
    setFjerner('i-gang')
    const res = await deleteGartnerGemt(note.id).catch(() => ({ error: 'fejl' }))
    if ('error' in res) { setFjerner('klar'); return }
    onFjernet?.(note.id)
  }

  return (
    <div
      style={{
        background: 'rgba(232, 236, 218, 0.45)',
        border: '1px solid rgba(86, 111, 60, 0.18)',
        borderRadius: 14,
        padding: '11px 13px',
      }}
    >
      <button
        type="button"
        onClick={() => setUdfoldet(u => !u)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'block', width: '100%', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 650, lineHeight: 1.4, color: '#24301F', display: 'block' }}>
          {note.question}
        </span>
        <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 500, color: 'rgba(36,48,31,0.5)', display: 'block', marginTop: 3 }}>
          {note.guideTitel ? `${note.guideTitel} · ` : ''}{dato}
        </span>
      </button>

      {udfoldet && (
        <div style={{ marginTop: 8 }}>
          <GartnerSvarTekst svar={note.answer} />
          <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'center' }}>
            {visGuideLink && note.guideId && (
              <Link
                href={`/guides/${note.guideId}`}
                style={{
                  fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#4E6138',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                  textDecorationColor: 'rgba(78,97,56,0.3)',
                }}
              >
                Åbn guiden →
              </Link>
            )}
            {fjerner === 'bekraeft' ? (
              <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: 'rgba(36,48,31,0.6)' }}>
                Fjern den gemte note?{' '}
                <button
                  type="button"
                  onClick={fjern}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#8A4B38' }}
                >
                  Ja, fjern
                </button>
                {' · '}
                <button
                  type="button"
                  onClick={() => setFjerner('klar')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#4E6138' }}
                >
                  Behold
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={fjerner === 'i-gang'}
                onClick={() => setFjerner('bekraeft')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: sans, fontSize: 12, fontWeight: 600,
                  color: fjerner === 'i-gang' ? 'rgba(36,48,31,0.35)' : 'rgba(36,48,31,0.5)',
                }}
              >
                {fjerner === 'i-gang' ? 'Fjerner…' : 'Fjern'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
