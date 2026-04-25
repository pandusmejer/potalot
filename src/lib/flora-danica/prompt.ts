/**
 * Flora Danica-prompt skabelon for AI-genererede plante-illustrationer.
 *
 * Mål: konsistent stil på tværs af biblioteket — kobberstuk-linje + akvarel
 * på pergament, så det hele ligner ét sammenhængende værk.
 */

export interface FloraDanicaInput {
  plantName: string
  variety?: string | null
  latinName?: string | null
}

export function buildFloraDanicaPrompt(input: FloraDanicaInput): string {
  const navn = input.variety
    ? `${input.plantName} (${input.variety})`
    : input.plantName
  const latinPart = input.latinName ? `, latinsk navn: ${input.latinName}` : ''

  return [
    `Botanical illustration of ${navn}${latinPart}.`,
    '',
    'Style: classic Flora Danica copperplate engraving, hand-tinted in muted watercolor.',
    'Composition: full plant with visible root, stem, leaves, flower, and fruit when relevant.',
    'Background: warm cream parchment, no border or text.',
    'Lines: fine, precise pen strokes; gentle cross-hatching for depth.',
    'Palette: muted botanical greens, soft cream, occasional dusty rose or rust accents.',
    'Mood: scientific, elegant, naturhistorisk, never cartoonish.',
    '',
    'Important:',
    '- No text, labels, or numbers in the illustration.',
    '- No photographic style.',
    '- Anatomically correct: petals, leaves, and fruit shape true to species.',
    '- Subject centered with breathing space around it.',
  ].join('\n')
}

/**
 * TODO (AI): Brug denne i /api/flora-danica/generate route.
 * TODO (kurator): AI-genererede illustrationer skal flagges som unapproved
 * indtil en kurator har godkendt dem (botanisk korrekthed).
 */
