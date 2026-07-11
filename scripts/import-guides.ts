/**
 * Potalot guide-importer.
 *
 *   Læser   content/guides/*.md
 *   Skriver src/data/guides-imported.ts
 *
 * Kør med:
 *   npx tsx scripts/import-guides.ts
 *
 * STRENGHED:
 *   - fejler på manglende slug, duplicate slug, ugyldige enums,
 *     manglende parentSlug på variety, manglende plantName,
 *     ødelagte ::: custom blocks
 *   - advarer på manglende sourceLinks/calendarRules, tomme blokke,
 *     manglende parent i import-sættet, korte sektioner
 *
 * Scriptet er bevidst skrevet uden eksterne deps (ingen js-yaml,
 * ingen markdown-parser) — frontmatteren er simpel og body'en er
 * linje-baseret, så vi kan parse det selv og kontrollere fejl-
 * meddelelserne direkte.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

// ─────────────────────────────────────────────────────────────────
// Enums — genoptryk fra src/lib/types.ts
// (vi importerer ikke fra src/ for at undgå Next.js' import-system)
// ─────────────────────────────────────────────────────────────────

const GUIDE_LEVELS = ['species', 'variety'] as const
type GuideLevel = (typeof GUIDE_LEVELS)[number]

const PRIMARY_CATEGORY_IDS = [
  'fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder',
  'indkoebsliste', 'favoritter',
] as const

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
const LIGHTS = ['full_sun', 'partial_shade', 'shade'] as const
const WATERS = ['low', 'regular', 'high'] as const

const TASK_TYPES = [
  'pre_sow', 'sowing', 'repot', 'plant_out', 'watering',
  'fertilizing', 'pruning', 'pest_check', 'harvest',
  'weeding', 'maintenance', 'planning', 'custom',
] as const

const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

// ─────────────────────────────────────────────────────────────────
// Fejl- og advarsels-typer
// ─────────────────────────────────────────────────────────────────

class ImportError extends Error {
  constructor(public file: string, message: string) {
    super(`${file}: ${message}`)
    this.name = 'ImportError'
  }
}

interface ImportWarning {
  file: string
  message: string
}

// ─────────────────────────────────────────────────────────────────
// YAML-parser — minimal, kun det vi har brug for.
//
// Understøtter:
//   - scalar: key: value          (string, number, bool, null)
//   - quoted: key: "value"
//   - flow:   key: [a, b, c]
//   - block list of scalars:
//       key:
//         - a
//         - b
//   - nested object:
//       key:
//         sub: value
//   - block list of objects:
//       key:
//         - sub: value
//           sub2: value
// ─────────────────────────────────────────────────────────────────

type YamlValue = string | number | boolean | null | YamlValue[] | { [k: string]: YamlValue }

function parseYaml(source: string): Record<string, YamlValue> {
  const lines = source.split('\n').map((l) => l.replace(/\r$/, ''))
  // Drop blank + pure-comment lines, but keep line numbers for errors
  const tokens: Array<{ raw: string; indent: number; lineNum: number }> = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indent = line.length - line.trimStart().length
    tokens.push({ raw: line.trimEnd(), indent, lineNum: i + 1 })
  }

  let cursor = 0

  function peek() { return cursor < tokens.length ? tokens[cursor] : null }
  function consume() { return tokens[cursor++] }

  function parseScalar(raw: string): YamlValue {
    const s = raw.trim()
    if (s === 'null' || s === '~' || s === '') return null
    if (s === 'true') return true
    if (s === 'false') return false
    if (/^-?\d+$/.test(s)) return parseInt(s, 10)
    if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s)
    // flow array  [a, b, c]
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s.slice(1, -1).trim()
      if (!inner) return []
      return inner.split(',').map((part) => parseScalar(part))
    }
    // quoted string
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1)
    }
    return s
  }

  function parseBlock(baseIndent: number): Record<string, YamlValue> {
    const obj: Record<string, YamlValue> = {}
    while (peek() && peek()!.indent >= baseIndent) {
      const token = peek()!
      if (token.indent !== baseIndent) {
        throw new Error(`Linje ${token.lineNum}: uventet indrykning (forventet ${baseIndent}, fik ${token.indent})`)
      }
      consume()
      const trimmed = token.raw.trim()
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx < 0) {
        throw new Error(`Linje ${token.lineNum}: mangler kolon: "${trimmed}"`)
      }
      const key = trimmed.slice(0, colonIdx).trim()
      const rest = trimmed.slice(colonIdx + 1).trim()

      if (rest) {
        obj[key] = parseScalar(rest)
        continue
      }
      // value is on following indented line(s)
      const next = peek()
      if (!next || next.indent <= baseIndent) {
        obj[key] = null
        continue
      }
      if (next.raw.trim().startsWith('- ')) {
        obj[key] = parseList(next.indent)
      } else {
        obj[key] = parseBlock(next.indent)
      }
    }
    return obj
  }

  function parseList(baseIndent: number): YamlValue[] {
    const arr: YamlValue[] = []
    while (peek() && peek()!.indent === baseIndent && peek()!.raw.trim().startsWith('- ')) {
      const token = consume()!
      const itemText = token.raw.trim().slice(2).trim() // strip '- '
      const colonIdx = itemText.indexOf(':')
      if (colonIdx < 0) {
        // scalar list item
        arr.push(parseScalar(itemText))
        continue
      }
      const key = itemText.slice(0, colonIdx).trim()
      const rest = itemText.slice(colonIdx + 1).trim()
      // object list item — first key inline, rest at increased indent
      const obj: Record<string, YamlValue> = {}
      if (rest) obj[key] = parseScalar(rest)
      else obj[key] = null

      // continuation lines: indent > token.indent + 2 (= where key starts)
      const objIndent = token.indent + 2 // '- ' adds 2
      while (peek() && peek()!.indent === objIndent && !peek()!.raw.trim().startsWith('- ')) {
        const cont = consume()!
        const ct = cont.raw.trim()
        const ci = ct.indexOf(':')
        if (ci < 0) throw new Error(`Linje ${cont.lineNum}: forventet 'key: value' i listeelement`)
        const k = ct.slice(0, ci).trim()
        const r = ct.slice(ci + 1).trim()
        if (r) obj[k] = parseScalar(r)
        else obj[k] = null
      }
      arr.push(obj)
    }
    return arr
  }

  if (!peek()) return {}
  return parseBlock(peek()!.indent)
}

// ─────────────────────────────────────────────────────────────────
// Body-parser — markdown med custom ::: blocks
// ─────────────────────────────────────────────────────────────────

interface ProseBlock {
  kind: 'prose'
  title: string
  body: string
}
interface FactBlock {
  kind: 'fact'
  title: string
  variant: string
  columns: Array<{ heading: string; items: string[] }>
  intro?: string
  conclusion?: string
}
interface GuideBlock {
  kind: 'guide'
  slug: string
  title: string
  description: string
}
interface NextBlock {
  kind: 'next'
  slug: string
  title: string
  description: string
  label: string
}
interface RelatedBlock {
  kind: 'related'
  title?: string
  items: Array<{ slug: string; heading: string; description: string }>
}

type Block = ProseBlock | FactBlock | GuideBlock | NextBlock | RelatedBlock

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /(\w+)="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1]] = m[2]
  }
  return attrs
}

function parseBody(body: string, file: string, warnings: ImportWarning[]): Block[] {
  const lines = body.split('\n').map((l) => l.replace(/\r$/, ''))
  const blocks: Block[] = []

  // current state
  let currentProse: { title: string; lines: string[]; isContinuation?: boolean } | null = null
  let currentContainer: { kind: 'fact' | 'guide' | 'next' | 'related'; title?: string; variant?: string; lines: string[] } | null = null
  let lastProseTitle: string | null = null  // for continuation prose efter ::: blok

  function flushProse() {
    if (!currentProse) return
    const body = currentProse.lines.join('\n').trim()
    if (body) {
      // Continuation prose (fri tekst efter ::: blok men før næste ##) får
      // SAMME title som forrige prose-sektion. For at undgå dublet-keys
      // mergeer vi continuation ind i den nærmeste tidligere prose-block
      // med samme title. Hvis ingen tidligere findes, opretter vi en ny
      // (det er stadig samme title — keys vil kollidere, men kun hvis to
      // separate ## faktisk har samme overskrift, hvilket er en ægte
      // markdown-fejl).
      if (currentProse.isContinuation) {
        for (let j = blocks.length - 1; j >= 0; j--) {
          const b = blocks[j]
          if (b.kind === 'prose' && b.title === currentProse.title) {
            b.body = `${b.body}\n\n${body}`
            currentProse = null
            return
          }
        }
      }
      blocks.push({ kind: 'prose', title: currentProse.title, body })
    }
    if (!currentProse.isContinuation) lastProseTitle = currentProse.title
    currentProse = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Open container?
    const openMatch = trimmed.match(/^:::(\w[\w-]*)(\{.*\})?$/)
    if (openMatch) {
      if (currentContainer) {
        throw new ImportError(file, `linje ${i + 1}: ny ::: blok inde i en åben ${currentContainer.kind}-blok`)
      }
      flushProse()
      const name = openMatch[1]
      const attrs = openMatch[2] ? parseAttrs(openMatch[2]) : {}
      if (name === 'fact') {
        currentContainer = {
          kind: 'fact',
          title: attrs.title ?? '',
          variant: attrs.variant ?? 'comparison',
          lines: [],
        }
      } else if (name === 'guide' || name === 'next-guide' || name === 'related-guides') {
        const kind = name === 'next-guide' ? 'next' : name === 'related-guides' ? 'related' : 'guide'
        currentContainer = { kind, lines: [] }
      } else {
        throw new ImportError(file, `linje ${i + 1}: ukendt ::: blok "${name}"`)
      }
      continue
    }

    // Close container?
    if (trimmed === ':::') {
      if (!currentContainer) {
        throw new ImportError(file, `linje ${i + 1}: lukkende ::: uden åben blok`)
      }
      blocks.push(closeContainer(currentContainer, file, i + 1))
      currentContainer = null
      continue
    }

    if (currentContainer) {
      currentContainer.lines.push(line)
      continue
    }

    // ## heading → new prose
    if (/^##\s+\S/.test(trimmed) && !/^###/.test(trimmed)) {
      flushProse()
      const title = trimmed.replace(/^##\s+/, '').trim()
      currentProse = { title, lines: [] }
      continue
    }

    // ### heading uden for :::fact — tolerér som ny prose-sektion
    // (det sker typisk når Anna mener ## men har skrevet ###; renderer
    //  ser dem alligevel som top-level i Guide-struktureen, så vi advarer).
    if (/^###\s+\S/.test(trimmed)) {
      flushProse()
      const title = trimmed.replace(/^###\s+/, '').trim()
      warnings.push({ file, message: `linje ${i + 1}: ### "${title}" — tolket som ## (top-level sektion)` })
      currentProse = { title, lines: [] }
      continue
    }

    // Disallow H1 in body
    if (/^#\s+\S/.test(trimmed) && !/^##/.test(trimmed)) {
      throw new ImportError(file, `linje ${i + 1}: H1 (#) er ikke tilladt i body — brug ##`)
    }

    if (currentProse) {
      currentProse.lines.push(line)
    } else if (trimmed) {
      // Fri tekst efter ::: blok men før næste ##. Behandl som continuation
      // af forrige prose-sektion — opret ny prose med samme titel.
      if (lastProseTitle !== null) {
        currentProse = { title: lastProseTitle, lines: [line], isContinuation: true }
        warnings.push({ file, message: `linje ${i + 1}: fortsætter-paragraf efter ::: blok — føjet til "${lastProseTitle}"` })
      } else {
        throw new ImportError(file, `linje ${i + 1}: indhold uden for ## sektion eller ::: blok: "${trimmed.slice(0, 50)}"`)
      }
    }
  }

  if (currentContainer) {
    throw new ImportError(file, `EOF: ${currentContainer.kind}-blok blev aldrig lukket med :::`)
  }
  flushProse()

  return blocks
}

function closeContainer(
  c: { kind: 'fact' | 'guide' | 'next' | 'related'; title?: string; variant?: string; lines: string[] },
  file: string,
  closeLine: number,
): Block {
  const content = c.lines.join('\n').trim()

  if (c.kind === 'fact') {
    // Parse: [intro-prosa] ### Heading\n- item… ### Heading\n- item… [konklusion-prosa]
    // Prosa FØR første ### = intro; prosa EFTER kolonnerne = konklusion.
    const columns: Array<{ heading: string; items: string[] }> = []
    let cur: { heading: string; items: string[] } | null = null
    const introLines: string[] = []
    const conclusionLines: string[] = []
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (!t) continue
      if (/^###\s+\S/.test(t)) {
        if (cur) columns.push(cur)
        cur = { heading: t.replace(/^###\s+/, '').trim(), items: [] }
      } else if (/^-\s+\S/.test(t)) {
        if (!cur) throw new ImportError(file, `:::fact blok ved linje ${closeLine}: bullet før ### heading`)
        cur.items.push(t.replace(/^-\s+/, '').trim())
      } else {
        // Prosa-linje: intro hvis før første kolonne, ellers konklusion.
        if (columns.length === 0 && !cur) introLines.push(t)
        else conclusionLines.push(t)
      }
    }
    if (cur) columns.push(cur)
    if (columns.length < 2) {
      throw new ImportError(file, `:::fact blok ved linje ${closeLine}: variant="comparison" kræver mindst 2 kolonner (fundet ${columns.length})`)
    }
    return {
      kind: 'fact',
      title: c.title ?? '',
      variant: c.variant ?? 'comparison',
      columns,
      ...(introLines.length ? { intro: introLines.join(' ') } : {}),
      ...(conclusionLines.length ? { conclusion: conclusionLines.join(' ') } : {}),
    }
  }

  if (c.kind === 'guide' || c.kind === 'next') {
    // YAML-ish nøgleværdi-blok inde i ::: blok
    const map = simpleKvParse(content)
    if (!map.slug) throw new ImportError(file, `:::${c.kind === 'next' ? 'next-guide' : 'guide'} blok ved linje ${closeLine}: mangler slug`)
    if (!map.title) throw new ImportError(file, `:::${c.kind === 'next' ? 'next-guide' : 'guide'} blok ved linje ${closeLine}: mangler title`)
    if (!map.description) throw new ImportError(file, `:::${c.kind === 'next' ? 'next-guide' : 'guide'} blok ved linje ${closeLine}: mangler description`)
    if (c.kind === 'next') {
      if (!map.label) throw new ImportError(file, `:::next-guide blok ved linje ${closeLine}: mangler label`)
      return { kind: 'next', slug: map.slug, title: map.title, description: map.description, label: map.label }
    }
    return { kind: 'guide', slug: map.slug, title: map.title, description: map.description }
  }

  // related-guides — format:
  //   #### Heading
  //   slug: foo
  //   description paragraph
  const items: Array<{ slug: string; heading: string; description: string }> = []
  let cur: { heading?: string; slug?: string; description: string[] } | null = null
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (/^####\s+\S/.test(t)) {
      if (cur) flushRelated()
      cur = { heading: t.replace(/^####\s+/, '').trim(), description: [] }
    } else if (t.startsWith('slug:')) {
      if (!cur) throw new ImportError(file, `:::related-guides blok ved linje ${closeLine}: slug før ####`)
      cur.slug = t.replace(/^slug:\s*/, '').trim()
    } else if (t && cur) {
      cur.description.push(t)
    }
  }
  function flushRelated() {
    if (!cur) return
    if (!cur.heading) throw new ImportError(file, `:::related-guides blok ved linje ${closeLine}: item mangler heading`)
    if (!cur.slug) throw new ImportError(file, `:::related-guides blok ved linje ${closeLine}: item "${cur.heading}" mangler slug`)
    items.push({ heading: cur.heading, slug: cur.slug, description: cur.description.join(' ').trim() })
    cur = null
  }
  flushRelated()
  if (items.length === 0) {
    throw new ImportError(file, `:::related-guides blok ved linje ${closeLine}: ingen items`)
  }
  return { kind: 'related', items }
}

function simpleKvParse(content: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t) continue
    const ci = t.indexOf(':')
    if (ci < 0) continue
    map[t.slice(0, ci).trim()] = t.slice(ci + 1).trim()
  }
  return map
}

// ─────────────────────────────────────────────────────────────────
// Validation: frontmatter
// ─────────────────────────────────────────────────────────────────

interface RawFrontmatter {
  slug?: unknown
  guideLevel?: unknown
  parentSlug?: unknown
  plantName?: unknown
  pluralName?: unknown
  variety?: unknown
  latinName?: unknown
  primaryCategoryId?: unknown
  summary?: unknown
  difficulty?: unknown
  tags?: unknown
  quickFacts?: unknown
  botaniskeKendetegn?: unknown
  calendarRules?: unknown
  sourceLinks?: unknown
}

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'string') return v
  return String(v)
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x))
}

function asNumberArray(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => (typeof x === 'number' ? x : parseInt(String(x), 10))).filter((n) => !isNaN(n))
}

function validateFrontmatter(raw: RawFrontmatter, file: string): void {
  const slug = asString(raw.slug)
  if (!slug) throw new ImportError(file, 'frontmatter: slug er påkrævet')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new ImportError(file, `frontmatter: slug "${slug}" — kun små bogstaver, tal og bindestreger`)
  }
  if (!asString(raw.plantName)) {
    throw new ImportError(file, 'frontmatter: plantName er påkrævet')
  }
  const level = asString(raw.guideLevel)
  if (!level || !GUIDE_LEVELS.includes(level as GuideLevel)) {
    throw new ImportError(file, `frontmatter: guideLevel "${level}" — skal være "species" eller "variety"`)
  }
  const pcId = asString(raw.primaryCategoryId)
  if (!pcId || !PRIMARY_CATEGORY_IDS.includes(pcId as any)) {
    throw new ImportError(file, `frontmatter: primaryCategoryId "${pcId}" — ikke i [${PRIMARY_CATEGORY_IDS.join(', ')}]`)
  }
  const diff = asString(raw.difficulty)
  if (!diff || !DIFFICULTIES.includes(diff as any)) {
    throw new ImportError(file, `frontmatter: difficulty "${diff}" — skal være ${DIFFICULTIES.join('/')}`)
  }
  if (level === 'variety') {
    const parent = asString(raw.parentSlug)
    if (!parent) throw new ImportError(file, 'frontmatter: parentSlug er påkrævet for variety-guides')
  }
  if (!asString(raw.summary)) {
    throw new ImportError(file, 'frontmatter: summary er påkrævet')
  }

  // calendarRules: validate types if present
  if (raw.calendarRules && Array.isArray(raw.calendarRules)) {
    for (const [idx, rule] of (raw.calendarRules as any[]).entries()) {
      const t = asString(rule.type)
      if (!t || !TASK_TYPES.includes(t as any)) {
        throw new ImportError(file, `calendarRules[${idx}]: type "${t}" — ikke i [${TASK_TYPES.join(', ')}]`)
      }
      const p = asString(rule.priority)
      if (p && !TASK_PRIORITIES.includes(p as any)) {
        throw new ImportError(file, `calendarRules[${idx}]: priority "${p}" — ikke i [${TASK_PRIORITIES.join('/')}]`)
      }
    }
  }

  // quickFacts: validate light/water if present
  if (raw.quickFacts && typeof raw.quickFacts === 'object') {
    const qf = raw.quickFacts as Record<string, unknown>
    if (qf.light !== undefined && qf.light !== null) {
      const l = asString(qf.light)
      if (!LIGHTS.includes(l as any)) {
        throw new ImportError(file, `quickFacts.light "${l}" — skal være ${LIGHTS.join('/')}`)
      }
    }
    if (qf.water !== undefined && qf.water !== null) {
      const w = asString(qf.water)
      if (!WATERS.includes(w as any)) {
        throw new ImportError(file, `quickFacts.water "${w}" — skal være ${WATERS.join('/')}`)
      }
    }
  }

  // botaniskeKendetegn: validate shape if present
  // Hvert item kræver label + value (strings); icon valgfri.
  // Fri tekst i V4.3 — ingen enum-låsning indtil vi har 10+ arts-
  // eksempler og kender et fælles vokabular.
  if (raw.botaniskeKendetegn !== undefined && raw.botaniskeKendetegn !== null) {
    if (!Array.isArray(raw.botaniskeKendetegn)) {
      throw new ImportError(file, 'botaniskeKendetegn skal være en liste')
    }
    for (const [idx, item] of (raw.botaniskeKendetegn as any[]).entries()) {
      if (!item || typeof item !== 'object') {
        throw new ImportError(file, `botaniskeKendetegn[${idx}] skal være et objekt`)
      }
      const label = asString(item.label)
      const value = asString(item.value)
      if (!label) throw new ImportError(file, `botaniskeKendetegn[${idx}].label er påkrævet`)
      if (!value) throw new ImportError(file, `botaniskeKendetegn[${idx}].value er påkrævet`)
      if (item.icon !== undefined && item.icon !== null && !asString(item.icon)) {
        throw new ImportError(file, `botaniskeKendetegn[${idx}].icon skal være en string hvis sat`)
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Build: rå frontmatter + blocks → Guide-shape
// ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Auto-detekter hero-billede ud fra slug og guideLevel.
 *
 * Konventioner (fra public/images/README.md):
 *   species → arts/<slug>.{jpg,png}
 *   variety → plantekort/<slug>.{jpg,png}
 *
 * Returnerer /images/... path hvis fundet, ellers null.
 */
function detectPrimaryImage(slug: string, guideLevel: string): string | null {
  const folder = guideLevel === 'species' ? 'arts' : 'plantekort'
  for (const ext of ['jpg', 'png']) {
    const rel = `public/images/${folder}/${slug}.${ext}`
    if (existsSync(rel)) return `/images/${folder}/${slug}.${ext}`
  }
  return null
}

function buildGuide(
  file: string,
  raw: RawFrontmatter,
  blocks: Block[],
  warnings: ImportWarning[],
): any {
  const slug = asString(raw.slug)!
  const qfRaw = (raw.quickFacts as Record<string, unknown>) || {}
  const calRaw = (raw.calendarRules as Array<Record<string, unknown>>) || []

  // build sections from blocks
  const sections: any[] = []
  let proseCounter = 0
  let factCounter = 0
  let guideCounter = 0
  let relatedCounter = 0
  for (const b of blocks) {
    if (b.kind === 'prose') {
      const key = slugify(b.title) || `prose-${++proseCounter}`
      sections.push({ key, title: b.title, body: b.body })
    } else if (b.kind === 'fact') {
      const key = `fact-${slugify(b.title) || ++factCounter}`
      sections.push({
        kind: 'fact',
        key,
        title: b.title,
        variant: b.variant,
        columns: b.columns,
        ...(b.intro ? { intro: b.intro } : {}),
        ...(b.conclusion ? { conclusion: b.conclusion } : {}),
      })
    } else if (b.kind === 'guide') {
      const key = `guide-${b.slug || ++guideCounter}`
      sections.push({
        kind: 'guide',
        key,
        title: b.title,
        slug: b.slug,
        description: b.description,
      })
    } else if (b.kind === 'next') {
      sections.push({
        kind: 'next',
        key: 'next',
        title: b.title,
        description: b.description,
        slug: b.slug,
        label: b.label,
      })
    } else if (b.kind === 'related') {
      sections.push({
        kind: 'related',
        key: `related-${++relatedCounter}`,
        items: b.items,
      })
    }
  }

  // build calendarRules: type → taskType, months → recommendedMonths
  const calendarRules = calRaw.map((r) => ({
    taskType: asString(r.type),
    title: asString(r.title) ?? '',
    recommendedMonths: asNumberArray(r.months),
    priority: asString(r.priority) ?? 'medium',
  }))

  // build quickFacts — only known fields
  const quickFacts: any = {
    sowingMonths: asNumberArray(qfRaw.sowingMonths),
    directSowingMonths: asNumberArray(qfRaw.directSowingMonths),
    plantingOutMonths: asNumberArray(qfRaw.plantingOutMonths),
    harvestMonths: asNumberArray(qfRaw.harvestMonths),
  }
  if (qfRaw.preCultivation !== undefined) quickFacts.preCultivation = !!qfRaw.preCultivation
  if (qfRaw.frostSensitive !== undefined) quickFacts.frostSensitive = !!qfRaw.frostSensitive
  if (qfRaw.minimumTemperature) quickFacts.minimumTemperature = asString(qfRaw.minimumTemperature)
  if (qfRaw.light) quickFacts.light = asString(qfRaw.light)
  if (qfRaw.water) quickFacts.water = asString(qfRaw.water)
  if (qfRaw.soil) quickFacts.soil = asString(qfRaw.soil)
  if (qfRaw.germinationTemperature) quickFacts.germinationTemperature = asString(qfRaw.germinationTemperature)
  if (qfRaw.germinationDays) quickFacts.germinationDays = asString(qfRaw.germinationDays)
  if (qfRaw.plantSpacing) quickFacts.plantSpacing = asString(qfRaw.plantSpacing)
  if (qfRaw.rowSpacing) quickFacts.rowSpacing = asString(qfRaw.rowSpacing)
  if (qfRaw.growthType) quickFacts.growthType = asString(qfRaw.growthType)
  if (qfRaw.height) quickFacts.height = asString(qfRaw.height)
  if (qfRaw.maturityDays) quickFacts.maturityDays = asString(qfRaw.maturityDays)
  if (qfRaw.primaryUse) quickFacts.primaryUse = asString(qfRaw.primaryUse)

  // botaniskeKendetegn — kun udfyldt hvis frontmatter har feltet.
  // Validation er allerede sket i validateFrontmatter.
  let botaniskeKendetegn: Array<{ icon?: string; label: string; value: string }> | undefined
  if (Array.isArray(raw.botaniskeKendetegn)) {
    botaniskeKendetegn = (raw.botaniskeKendetegn as any[]).map((item) => {
      const out: { icon?: string; label: string; value: string } = {
        label: asString(item.label)!,
        value: asString(item.value)!,
      }
      const icon = asString(item.icon)
      if (icon) out.icon = icon
      return out
    })
  }

  // warnings
  if (!calRaw.length) warnings.push({ file, message: 'ingen calendarRules — guide bidrager ikke til kalenderen' })
  if (!asStringArray(raw.sourceLinks).length) warnings.push({ file, message: 'ingen sourceLinks' })
  if (sections.length < 3) warnings.push({ file, message: `kun ${sections.length} sektioner — virker tyndt for en ${raw.guideLevel}-guide` })
  const heroPath = detectPrimaryImage(slug, asString(raw.guideLevel)!)
  if (!heroPath) {
    const folder = asString(raw.guideLevel) === 'species' ? 'arts' : 'plantekort'
    warnings.push({ file, message: `intet hero-billede fundet (forventet public/images/${folder}/${slug}.jpg)` })
  }

  return {
    id: slug,
    plantName: asString(raw.plantName),
    pluralName: asString(raw.pluralName),
    variety: asString(raw.variety),
    latinName: asString(raw.latinName),
    guideLevel: asString(raw.guideLevel),
    parentGuideId: asString(raw.parentSlug),
    primaryCategoryId: asString(raw.primaryCategoryId),
    subcategoryId: null,
    summary: asString(raw.summary),
    difficulty: asString(raw.difficulty),
    tags: asStringArray(raw.tags),
    quickFacts,
    ...(botaniskeKendetegn ? { botaniskeKendetegn } : {}),
    sections,
    calendarRules,
    mediaIds: [],
    primaryImageId: detectPrimaryImage(slug, asString(raw.guideLevel)!),
    sourceLinks: asStringArray(raw.sourceLinks),
    status: 'published',
    visibility: 'public',
    reviewStatus: 'approved',
    createdAt: '2026-06-05T00:00:00.000Z',
    updatedAt: '2026-06-05T00:00:00.000Z',
  }
}

// ─────────────────────────────────────────────────────────────────
// Code generator
// ─────────────────────────────────────────────────────────────────

function emitTypescript(guides: any[]): string {
  const header = `/**
 * AUTO-GENERATED — rør ikke direkte.
 *
 * Genereret af scripts/import-guides.ts fra content/guides/*.md.
 * Kør 'npx tsx scripts/import-guides.ts' for at regenerere.
 */

import type { Guide } from '@/lib/types'

export const IMPORTED_GUIDES: Guide[] = `
  // JSON.stringify produces valid TS for our shapes (no functions, no Date).
  // Indent 2 spaces matches project style.
  const body = JSON.stringify(guides, null, 2)
  return header + body + '\n'
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

function main() {
  const guidesDir = 'content/guides'
  const outFile = 'src/data/guides-imported.ts'

  const files = readdirSync(guidesDir).filter((f) => f.endsWith('.md')).sort()
  if (!files.length) {
    console.error(`Ingen .md filer fundet i ${guidesDir}`)
    process.exit(1)
  }

  const guides: any[] = []
  const warnings: ImportWarning[] = []
  const seenSlugs = new Set<string>()
  const errors: string[] = []

  for (const file of files) {
    try {
      const content = readFileSync(join(guidesDir, file), 'utf8')
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (!fmMatch) throw new ImportError(file, 'mangler --- frontmatter ---')
      const [, yamlBlock, body] = fmMatch
      const raw = parseYaml(yamlBlock) as RawFrontmatter

      validateFrontmatter(raw, file)

      const slug = asString(raw.slug)!
      if (seenSlugs.has(slug)) throw new ImportError(file, `duplicate slug "${slug}" (set tidligere)`)
      seenSlugs.add(slug)

      const blocks = parseBody(body, file, warnings)
      const guide = buildGuide(file, raw, blocks, warnings)
      guides.push(guide)
    } catch (e) {
      if (e instanceof ImportError) errors.push(e.message)
      else errors.push(`${file}: ${(e as Error).message}`)
    }
  }

  if (errors.length) {
    console.error('\n✗ Import-fejl:')
    for (const err of errors) console.error(`  ✗ ${err}`)
    console.error(`\n${errors.length} guide(s) kunne ikke importeres. Output ikke skrevet.`)
    process.exit(1)
  }

  // Cross-reference: parentGuideId skal pege på en kendt slug
  for (const g of guides) {
    if (g.parentGuideId && !seenSlugs.has(g.parentGuideId)) {
      warnings.push({
        file: g.id,
        message: `parentGuideId "${g.parentGuideId}" findes ikke i import-sættet`,
      })
    }
  }

  // Sortér: species før variety, ellers alfabetisk på id
  guides.sort((a, b) => {
    if (a.guideLevel !== b.guideLevel) return a.guideLevel === 'species' ? -1 : 1
    return a.id.localeCompare(b.id)
  })

  mkdirSync('src/data', { recursive: true })
  writeFileSync(outFile, emitTypescript(guides))

  console.log(`✓ Importeret ${guides.length} guides → ${outFile}`)
  console.log(`  ${guides.filter((g) => g.guideLevel === 'species').length} species, ${guides.filter((g) => g.guideLevel === 'variety').length} variety`)

  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} advarsel(er):`)
    for (const w of warnings) console.log(`  ⚠ ${w.file}: ${w.message}`)
  }
}

main()
