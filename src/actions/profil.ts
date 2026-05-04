'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { Profile, UserMode } from '@/lib/types'

interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  user_mode: string | null
  onboarded: boolean | null
  is_admin: boolean | null
  created_at: string
  updated_at: string
}

function rowToProfile(row: ProfileRow, email: string | null): Profile {
  return {
    id: row.id,
    username: row.username ?? row.display_name ?? 'Bruger',
    email: email ?? '',
    avatarUrl: row.avatar_url,
    userMode: (row.user_mode ?? 'afslappet') as UserMode,
    onboarded: row.onboarded ?? false,
    isAdmin: row.is_admin ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return rowToProfile(data as ProfileRow, user.email)
}

export interface UpdateProfileInput {
  username?: string
  displayName?: string
  avatarUrl?: string | null
  userMode?: UserMode
  onboarded?: boolean
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.username !== undefined) update.username = input.username
  if (input.displayName !== undefined) update.display_name = input.displayName
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl
  if (input.userMode !== undefined) update.user_mode = input.userMode
  if (input.onboarded !== undefined) update.onboarded = input.onboarded

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/profil')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('is_username_available', { p_username: username })
  return { available: !!data }
}
