/**
 * guide-regression — beskytter godkendt guide-indhold mod at blive
 * OVERSKREVET af en tyndere kandidat under guides:promote.
 *
 * Baggrund: guides:promote er en fuld overskrivning af content/guides/<slug>.md.
 * En genbygget kandidat kan mangle rige elementer, live-teksten har (fx de låste
 * ikon-faktabokse `botaniskeKendetegn`, Potalot-noten, teknik-kort). Uden en
 * spærre nedgraderes godkendt indhold lydløst. Denne modul er spærren.
 *
 * Ren logik — ingen console, ingen process.exit — så den kan genbruges af
 * guides-promote.ts, guides-status.ts og test-guide-regression.ts.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────
// Markører: de elementer vi nægter at tabe ved en overskrivning
// ─────────────────────────────────────────────────────────────────

export interface GuideMarkers {
  botaniskeKendetegn: boolean  // ikon-faktabokse (del af låst guide-design)
  pluralName: boolean          // flertalsform brugt i arts-copy
  potalotNote: boolean         // ## Potalot-note sektion
  guideCards: number           // antal :::guide teknik-kort
  nextGuide: boolean           // :::next-guide blok
  sections: number             // antal ## sektioner
  sourceLinks: number          // antal kildelinks
}

function splitFrontmatter(text: string): { fm: string; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: text }
}

/**
 * Udtræk markører fra en guide-markdown (kandidat i built/ ELLER live i
 * content/guides/). Bevidst tekst-baseret: den ser præcis det, promote ville
 * skrive, inkl. at guides:build ikke gengiver botaniskeKendetegn/pluralName.
 */
export function markersFromMarkdown(text: string): GuideMarkers {
  const { fm, body } = splitFrontmatter(text)
  const srcLine = fm.match(/^sourceLinks:\s*(.*)$/m)
  return {
    botaniskeKendetegn: /^botaniskeKendetegn:/m.test(fm),
    pluralName: /^pluralName:/m.test(fm),
    potalotNote: /^#{2,3}\s+potalot[-\s]?note\b/im.test(body),
    guideCards: (body.match(/^:::guide[ \t]*$/gm) ?? []).length,
    nextGuide: /^:::next-guide\b/m.test(body),
    sections: (body.match(/^##(?!#)\s+\S/gm) ?? []).length,
    sourceLinks: srcLine ? (srcLine[1].match(/https?:\/\//g) ?? []).length : 0,
  }
}

// ─────────────────────────────────────────────────────────────────
// Sammenligning: hvad taber kandidaten i forhold til live?
// ─────────────────────────────────────────────────────────────────

export interface Regression {
  field: string
  detail: string
}

/** Regressioner = elementer live har, som kandidaten taber (eller reducerer). */
export function compareGuides(live: GuideMarkers, cand: GuideMarkers): Regression[] {
  const r: Regression[] = []
  if (live.botaniskeKendetegn && !cand.botaniskeKendetegn)
    r.push({ field: 'botaniskeKendetegn', detail: 'live har ikon-faktaboksene — kandidaten har dem ikke' })
  if (live.pluralName && !cand.pluralName)
    r.push({ field: 'pluralName', detail: 'live har pluralName — kandidaten mangler det' })
  if (live.potalotNote && !cand.potalotNote)
    r.push({ field: 'Potalot-note', detail: 'live har en Potalot-note — kandidaten har ingen' })
  if (cand.guideCards < live.guideCards)
    r.push({ field: ':::guide', detail: `teknik-kort: live ${live.guideCards} → kandidat ${cand.guideCards}` })
  if (live.nextGuide && !cand.nextGuide)
    r.push({ field: ':::next-guide', detail: 'live har :::next-guide — kandidaten har ingen' })
  if (cand.sections < live.sections)
    r.push({ field: 'sektioner', detail: `live ${live.sections} → kandidat ${cand.sections}` })
  if (cand.sourceLinks < live.sourceLinks)
    r.push({ field: 'sourceLinks', detail: `kilder: live ${live.sourceLinks} → kandidat ${cand.sourceLinks}` })
  return r
}

export function formatRegressionReport(slug: string, regs: Regression[]): string {
  const lines = [`Kandidaten for "${slug}" TABER indhold i forhold til den godkendte live-guide:`]
  for (const r of regs) lines.push(`   · ${r.field}: ${r.detail}`)
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────
// Promote-beslutning (ren) + anvendelse (IO)
// ─────────────────────────────────────────────────────────────────

export type PromoteAction = 'create' | 'update-clean' | 'update-forced' | 'blocked'

export interface PromotePlan {
  action: PromoteAction
  regressions: Regression[]
  willWrite: boolean
}

/**
 * Ren beslutning ud fra kandidat- og live-tekst.
 *   liveText === null            → NEW (opret, ingen regressionskontrol)
 *   ingen regressioner           → UPDATE, skriv
 *   regressioner + force         → UPDATE, skriv (men rapportér)
 *   regressioner uden force      → BLOKERET, skriv ikke
 */
export function planPromote(candText: string, liveText: string | null, force: boolean): PromotePlan {
  if (liveText === null) return { action: 'create', regressions: [], willWrite: true }
  const regs = compareGuides(markersFromMarkdown(liveText), markersFromMarkdown(candText))
  if (regs.length === 0) return { action: 'update-clean', regressions: [], willWrite: true }
  if (force) return { action: 'update-forced', regressions: regs, willWrite: true }
  return { action: 'blocked', regressions: regs, willWrite: false }
}

/**
 * Anvend en promote: læs kandidat + evt. live, beslut, og skriv KUN hvis planen
 * tillader det. `onReport` kaldes FØR en evt. skrivning, så både --force og
 * blokering viser regressionsrapporten før filen røres. Eneste skrive-sti —
 * deles af CLI og tests, så de aldrig divergerer.
 */
export function applyPromote(
  candPath: string,
  livePath: string,
  force: boolean,
  onReport?: (regs: Regression[]) => void,
): PromotePlan {
  const candText = readFileSync(candPath, 'utf8')
  const liveText = existsSync(livePath) ? readFileSync(livePath, 'utf8') : null
  const plan = planPromote(candText, liveText, force)
  if (plan.regressions.length && onReport) onReport(plan.regressions)
  if (plan.willWrite) writeFileSync(livePath, candText)
  return plan
}
