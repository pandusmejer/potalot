'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { Profile, UserMode } from '@/lib/types'

interface ProfileRow {
  id: string
  display_name: string | null
  avatar_url: string | null
  user_mode: string | null
  onboarded: boolean | null
  created_at: string
  updated_at: string
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.display_name ?? 'Bruger',
    email: 'demo@potalot.app',
    avatarUrl: row.avatar_url,
    userMode: (row.user_mode ?? 'afslappet') as UserMode,
    onboarded: row.onboarded ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', DEMO_USER_ID)
    .maybeSingle()

  if (error || !data) return null
  return rowToProfile(data as ProfileRow)
}

export interface UpdateProfileInput {
  username?: string
  avatarUrl?: string | null
  userMode?: UserMode
  onboarded?: boolean
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.username !== undefined) update.display_name = input.username
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl
  if (input.userMode !== undefined) update.user_mode = input.userMode
  if (input.onboarded !== undefined) update.onboarded = input.onboarded

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/profil')
  revalidatePath('/', 'layout')
  return { ok: true }
}
