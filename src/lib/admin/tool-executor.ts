import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'

type ToolInput = Record<string, unknown>
type ToolResult = { success: boolean; data?: unknown; error?: string }

export async function executeAdminTool(toolName: string, input: ToolInput): Promise<ToolResult> {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  try {
    switch (toolName) {
      // === READ ===
      case 'list_seeds': {
        let query = supabase
          .from('seeds')
          .select('*, guide:plant_guides(name_da, slug)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (input.status) query = query.eq('status', input.status as string)
        if (input.search) query = query.or(`name.ilike.%${input.search}%,variety.ilike.%${input.search}%`)
        const { data, error } = await query
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'list_plants': {
        let query = supabase
          .from('plants')
          .select('*, guide:plant_guides(name_da, slug)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (input.status) query = query.eq('status', input.status as string)
        if (input.search) query = query.or(`name.ilike.%${input.search}%,variety.ilike.%${input.search}%`)
        const { data, error } = await query
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'list_tasks': {
        let query = supabase
          .from('tasks')
          .select('*, plant:plants(name, variety)')
          .eq('user_id', userId)
          .order('due_date', { ascending: true })
        if (input.completed === true) query = query.not('completed_at', 'is', null)
        if (input.completed === false) query = query.is('completed_at', null)
        if (input.task_type) query = query.eq('task_type', input.task_type as string)
        if (input.from_date) query = query.gte('due_date', input.from_date as string)
        if (input.to_date) query = query.lte('due_date', input.to_date as string)
        const { data, error } = await query
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'list_notes': {
        let query = supabase
          .from('notes')
          .select('*, plant:plants(name, variety)')
          .eq('user_id', userId)
          .order('note_date', { ascending: false })
        if (input.search) query = query.or(`title.ilike.%${input.search}%,content.ilike.%${input.search}%`)
        if (input.tag) query = query.contains('tags', [input.tag as string])
        const { data, error } = await query
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'list_guides': {
        let query = supabase
          .from('plant_guides')
          .select('*')
          .order('name_da', { ascending: true })
        if (input.category) query = query.eq('category', input.category as string)
        const { data, error } = await query
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'list_change_requests': {
        let query = supabase
          .from('change_requests')
          .select('*')
          .order('created_at', { ascending: false })
        if (input.status) query = query.eq('status', input.status as string)
        const { data, error } = await query
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      // === SEEDS ===
      case 'create_seed': {
        const { data, error } = await supabase
          .from('seeds')
          .insert({
            user_id: userId,
            name: input.name as string,
            variety: (input.variety as string) || null,
            brand: (input.brand as string) || null,
            guide_id: (input.guide_id as string) || null,
            quantity: input.quantity != null ? Number(input.quantity) : null,
            year_purchased: input.year_purchased != null ? Number(input.year_purchased) : null,
            expiry_year: input.expiry_year != null ? Number(input.expiry_year) : null,
            notes: (input.notes as string) || null,
            status: (input.status as string) || 'in_stock',
          })
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'update_seed': {
        const { id, ...updates } = input
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) updateData[key] = value
        }
        const { data, error } = await supabase
          .from('seeds')
          .update(updateData)
          .eq('id', id as string)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'delete_seed': {
        const { error } = await supabase
          .from('seeds')
          .delete()
          .eq('id', input.id as string)
          .eq('user_id', userId)
        if (error) return { success: false, error: error.message }
        return { success: true, data: { deleted: true } }
      }

      // === PLANTS ===
      case 'create_plant': {
        const { data, error } = await supabase
          .from('plants')
          .insert({
            user_id: userId,
            name: input.name as string,
            variety: (input.variety as string) || null,
            seed_id: (input.seed_id as string) || null,
            guide_id: (input.guide_id as string) || null,
            status: (input.status as string) || 'planned',
            location: (input.location as string) || null,
            sow_date: (input.sow_date as string) || null,
            quantity: input.quantity != null ? Number(input.quantity) : 1,
            notes: (input.notes as string) || null,
          })
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'update_plant': {
        const { id, ...updates } = input
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) updateData[key] = value
        }
        const { data, error } = await supabase
          .from('plants')
          .update(updateData)
          .eq('id', id as string)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'delete_plant': {
        const { error } = await supabase
          .from('plants')
          .delete()
          .eq('id', input.id as string)
          .eq('user_id', userId)
        if (error) return { success: false, error: error.message }
        return { success: true, data: { deleted: true } }
      }

      // === TASKS ===
      case 'create_task': {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            title: input.title as string,
            description: (input.description as string) || null,
            task_type: (input.task_type as string) || 'custom',
            due_date: input.due_date as string,
            plant_id: (input.plant_id as string) || null,
            priority: (input.priority as string) || 'medium',
          })
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'complete_task': {
        const { data, error } = await supabase
          .from('tasks')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', input.id as string)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'delete_task': {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', input.id as string)
          .eq('user_id', userId)
        if (error) return { success: false, error: error.message }
        return { success: true, data: { deleted: true } }
      }

      // === NOTES ===
      case 'create_note': {
        const { data, error } = await supabase
          .from('notes')
          .insert({
            user_id: userId,
            title: input.title as string,
            content: input.content as string,
            plant_id: (input.plant_id as string) || null,
            tags: (input.tags as string[]) || null,
            note_date: (input.note_date as string) || new Date().toISOString().split('T')[0],
            season_year: new Date().getFullYear(),
          })
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'update_note': {
        const { id, ...updates } = input
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) updateData[key] = value
        }
        const { data, error } = await supabase
          .from('notes')
          .update(updateData)
          .eq('id', id as string)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'delete_note': {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', input.id as string)
          .eq('user_id', userId)
        if (error) return { success: false, error: error.message }
        return { success: true, data: { deleted: true } }
      }

      // === GUIDES ===
      case 'create_guide': {
        const guideData: Record<string, unknown> = {
          name_da: input.name_da as string,
          slug: input.slug as string,
          category: input.category as string,
        }
        const optionalFields = [
          'name_en', 'description', 'sow_indoor_start', 'sow_indoor_end',
          'sow_outdoor_start', 'sow_outdoor_end', 'plant_out_start', 'plant_out_end',
          'harvest_start', 'harvest_end', 'days_to_germination_min', 'days_to_germination_max',
          'days_to_harvest_min', 'days_to_harvest_max', 'spacing_cm', 'depth_mm',
          'sun_requirement', 'water_need', 'frost_hardy', 'tips', 'companion_plants',
        ]
        for (const field of optionalFields) {
          if (input[field] !== undefined) guideData[field] = input[field]
        }
        const { data, error } = await supabase
          .from('plant_guides')
          .insert(guideData)
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      case 'update_guide': {
        const { id, ...updates } = input
        const updateData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) updateData[key] = value
        }
        const { data, error } = await supabase
          .from('plant_guides')
          .update(updateData)
          .eq('id', id as string)
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      // === CHANGE REQUESTS ===
      case 'create_change_request': {
        const { data, error } = await supabase
          .from('change_requests')
          .insert({
            description: input.description as string,
            details: (input.details as string) || null,
            category: input.category as string,
            priority: (input.priority as string) || 'medium',
          })
          .select()
          .single()
        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }

      default:
        return { success: false, error: `Ukendt tool: ${toolName}` }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Ukendt fejl' }
  }
}
