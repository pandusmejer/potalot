import { Wheat, Sprout, Leaf, Apple, Droplets, Sun, ChevronRight } from 'lucide-react'
import type { ComponentType, SVGProps, ReactNode } from 'react'
import { POTALOT_GLYPHS } from '@/components/icons/potalot-glyphs'

/**
 * QA-rute: Potalot Soft Glyphs — pilot (6 kerneformer).
 * Viser de seks i flere størrelser, i kontekst, og side om side med
 * deres nærmeste Lucide-ækvivalent (do/don't). Se ikon-system.md.
 */
export const dynamic = 'force-dynamic'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const INK = '#2F4F3A'

const SIZES = [16, 20, 24, 32, 48]

/** Nærmeste Lucide-ækvivalent pr. glyph (til sammenligning). */
const LUCIDE: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  froe: Wheat,
  spire: Sprout,
  blad: Leaf,
  tomat: Apple,
  vand: Droplets,
  sol: Sun,
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ background: '#FAFBF3', border: '1px solid rgba(36,48,31,0.08)', borderRadius: 20, padding: 22 }}>
      <h2 className="uppercase" style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.5)', margin: '0 0 16px' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function GlyphQAPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12" style={{ fontFamily: sans }}>
      {/* Header */}
      <header style={{ paddingTop: 4 }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.45)', margin: 0 }}>
          QA · Ikonsystem
        </p>
        <h1 style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(32px,8vw,46px)', lineHeight: 1, letterSpacing: '-0.01em', color: INK, margin: '8px 0 0' }}>
          Potalot Soft Glyphs
        </h1>
        <p style={{ fontFamily: sans, fontSize: 15, color: 'rgba(36,48,31,0.6)', margin: '10px 0 0', maxWidth: '52ch' }}>
          Pilot — seks kerneformer. Holder formsproget i appen, før vi tegner resten?
        </p>
      </header>

      {/* 1. Størrelser */}
      <Card title="Størrelser · 16 / 20 / 24 / 32 / 48 px">
        <div className="space-y-5">
          {POTALOT_GLYPHS.map(({ key, label, form, Comp }) => (
            <div key={key} className="flex items-center gap-5" style={{ borderTop: '1px solid rgba(36,48,31,0.06)', paddingTop: 16 }}>
              <div style={{ width: 130, flexShrink: 0 }}>
                <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: INK, margin: 0 }}>{label}</p>
                <p style={{ fontFamily: sans, fontSize: 11.5, color: 'rgba(36,48,31,0.5)', margin: '2px 0 0' }}>{form}</p>
              </div>
              <div className="flex flex-1 items-end" style={{ gap: 22 }}>
                {SIZES.map((s) => (
                  <div key={s} className="flex flex-col items-center" style={{ gap: 6 }}>
                    <Comp size={s} title={label} />
                    <span style={{ fontFamily: sans, fontSize: 10, color: 'rgba(36,48,31,0.4)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2a. Opgave-liste */}
      <Card title="I kontekst · opgave-liste">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {[
            { g: 'froe', t: 'Så tomatfrø', s: 'Køkkenhaven' },
            { g: 'vand', t: 'Vand drivhuset', s: 'I dag' },
            { g: 'sol', t: 'Tjek sollys på altanen', s: 'Denne uge' },
          ].map((row, i) => {
            const G = POTALOT_GLYPHS.find((x) => x.key === row.g)!.Comp
            return (
              <li key={i} className="flex items-center gap-3" style={{ borderTop: i ? '1px solid rgba(36,48,31,0.07)' : 'none', padding: '13px 2px' }}>
                <span className="flex shrink-0 items-center justify-center" style={{ width: 38, height: 38, borderRadius: 12, background: '#EEF1E4' }}>
                  <G size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span style={{ display: 'block', fontFamily: sans, fontSize: 15, fontWeight: 600, color: INK }}>{row.t}</span>
                  <span style={{ display: 'block', fontFamily: sans, fontSize: 12.5, color: 'rgba(36,48,31,0.5)' }}>{row.s}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'rgba(36,48,31,0.35)' }} />
              </li>
            )
          })}
        </ul>
      </Card>

      {/* 2b. Kategori-chips */}
      <Card title="I kontekst · kategori-chips">
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          {POTALOT_GLYPHS.map(({ key, label, Comp }) => (
            <span key={key} className="inline-flex items-center gap-2" style={{ background: '#EEF1E4', borderRadius: 999, padding: '8px 14px 8px 10px' }}>
              <Comp size={18} />
              <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: INK }}>{label}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* 2c. Tomt-state kort */}
      <Card title="I kontekst · tomt-state">
        <div className="flex flex-col items-center text-center" style={{ background: '#F4F6EC', borderRadius: 16, border: '1px dashed rgba(36,48,31,0.15)', padding: '32px 20px' }}>
          <GlyphSpireBig />
          <p style={{ fontFamily: serif, fontWeight: 600, fontSize: 24, color: INK, margin: '14px 0 0' }}>Ingen planter endnu</p>
          <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(36,48,31,0.55)', margin: '6px 0 0', maxWidth: '34ch' }}>
            Sæt dit første frø, så følger Potalot rejsen med dig.
          </p>
        </div>
      </Card>

      {/* 3. Side om side med Lucide + Do/Don't */}
      <Card title="Do / Don't · Potalot Soft Glyph vs. Lucide">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* kolonne-headere */}
          <div style={{ padding: '0 0 12px', borderBottom: '1px solid rgba(36,48,31,0.1)' }}>
            <span className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: '#5E7D4F' }}>✓ Potalot Soft Glyph</span>
          </div>
          <div style={{ padding: '0 0 12px 18px', borderBottom: '1px solid rgba(36,48,31,0.1)', borderLeft: '1px solid rgba(36,48,31,0.08)' }}>
            <span className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(36,48,31,0.4)' }}>Lucide (generisk)</span>
          </div>

          {POTALOT_GLYPHS.map(({ key, label, Comp }) => {
            const L = LUCIDE[key]
            return (
              <FragmentRow key={key}>
                <div className="flex items-center gap-3" style={{ padding: '14px 0', borderTop: '1px solid rgba(36,48,31,0.06)' }}>
                  <Comp size={28} title={label} />
                  <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: INK }}>{label}</span>
                </div>
                <div className="flex items-center gap-3" style={{ padding: '14px 0 14px 18px', borderTop: '1px solid rgba(36,48,31,0.06)', borderLeft: '1px solid rgba(36,48,31,0.08)' }}>
                  <L width={28} height={28} strokeWidth={1.75} style={{ color: 'rgba(36,48,31,0.55)' }} />
                  <span style={{ fontFamily: sans, fontSize: 13, color: 'rgba(36,48,31,0.45)' }}>{L.displayName ?? 'Lucide'}</span>
                </div>
              </FragmentRow>
            )
          })}
        </div>
        <p style={{ fontFamily: sans, fontSize: 12.5, color: 'rgba(36,48,31,0.5)', margin: '16px 0 0', lineHeight: 1.5 }}>
          Soft Glyphs = fyldte, varme, botaniske. Lucide = tynd, neutral, teknisk. Forskellen skal være tydelig, men de skal stadig kunne stå i samme app.
        </p>
      </Card>
    </div>
  )
}

/** Lille hjælper: to grid-celler pr. række. */
function FragmentRow({ children }: { children: ReactNode }) {
  return <>{children}</>
}

/** Stor spire til tomt-state (48 px). */
function GlyphSpireBig() {
  const G = POTALOT_GLYPHS.find((x) => x.key === 'spire')!.Comp
  return (
    <span className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 20, background: '#EAEFDF' }}>
      <G size={44} />
    </span>
  )
}
