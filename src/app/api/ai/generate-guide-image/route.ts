import { getOpenAIClient } from '@/lib/openai/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { guideId, plantName, botanicalName } = await req.json()

    if (!guideId || !plantName) {
      return NextResponse.json(
        { error: 'guideId og plantName er påkrævet' },
        { status: 400 }
      )
    }

    const openai = getOpenAIClient()

    // Build prompt in Flora Danica style
    const botanicalPart = botanicalName
      ? ` (${botanicalName})`
      : ''

    const prompt = `Botanisk illustration i Flora Danica-inspireret stil af ${plantName}${botanicalPart}. Detaljeret, videnskabelig planteillustration med blad, blomst, frugt og rod synlige hvor relevant. Håndtegnet stil med fine pennestreger og akvarel-farver på lys cremefarvet baggrund. Elegant, tidløs og naturhistorisk. Ingen tekst i billedet.`

    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1,
    })

    const imageBase64 = result.data?.[0]?.b64_json
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Ingen billede returneret fra OpenAI' },
        { status: 500 }
      )
    }

    // Upload to Supabase Storage
    const supabase = await createClient()
    const fileName = `guide-${guideId}-${Date.now()}.png`
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('guide-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      // Fallback: store as base64 data URI directly
      const dataUri = `data:image/png;base64,${imageBase64}`
      await supabase
        .from('plant_guides')
        .update({ image_url: dataUri })
        .eq('id', guideId)

      return NextResponse.json({ success: true, image_url: dataUri, storage: 'base64' })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('guide-images')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Save URL to guide
    await supabase
      .from('plant_guides')
      .update({ image_url: publicUrl })
      .eq('id', guideId)

    return NextResponse.json({ success: true, image_url: publicUrl, storage: 'supabase' })
  } catch (error) {
    console.error('Generate guide image error:', error)
    return NextResponse.json(
      { error: 'Der opstod en fejl ved billedgenerering. Prøv igen.' },
      { status: 500 }
    )
  }
}
