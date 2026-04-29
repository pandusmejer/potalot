'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { Idea } from '@/lib/types'

interface IdeaRow {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  target_year: number | null
  tags: string[]
  image_urls: string[]
  primary_image_url: string | null
  created_at: string
  updated_at: string
}

function rowToIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    imageIds: row.primary_image_url ? [row.primary_image_url] : row.image_urls,
    tags: row.tags ?? [],
    status: row.status as Idea['status'],
    targetYear: row.target_year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAllIdeas(): Promise<Idea[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAllIdeas error:', error)
    return []
  }
  return (data as IdeaRow[]).map(rowToIdea)
}

export interface CreateIdeaInput {
  title: string
  description?: string
  status?: Idea['status']
  targetYear?: number
  tags?: string[]
  primaryImageUrl?: string | null
}

export async function createIdea(input: CreateIdeaInput): Promise<{ id: string } | { error: string }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: DEMO_USER_ID,
      title: input.title,
      description: input.description || null,
      status: input.status ?? 'idea',
      target_year: input.targetYear ?? null,
      tags: input.tags ?? [],
      image_urls: input.primaryImageUrl ? [input.primaryImageUrl] : [],
      primary_image_url: input.primaryImageUrl ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette idé' }

  revalidatePath('/idetavle')
  return { id: data.id as string }
}

export async function updateIdea(
  id: string,
  input: Partial<CreateIdeaInput>
): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) update.title = input.title
  if (input.description !== undefined) update.description = input.description || null
  if (input.status !== undefined) update.status = input.status
  if (input.targetYear !== undefined) update.target_year = input.targetYear ?? null
  if (input.tags !== undefined) update.tags = input.tags
  if (input.primaryImageUrl !== undefined) {
    update.primary_image_url = input.primaryImageUrl
    update.image_urls = input.primaryImageUrl ? [input.primaryImageUrl] : []
  }

  const { error } = await supabase
    .from('ideas')
    .update(update)
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }
  revalidatePath('/idetavle')
  return { ok: true }
}

export async function deleteIdea(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }
  revalidatePath('/idetavle')
  return { ok: true }
}
