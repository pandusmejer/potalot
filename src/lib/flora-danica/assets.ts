/**
 * Flora Danica asset-service.
 *
 * Orkestrerer:
 *  - opslag: hent illustration til en variety (med fallback til species → category)
 *  - generering: kald OpenAI med standardiseret prompt
 *  - opbevaring: upload til Supabase Storage + opdater variety
 *  - kvalitet: AI-genererede assets markeres internt som "ikke godkendt"
 *    indtil en kurator godkender (kan stadig vises i UI men med dæmpet badge)
 */

import { getOpenAIClient } from '@/lib/openai/client'
import { createClient } from '@/lib/supabase/server'
import { byggFloraDanicaPrompt, STANDARD_BILLED_STR, STANDARD_KVALITET, type PromptInput } from './prompt'
import type { Variety, IllustrationSource } from '@/lib/types'

export interface AssetGenereringsResultat {
  success: true
  url: string
  source: IllustrationSource
  approved: boolean
}

export interface AssetFejl {
  success: false
  error: string
}

/**
 * Find en illustration til en variety — med fallback.
 * Prioritet:
 *  1. Variety's egen illustration_url
 *  2. En species-level variety (hvor variety_name IS NULL) for samme species
 *  3. null (UI viser placeholder)
 */
export async function findIllustration(varietyId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: variety } = await supabase
    .from('varieties')
    .select('illustration_url, species_name')
    .eq('id', varietyId)
    .single<Variety>()

  if (!variety) return null
  if (variety.illustration_url) return variety.illustration_url

  // Fallback: species-level variety (variety_name IS NULL) for samme species
  const { data: speciesVariety } = await supabase
    .from('varieties')
    .select('illustration_url')
    .eq('species_name', variety.species_name)
    .is('variety_name', null)
    .not('illustration_url', 'is', null)
    .limit(1)
    .maybeSingle()

  return speciesVariety?.illustration_url ?? null
}

/**
 * Generér en Flora Danica-illustration for en variety og gem den.
 * AI-genererede assets markeres approved = false.
 */
export async function genererFloraDanicaAsset(
  varietyId: string,
  input: PromptInput
): Promise<AssetGenereringsResultat | AssetFejl> {
  const openai = getOpenAIClient()
  const supabase = await createClient()

  try {
    const prompt = byggFloraDanicaPrompt(input)

    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: STANDARD_BILLED_STR,
      quality: STANDARD_KVALITET,
      n: 1,
    })

    const imageBase64 = result.data?.[0]?.b64_json
    if (!imageBase64) {
      return { success: false, error: 'OpenAI returnerede intet billede' }
    }

    // Upload til Supabase Storage
    const fileName = `variety-${varietyId}-${Date.now()}.png`
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('guide-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    let imageUrl: string

    if (uploadError) {
      // Fallback: data URI
      imageUrl = `data:image/png;base64,${imageBase64}`
    } else {
      const { data: urlData } = supabase.storage
        .from('guide-images')
        .getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    // Opdater variety med illustration (ikke godkendt endnu)
    await supabase
      .from('varieties')
      .update({
        illustration_url: imageUrl,
        illustration_source: 'ai_generated' as IllustrationSource,
        illustration_approved: false, // kurator-review påkrævet
      })
      .eq('id', varietyId)

    return {
      success: true,
      url: imageUrl,
      source: 'ai_generated',
      approved: false,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ukendt fejl',
    }
  }
}

/**
 * Godkend et AI-genereret asset (kurator-handling).
 */
export async function godkendAsset(varietyId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('varieties')
    .update({ illustration_approved: true })
    .eq('id', varietyId)

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * List alle ikke-godkendte AI-assets (til admin review).
 */
export async function hentAfventendeAssets(): Promise<Variety[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('varieties')
    .select('*')
    .eq('illustration_source', 'ai_generated')
    .eq('illustration_approved', false)
    .not('illustration_url', 'is', null)
    .order('updated_at', { ascending: false })
  return (data as Variety[]) ?? []
}

/**
 * List alle godkendte assets (seneste først).
 */
export async function hentGodkendteAssets(limit = 20): Promise<Variety[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('varieties')
    .select('*')
    .eq('illustration_approved', true)
    .not('illustration_url', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(limit)
  return (data as Variety[]) ?? []
}

/**
 * Afvis et AI-asset — fjern illustration_url så der kan genereres en ny.
 */
export async function afvisAsset(varietyId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('varieties')
    .update({
      illustration_url: null,
      illustration_source: null,
      illustration_approved: false,
    })
    .eq('id', varietyId)

  if (error) return { error: error.message }
  return { success: true }
}
