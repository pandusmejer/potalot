/**
 * HavehistorieArtikel — render af én redaktionel Havehistorie.
 *
 * Magasin-registret (samme univers som Havebog/Guides): Cormorant til
 * fortælling, Manrope til etiketter. Ingen hero-foto endnu — fotoreglen:
 * luft er bedre end et ligegyldigt billede. Når historien får sin egen
 * billed-asset (public/images/havehistorier/<slug>/), lægges heroen på her.
 *
 * ⚠️ Ikke live i produktflade. Renderes kun via stilprøven
 * /admin/qa/havehistorier indtil kontrakten er godkendt.
 *
 * Læser en lille markdown-undermængde i section.content: afsnit, GFM-tabeller
 * og inline kursiv/fed. Ingen markdown-dependency i repoet.
 */

import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Sprout } from 'lucide-react'
import { SERIE_LABEL, type Havehistorie } from '@/data/havehistorier'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const INK = 'rgba(36,48,31,0.90)'
const INK_SOFT = 'rgba(36,48,31,0.66)'
const INK_FAINT = 'rgba(36,48,31,0.44)'
const LINE = 'rgba(36,48,31,0.12)'

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="uppercase"
      style={{
        fontFamily: sans,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: INK_FAINT,
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}

/* ── markdown-let inline: **fed** og *kursiv* ── */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  // Del først på **fed**, dernæst på *kursiv* inde i hvert stykke.
  text.split(/(\*\*[^*]+\*\*)/g).forEach((chunk, i) => {
    if (/^\*\*[^*]+\*\*$/.test(chunk)) {
      out.push(
        <strong key={`${keyBase}-b${i}`} style={{ fontWeight: 700 }}>
          {chunk.slice(2, -2)}
        </strong>
      )
      return
    }
    chunk.split(/(\*[^*]+\*)/g).forEach((piece, j) => {
      if (/^\*[^*]+\*$/.test(piece)) {
        out.push(
          <em key={`${keyBase}-i${i}-${j}`} style={{ fontStyle: 'italic' }}>
            {piece.slice(1, -1)}
          </em>
        )
      } else if (piece) {
        out.push(<Fragment key={`${keyBase}-t${i}-${j}`}>{piece}</Fragment>)
      }
    })
  })
  return out
}

function isTableBlock(block: string): boolean {
  const lines = block.trim().split('\n')
  return lines.length >= 2 && lines.every(l => l.trim().startsWith('|'))
}

function cells(row: string): string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(c => c.trim())
}

function Tabel({ block, k }: { block: string; k: string }) {
  const lines = block.trim().split('\n')
  const head = cells(lines[0])
  const body = lines.slice(2).map(cells) // spring separator-rækken over
  return (
    <div style={{ overflowX: 'auto', margin: '18px -11px', padding: '0 11px' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: 540,
          fontFamily: sans,
          fontSize: 12.5,
          lineHeight: 1.45,
          color: INK_SOFT,
        }}
      >
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  verticalAlign: 'top',
                  padding: '8px 12px',
                  borderBottom: `1.5px solid ${LINE}`,
                  fontWeight: 700,
                  color: INK,
                  fontSize: 11,
                  letterSpacing: '0.04em',
                }}
              >
                {inline(h, `th${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  style={{
                    verticalAlign: 'top',
                    padding: '10px 12px',
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  {inline(c, `${k}-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Prosa({ content, k }: { content: string; k: string }) {
  const blocks = content.split('\n\n')
  return (
    <>
      {blocks.map((block, i) =>
        isTableBlock(block) ? (
          <Tabel key={`${k}-t${i}`} block={block} k={`${k}-t${i}`} />
        ) : (
          <p
            key={`${k}-p${i}`}
            style={{
              fontFamily: serif,
              fontSize: 18.5,
              lineHeight: 1.62,
              color: INK,
              margin: i === 0 ? 0 : '14px 0 0',
            }}
          >
            {inline(block, `${k}-p${i}`)}
          </p>
        )
      )}
    </>
  )
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function HavehistorieArtikel({
  historie,
  returnTo = '/admin/qa/havehistorier',
}: {
  historie: Havehistorie
  returnTo?: string
}) {
  const t = historie.readingTimeMinutes
  return (
    <article style={{ paddingBottom: 56 }}>
      {/* tilbage */}
      <Link
        href={returnTo}
        className="inline-flex items-center no-underline"
        style={{ gap: 6, color: INK_SOFT, fontFamily: sans, fontSize: 13, fontWeight: 600, marginBottom: 22 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} strokeWidth={2} aria-hidden />
        Fra haven
      </Link>

      {/* ── HERO (typografisk, ingen foto endnu) ── */}
      <header style={{ marginBottom: 26 }}>
        <div className="flex items-center" style={{ gap: 10, marginBottom: 16 }}>
          <Eyebrow>{SERIE_LABEL[historie.series]}</Eyebrow>
          <span aria-hidden style={{ color: INK_FAINT }}>·</span>
          <Eyebrow>{t} min</Eyebrow>
        </div>
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(34px, 9cqw, 46px)',
            lineHeight: 1.08,
            color: INK,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {historie.title}
        </h1>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: 20,
            lineHeight: 1.5,
            color: INK_SOFT,
            margin: '16px 0 0',
          }}
        >
          {historie.summary}
        </p>
      </header>

      {/* ── DET KORTE SVAR ── */}
      <section
        style={{
          margin: '0 -11px 30px',
          padding: '20px 22px 22px',
          background: 'rgba(122,132,95,0.10)',
          borderRadius: 14,
          border: `1px solid rgba(122,132,95,0.18)`,
        }}
      >
        <Eyebrow>Det korte svar</Eyebrow>
        <p
          style={{
            fontFamily: serif,
            fontSize: 19.5,
            lineHeight: 1.55,
            color: INK,
            margin: '10px 0 0',
          }}
        >
          {historie.shortAnswer}
        </p>
      </section>

      {/* ── SEKTIONER ── */}
      {historie.sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 30 }}>
          <h2
            style={{
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: INK_SOFT,
              margin: '0 0 12px',
            }}
          >
            {s.heading}
          </h2>
          <Prosa content={s.content} k={`s${i}`} />
        </section>
      ))}

      {/* ── SE EFTER DETTE I DIN HAVE ── */}
      {historie.lookFor.length > 0 && (
        <section
          style={{
            margin: '0 -11px 30px',
            padding: '20px 22px 22px',
            border: `1px solid ${LINE}`,
            borderRadius: 14,
          }}
        >
          <Eyebrow>Se efter dette i din have</Eyebrow>
          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
            {historie.lookFor.map((item, i) => (
              <li
                key={i}
                className="flex"
                style={{
                  gap: 10,
                  padding: '9px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
                  fontFamily: sans,
                  fontSize: 14.5,
                  lineHeight: 1.5,
                  color: INK,
                }}
              >
                <Sprout
                  style={{ width: 16, height: 16, marginTop: 3, flexShrink: 0, color: 'rgba(122,132,95,0.9)' }}
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── I DIN HAVE ── */}
      <section style={{ marginBottom: 30 }}>
        <h2
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 26,
            color: INK,
            margin: '0 0 10px',
          }}
        >
          I din have
        </h2>
        <p style={{ fontFamily: serif, fontSize: 18.5, lineHeight: 1.62, color: INK, margin: 0 }}>
          {historie.gardenAdvice}
        </p>
      </section>

      {/* ── KILDER ── */}
      {historie.sourceLinks.length > 0 && (
        <section style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
          <Eyebrow>Kilder</Eyebrow>
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0 }}>
            {historie.sourceLinks.map((url, i) => (
              <li key={i} style={{ padding: '4px 0' }}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center no-underline"
                  style={{ gap: 6, fontFamily: sans, fontSize: 12.5, color: INK_SOFT }}
                >
                  <ExternalLink style={{ width: 12, height: 12, flexShrink: 0 }} strokeWidth={2} aria-hidden />
                  {hostname(url)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
