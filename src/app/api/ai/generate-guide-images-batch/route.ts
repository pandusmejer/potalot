import { getOpenAIClient } from '@/lib/openai/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 300 // 5 min for batch processing

export async function POST() {
  try {
    const supabase = await createClient()
    const openai = getOpenAIClient()

    // Find all guides without profile image
    const { data: guides, error } = await supabase
      .from('plant_guides')
      .select('id, name_da, botanical_name')
      .is('image_url', null)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!guides || guides.length === 0) {
      return NextResponse.json({ message: 'Alle guides har allerede billeder', generated: 0 })
    }

    const results: { id: string; name: string; success: boolean; error?: string }[] = []

    for (const guide of guides) {
      try {
        const botanicalPart = guide.botanical_name
          ? ` (${guide.botanical_name})`
          : ''

        const prompt = `Botanisk illustration i Flora Danica-inspireret stil af ${guide.name_da}${botanicalPart}. Detaljeret, videnskabelig planteillustration med blad, blomst, frugt og rod synlige hvor relevant. Håndtegnet stil med fine pennestreger og akvarel-farver på lys cremefarvet baggrund. Elegant, tidløs og naturhistorisk. Ingen tekst i billedet.`

        const result = await openai.images.generate({
          model: 'gpt-image-1',
          prompt,
          size: '1024x1024',
          quality: 'medium',
          n: 1,
        })

        const imageBase64 = result.data?.[0]?.b64_json
        if (!imageBase64) {
          results.push({ id: guide.id, name: guide.name_da, success: false, error: 'Intet billede returneret' })
          continue
        }

        // Upload to Supabase Storage
        const fileName = `guide-${guide.id}-${Date.now()}.png`
        const imageBuffer = Buffer.from(imageBase64, 'base64')

        const { error: uploadError } = await supabase.storage
          .from('guide-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          })

        let imageUrl: string

        if (uploadError) {
          // Fallback to base64
          imageUrl = `data:image/png;base64,${imageBase64}`
        } else {
          const { data: urlData } = supabase.storage
            .from('guide-images')
            .getPublicUrl(fileName)
          imageUrl = urlData.publicUrl
        }

        await supabase
          .from('plant_guides')
          .update({ image_url: imageUrl })
          .eq('id', guide.id)

        results.push({ id: guide.id, name: guide.name_da, success: true })
      } catch (err) {
        results.push({
          id: guide.id,
          name: guide.name_da,
          success: false,
          error: err instanceof Error ? err.message : 'Ukendt fejl',
        })
      }
    }

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Genererede ${succeeded} billeder, ${failed} fejlede`,
      generated: succeeded,
      failed,
      results,
    })
  } catch (error) {
    console.error('Batch generate images error:', error)
    return NextResponse.json(
      { error: 'Der opstod en fejl. Prøv igen.' },
      { status: 500 }
    )
  }
}
