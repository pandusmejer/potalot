import type { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { getCurrentSeason } from '@/lib/utils'

interface ContextOptions {
  plantId?: string
  guideId?: string
}

export async function buildAIContext(
  supabase: SupabaseClient,
  userId: string,
  options?: ContextOptions
) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const twoWeeksOut = format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd')

  // Build queries based on context — narrow focus per V1 requirement
  const queries: Promise<unknown>[] = []

  // 1. If a specific plant is in context, fetch it with its guide
  let plantContext = ''
  if (options?.plantId) {
    const { data: plant } = await supabase
      .from('plants')
      .select('*, guide:plant_guides(*)')
      .eq('id', options.plantId)
      .single()

    if (plant) {
      plantContext = `\nFOKUSERET PLANTE:\n- ${plant.name}${plant.variety ? ` (${plant.variety})` : ''}: status=${plant.status}, sået=${plant.sow_date || 'ikke endnu'}, placering=${plant.location || 'ukendt'}\n`
      if (plant.notes) plantContext += `  Brugerens noter: ${plant.notes}\n`
      if (plant.guide) {
        plantContext += `  Guide: Så indendørs ${plant.guide.sow_indoor_start || 'N/A'}–${plant.guide.sow_indoor_end || 'N/A'}, plant ud ${plant.guide.plant_out_start || 'N/A'}, høst ${plant.guide.harvest_start || 'N/A'}–${plant.guide.harvest_end || 'N/A'}\n`
        if (plant.guide.tips) plantContext += `  Tips: ${plant.guide.tips}\n`
      }

      // Fetch notes related to this plant
      const { data: plantNotes } = await supabase
        .from('notes')
        .select('title, content, note_date')
        .eq('user_id', userId)
        .eq('plant_id', options.plantId)
        .order('note_date', { ascending: false })
        .limit(10)

      if (plantNotes?.length) {
        plantContext += `\nNOTER OM DENNE PLANTE:\n`
        plantContext += plantNotes.map(n =>
          `- ${n.note_date} "${n.title}": ${n.content.substring(0, 200)}`
        ).join('\n')
      }
    }
  }

  // 2. If a specific guide is in context, fetch it
  let guideContext = ''
  if (options?.guideId && !options?.plantId) {
    const { data: guide } = await supabase
      .from('plant_guides')
      .select('*')
      .eq('id', options.guideId)
      .single()

    if (guide) {
      guideContext = `\nRELEVANT GUIDE – ${guide.name_da}:\n`
      guideContext += `Kategori: ${guide.category}, Så indendørs: ${guide.sow_indoor_start || 'N/A'}–${guide.sow_indoor_end || 'N/A'}\n`
      guideContext += `Plant ud: ${guide.plant_out_start || 'N/A'}–${guide.plant_out_end || 'N/A'}, Høst: ${guide.harvest_start || 'N/A'}–${guide.harvest_end || 'N/A'}\n`
      guideContext += `Sol: ${guide.sun_requirement || 'N/A'}, Vand: ${guide.water_need || 'N/A'}, Frostfast: ${guide.frost_hardy ? 'ja' : 'nej'}\n`
      if (guide.tips) guideContext += `Tips: ${guide.tips}\n`
    }
  }

  // 3. Fetch user's active plants summary (always, but compact)
  const { data: activePlants } = await supabase
    .from('plants')
    .select('name, variety, status, location, sow_date')
    .eq('user_id', userId)
    .not('status', 'in', '("done","dead")')
    .limit(20)

  let plantsContext = ''
  if (activePlants?.length) {
    plantsContext = `\nBRUGERENS AKTIVE PLANTER:\n`
    plantsContext += activePlants.map(p =>
      `- ${p.name}${p.variety ? ` (${p.variety})` : ''}: ${p.status}${p.location ? `, ${p.location}` : ''}`
    ).join('\n')
  }

  // 4. Upcoming tasks (next 14 days)
  const { data: upcomingTasks } = await supabase
    .from('tasks')
    .select('title, task_type, due_date, plant:plants(name)')
    .eq('user_id', userId)
    .is('completed_at', null)
    .gte('due_date', today)
    .lte('due_date', twoWeeksOut)
    .order('due_date')
    .limit(15)

  let tasksContext = ''
  if (upcomingTasks?.length) {
    tasksContext = `\nKOMMENDE OPGAVER (næste 14 dage):\n`
    tasksContext += upcomingTasks.map(t => {
      const plantData = t.plant as unknown as { name: string } | null
      const plantName = plantData?.name
      return `- ${t.due_date}: ${t.title} (${t.task_type})${plantName ? ` for ${plantName}` : ''}`
    }).join('\n')
  }

  // 5. Recent notes (if no specific plant context)
  let notesContext = ''
  if (!options?.plantId) {
    const { data: recentNotes } = await supabase
      .from('notes')
      .select('title, content, tags, note_date')
      .eq('user_id', userId)
      .order('note_date', { ascending: false })
      .limit(10)

    if (recentNotes?.length) {
      notesContext = `\nSENESTE NOTER:\n`
      notesContext += recentNotes.map(n =>
        `- ${n.note_date} "${n.title}": ${n.content.substring(0, 150)}`
      ).join('\n')
    }
  }

  const season = getCurrentSeason()

  const systemPrompt = `Du er PotAlot AI, en erfaren og venlig dansk haveassistent.
Dato i dag: ${today}. Sæson: ${season}. Brugeren dyrker i Danmark (zone 7-8, maritimt klima).

Svar på brugerens spørgsmål baseret på deres konkrete data nedenfor. Vær praktisk, specifik og henvis til deres faktiske planter og opgaver når det er relevant.
Svar på dansk medmindre brugeren skriver på engelsk.
Hold svar koncise men informative.
${plantContext}${guideContext}${plantsContext}${tasksContext}${notesContext}`

  return systemPrompt
}
