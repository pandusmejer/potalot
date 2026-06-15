import { Wheat, Sprout, Leaf, Apple, Droplets, Sun, ChevronRight, Flower2, Carrot, Bug, ShoppingBasket, Scissors, Shovel, CloudRain, Snowflake, Wind } from 'lucide-react'
import type { ComponentType, SVGProps, ReactNode } from 'react'
import { POTALOT_GLYPHS, POTALOT_GLYPHS_2, POTALOT_GLYPHS_3 } from '@/components/icons/potalot-glyphs'

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

/** Batch 2 — kun de fire der HAR en meningsfuld Lucide-ækvivalent. */
const LUCIDE2: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  blomst: Flower2,
  gulerod: Carrot,
  bille: Bug,
  hoestkurv: ShoppingBasket,
}
/** Batch 2 uden Lucide-ækvivalent — netop derfor custom. */
const UDEN_LUCIDE = ['Ært', 'Løg', 'Drivhus', 'Snegl']

/** Batch 3 — Lucide-ækvivalenter hvor de findes. */
const LUCIDE3: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  saks: Scissors,
  skovl: Shovel,
  regn: CloudRain,
  frost: Snowflake,
  vind: Wind,
}
const UDEN_LUCIDE3 = ['Jord', 'Kompost', 'Krukke', 'Højbed', 'Rive']

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
          Pilot v2 — seks kerneformer, 10–15 % tungere optisk. Robust spire, mere karakterfuldt blad, organiske sol-stråler, roligere tomat-top.
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

      {/* ════════════ BATCH 2 ════════════ */}
      <div style={{ paddingTop: 18 }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.45)', margin: 0 }}>
          Batch 2 · søskende til v2
        </p>
        <h2 style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(26px,6.5vw,36px)', lineHeight: 1.02, color: INK, margin: '6px 0 0' }}>
          Blomst · Ært · Gulerod · Løg · Drivhus · Snegl · Bille · Høstkurv
        </h2>
        <p style={{ fontFamily: sans, fontSize: 14.5, color: 'rgba(36,48,31,0.6)', margin: '8px 0 0', maxWidth: '54ch' }}>
          Samme vægt og formsprog som v2 — ingen ny stilretning. Tester organisk symmetri, afgrøder, struktur, skadedyr/nyttedyr og objekt-kategorien.
        </p>
      </div>

      {/* B1. Størrelser */}
      <Card title="Batch 2 · størrelser · 16 / 20 / 24 / 32 / 48 px">
        <div className="space-y-5">
          {POTALOT_GLYPHS_2.map(({ key, label, form, Comp }) => (
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

      {/* B2. Kategori-chips */}
      <Card title="Batch 2 · kategori-chips">
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          {POTALOT_GLYPHS_2.map(({ key, label, Comp }) => (
            <span key={key} className="inline-flex items-center gap-2" style={{ background: '#EEF1E4', borderRadius: 999, padding: '8px 14px 8px 10px' }}>
              <Comp size={18} />
              <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: INK }}>{label}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* B3. Opgave-liste */}
      <Card title="Batch 2 · opgave-liste">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {[
            { g: 'gulerod', t: 'Tynd ud i gulerødderne', s: 'Køkkenhaven' },
            { g: 'snegl', t: 'Tjek for snegle efter regn', s: 'Drivhuset' },
            { g: 'hoestkurv', t: 'Høst ærterne', s: 'Denne uge' },
          ].map((row, i) => {
            const G = POTALOT_GLYPHS_2.find((x) => x.key === row.g)!.Comp
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

      {/* B4. Tomt-state */}
      <Card title="Batch 2 · tomt-state">
        <div className="flex flex-col items-center text-center" style={{ background: '#F4F6EC', borderRadius: 16, border: '1px dashed rgba(36,48,31,0.15)', padding: '32px 20px' }}>
          {(() => {
            const G = POTALOT_GLYPHS_2.find((x) => x.key === 'hoestkurv')!.Comp
            return (
              <span className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 20, background: '#EAEFDF' }}>
                <G size={44} />
              </span>
            )
          })()}
          <p style={{ fontFamily: serif, fontWeight: 600, fontSize: 24, color: INK, margin: '14px 0 0' }}>Endnu intet høstet</p>
          <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(36,48,31,0.55)', margin: '6px 0 0', maxWidth: '34ch' }}>
            Når sæsonen modnes, samler vi din høst her.
          </p>
        </div>
      </Card>

      {/* B5. Do/Don't — kun hvor en Lucide-ækvivalent giver mening */}
      <Card title="Batch 2 · do / don't (hvor Lucide har en ækvivalent)">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <div style={{ padding: '0 0 12px', borderBottom: '1px solid rgba(36,48,31,0.1)' }}>
            <span className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: '#5E7D4F' }}>✓ Potalot Soft Glyph</span>
          </div>
          <div style={{ padding: '0 0 12px 18px', borderBottom: '1px solid rgba(36,48,31,0.1)', borderLeft: '1px solid rgba(36,48,31,0.08)' }}>
            <span className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(36,48,31,0.4)' }}>Lucide (generisk)</span>
          </div>
          {POTALOT_GLYPHS_2.filter((g) => LUCIDE2[g.key]).map(({ key, label, Comp }) => {
            const L = LUCIDE2[key]
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
          {UDEN_LUCIDE.join(' · ')} har ingen meningsfuld Lucide-ækvivalent — netop derfor er de custom Soft Glyphs.
        </p>
      </Card>

      {/* ════════════ BATCH 3 ════════════ */}
      <div style={{ paddingTop: 18 }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.45)', margin: 0 }}>
          Batch 3 · funktionelle havebegreber
        </p>
        <h2 style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(26px,6.5vw,36px)', lineHeight: 1.02, color: INK, margin: '6px 0 0' }}>
          Jord · Kompost · Krukke · Højbed · Saks · Rive · Skovl · Regn · Frost · Vind
        </h2>
        <p style={{ fontFamily: sans, fontSize: 14.5, color: 'rgba(36,48,31,0.6)', margin: '8px 0 0', maxWidth: '54ch' }}>
          Samme vægt og formsprog. Tester dyrkningsmiljøer, redskaber og vejr/risiko-markører — kan systemet bære funktionelle begreber, ikke kun botanik.
        </p>
      </div>

      {/* C1. Størrelser */}
      <Card title="Batch 3 · størrelser · 16 / 20 / 24 / 32 / 48 px">
        <div className="space-y-5">
          {POTALOT_GLYPHS_3.map(({ key, label, form, Comp }) => (
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

      {/* C2. Kategori-chips */}
      <Card title="Batch 3 · kategori-chips">
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          {POTALOT_GLYPHS_3.map(({ key, label, Comp }) => (
            <span key={key} className="inline-flex items-center gap-2" style={{ background: '#EEF1E4', borderRadius: 999, padding: '8px 14px 8px 10px' }}>
              <Comp size={18} />
              <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: INK }}>{label}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* C3. Opgave-liste */}
      <Card title="Batch 3 · opgave-liste">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {[
            { g: 'saks', t: 'Beskær tomaterne', s: 'Drivhuset' },
            { g: 'frost', t: 'Nattefrost på vej', s: 'Dæk de sarte til' },
            { g: 'kompost', t: 'Vend komposten', s: 'Denne uge' },
          ].map((row, i) => {
            const G = POTALOT_GLYPHS_3.find((x) => x.key === row.g)!.Comp
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

      {/* C4. Tomt-state */}
      <Card title="Batch 3 · tomt-state">
        <div className="flex flex-col items-center text-center" style={{ background: '#F4F6EC', borderRadius: 16, border: '1px dashed rgba(36,48,31,0.15)', padding: '32px 20px' }}>
          {(() => {
            const G = POTALOT_GLYPHS_3.find((x) => x.key === 'hojbed')!.Comp
            return (
              <span className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 20, background: '#EAEFDF' }}>
                <G size={44} />
              </span>
            )
          })()}
          <p style={{ fontFamily: serif, fontWeight: 600, fontSize: 24, color: INK, margin: '14px 0 0' }}>Intet højbed endnu</p>
          <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(36,48,31,0.55)', margin: '6px 0 0', maxWidth: '34ch' }}>
            Tilføj dit første bed, så holder Potalot styr på rytmen.
          </p>
        </div>
      </Card>

      {/* C5. Do/Don't — hvor Lucide har en ækvivalent */}
      <Card title="Batch 3 · do / don't (hvor Lucide har en ækvivalent)">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <div style={{ padding: '0 0 12px', borderBottom: '1px solid rgba(36,48,31,0.1)' }}>
            <span className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: '#5E7D4F' }}>✓ Potalot Soft Glyph</span>
          </div>
          <div style={{ padding: '0 0 12px 18px', borderBottom: '1px solid rgba(36,48,31,0.1)', borderLeft: '1px solid rgba(36,48,31,0.08)' }}>
            <span className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(36,48,31,0.4)' }}>Lucide (generisk)</span>
          </div>
          {POTALOT_GLYPHS_3.filter((g) => LUCIDE3[g.key]).map(({ key, label, Comp }) => {
            const L = LUCIDE3[key]
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
          {UDEN_LUCIDE3.join(' · ')} har ingen meningsfuld Lucide-ækvivalent — netop derfor er de custom Soft Glyphs.
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
