'use client'

import { useState } from 'react'
import { fortolkTale } from '@/actions/tale'
import { OptagelseStatusIkon } from '@/components/havebog/optagelse-status-ikon'
import { behandlOptagelse, type OptagelseRow } from '@/actions/optagelser'
import type { OptagelseStatus } from '@/data/havebog-demo'
import type { TaleForslag } from '@/lib/tale-fortolk'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const STATUS_LABEL: Record<OptagelseStatus, string> = {
  unprocessed: 'Ikke behandlet',
  log: 'Føjet til log',
  opgave: 'Opgave oprettet',
  minde: 'Minde gemt',
  observation: 'Observation gemt',
}

type Filter = 'alle' | 'unprocessed' | 'logs' | 'opgaver' | 'minder'
const FILTRE: { id: Filter; navn: string; match: (s: OptagelseStatus) => boolean }[] = [
  { id: 'alle', navn: 'Alle', match: () => true },
  { id: 'unprocessed', navn: 'Ikke behandlet', match: s => s === 'unprocessed' },
  { id: 'logs', navn: 'Logs', match: s => s === 'log' || s === 'observation' },
  { id: 'opgaver', navn: 'Opgaver', match: s => s === 'opgave' },
  { id: 'minder', navn: 'Minder', match: s => s === 'minde' },
]

/** "9. juli, 08.14" — menneskelig tid (recorded_at). */
function menneskeTid(iso: string): string {
  const d = new Date(iso)
  const nu = new Date()
  const dage = Math.round(
    (new Date(nu.getFullYear(), nu.getMonth(), nu.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000,
  )
  const kl = `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
  const MAANED = ['jan.', 'feb.', 'marts', 'apr.', 'maj', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.']
  const dag = dage === 0 ? 'I dag' : dage === 1 ? 'I går' : `${d.getDate()}. ${MAANED[d.getMonth()]}`
  return `${dag}, ${kl}`
}

export function OptagelserArkiv({ optagelser }: { optagelser: OptagelseRow[] }) {
  const [filter, setFilter] = useState<Filter>('alle')
  const [rows, setRows] = useState(optagelser)
  // Inline behandl-flow pr. optagelse.
  const [aabenId, setAabenId] = useState<string | null>(null)
  const [forslag, setForslag] = useState<TaleForslag[]>([])
  const [valgte, setValgte] = useState<Set<string>>(new Set())
  const [travl, setTravl] = useState(false)

  const aktivFilter = FILTRE.find(f => f.id === filter)!
  const synlige = rows.filter(r => aktivFilter.match(r.status))

  async function behandl(row: OptagelseRow) {
    setAabenId(row.id)
    setForslag([])
    setValgte(new Set())
    setTravl(true)
    const res = await fortolkTale(row.text)
    setTravl(false)
    if ('error' in res || res.forslag.length === 0) return
    setForslag(res.forslag)
    setValgte(new Set(res.forslag.map(f => f.id)))
  }

  async function gem(row: OptagelseRow) {
    const valgteForslag = forslag.filter(f => valgte.has(f.id))
    if (valgteForslag.length === 0) return
    setTravl(true)
    const res = await behandlOptagelse(row.id, valgteForslag)
    setTravl(false)
    if ('error' in res) return
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, status: res.status } : r)))
    setAabenId(null)
  }

  return (
    <div>
      {/* Filter-tabs */}
      <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 24 }}>
        {FILTRE.map(f => {
          const aktiv = f.id === filter
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 999,
                border: `1px solid ${aktiv ? '#3B4A2F' : 'rgba(36,48,31,0.18)'}`,
                background: aktiv ? '#3B4A2F' : 'transparent',
                color: aktiv ? '#F4EFDC' : 'rgba(36,48,31,0.62)',
                cursor: 'pointer',
              }}
            >
              {f.navn}
            </button>
          )
        })}
      </div>

      {synlige.length === 0 && (
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 20, color: 'rgba(36,48,31,0.5)', margin: '24px 0' }}>
          Ingen optagelser her endnu.
        </p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="divide-y divide-border/50">
        {synlige.map(row => (
          <li key={row.id} style={{ paddingBlock: 16 }}>
            <div className="flex items-start" style={{ gap: 12 }}>
              <span aria-hidden style={{ flexShrink: 0, marginTop: 3 }}>
                <OptagelseStatusIkon status={row.status} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: '#24301F', lineHeight: 1.35, margin: 0 }}>
                  {row.text}
                </p>
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: 'rgba(36,48,31,0.45)' }}>
                    {menneskeTid(row.recordedAt)}
                  </span>
                  {row.seasonNumber && row.seasonDay && (
                    <span style={{ fontFamily: sans, fontSize: 11.5, color: 'rgba(36,48,31,0.4)' }}>
                      · Sæson {row.seasonNumber} · DAG {String(row.seasonDay).padStart(3, '0')}
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: sans,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: row.status === 'unprocessed' ? 'rgba(36,48,31,0.4)' : '#5F6B47',
                      background: row.status === 'unprocessed' ? 'rgba(36,48,31,0.06)' : 'rgba(106,117,84,0.12)',
                      padding: '1px 8px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </div>

                {/* Behandl: gør optagelsen aktiv */}
                {row.status === 'unprocessed' && aabenId !== row.id && (
                  <button
                    type="button"
                    onClick={() => void behandl(row)}
                    style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: '#3B4A2F', background: 'none', border: 'none', marginTop: 10, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Behandl
                  </button>
                )}

                {aabenId === row.id && (
                  <div style={{ marginTop: 12 }}>
                    {travl && forslag.length === 0 && (
                      <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: 'rgba(36,48,31,0.55)', margin: 0 }}>Lytter efter, hvad du mener…</p>
                    )}
                    {forslag.map(f => {
                      const valgt = valgte.has(f.id)
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setValgte(prev => { const n = new Set(prev); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n })}
                          style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 12, marginBottom: 8, border: `1.5px solid ${valgt ? '#3B4A2F' : 'rgba(36,48,31,0.15)'}`, background: valgt ? 'rgba(59,74,47,0.05)' : 'transparent', cursor: 'pointer' }}
                        >
                          <span aria-hidden style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 5, marginTop: 1, border: `1.5px solid ${valgt ? '#3B4A2F' : 'rgba(36,48,31,0.3)'}`, background: valgt ? '#3B4A2F' : 'transparent', color: '#F4EFDC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                            {valgt ? '✓' : ''}
                          </span>
                          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#24301F' }}>{f.titel}</span>
                        </button>
                      )
                    })}
                    {forslag.length > 0 && (
                      <div className="flex items-center" style={{ gap: 14, marginTop: 4 }}>
                        <button type="button" disabled={travl || valgte.size === 0} onClick={() => void gem(row)} style={{ padding: '9px 20px', borderRadius: 999, border: 'none', background: valgte.size === 0 ? 'rgba(36,48,31,0.2)' : '#3B4A2F', color: '#F4EFDC', fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: valgte.size === 0 ? 'default' : 'pointer' }}>
                          Gem {valgte.size > 0 ? `(${valgte.size})` : ''}
                        </button>
                        <button type="button" onClick={() => setAabenId(null)} style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>Luk</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
