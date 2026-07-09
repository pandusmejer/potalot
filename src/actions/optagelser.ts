'use server'

/**
 * Optagelser (diktafon = indbakke til haven, Fase D).
 *
 * "Tal til din have" persisterer nu hver optagelse som en voice_note med
 * status + sæson-metadata (spec: Docs/product/diktafon-indbakke.md):
 *
 *   gemOptagelse(text)          → gem optagelsen (status 'unprocessed')
 *   listOptagelser()            → arkivet (alle optagelser)
 *   behandlOptagelse(id, ...)   → gør den aktiv: opret log/opgave/minde/
 *                                 observation + opdatér status/relationer
 *
 * LÅST: recorded_at = kilden til sandheden. Behandling opretter loggen/
 * opgaven på OPTAGELSENS dato (recorded_at), ikke behandlingsdatoen.
 * Sæson-metadata gemmes automatisk fra havebog-saeson ved optagelse.
 *
 * Kræver migration 00053_voice_notes (voice_notes-tabellen).
 */

import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { beregnSaeson } from '@/lib/havebog-saeson'
import { createPlantLog } from '@/actions/mine-planter'
import { createTask } from '@/actions/havekalender'
import type { TaleForslag } from '@/lib/tale-fortolk'
import type { OptagelseStatus } from '@/data/havebog-demo'

export interface OptagelseRow {
  id: string
  text: string
  recordedAt: string
  status: OptagelseStatus
  seasonNumber: number | null
  seasonDay: number | null
}

function daysBetween(from: string, to: Date): number {
  const a = new Date(from + 'T00:00:00').getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86400000)
}

/** Sæson-metadata for en given optagelsestid (fra brugerens sånings-logs). */
async function saesonMetaFor(
  userId: string,
  recordedAt: Date,
): Promise<{ nummer: number | null; dag: number | null; start: string | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plant_logs_v2')
    .select('date')
    .eq('user_id', userId)
    .eq('type', 'sowing')
  const saaninger = (data ?? []).map(r => r.date as string)
  const s = beregnSaeson(saaninger)
  if (!s.start) return { nummer: null, dag: null, start: null }
  return {
    nummer: s.nummer,
    dag: daysBetween(s.start, recordedAt) + 1,
    start: s.start,
  }
}

/**
 * Gem en ny optagelse (status 'unprocessed'). recorded_at + sæson-metadata
 * sættes automatisk — brugeren vælger aldrig dato/tid/sæson.
 */
export async function gemOptagelse(
  text: string,
): Promise<{ id: string } | { error: string }> {
  const trimmet = text.trim()
  if (!trimmet) return { error: 'Tom optagelse' }
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const now = new Date()
  const meta = await saesonMetaFor(userId, now)

  const { data, error } = await supabase
    .from('voice_notes')
    .insert({
      user_id: userId,
      text: trimmet,
      recorded_at: now.toISOString(),
      status: 'unprocessed',
      source: 'voice',
      season_number: meta.nummer,
      season_day: meta.dag,
      season_start: meta.start,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke gemme optagelsen' }
  return { id: data.id as string }
}

/** Alle brugerens optagelser — nyeste først (arkivet). */
export async function listOptagelser(): Promise<OptagelseRow[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('voice_notes')
    .select('id, text, recorded_at, status, season_number, season_day')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id as string,
    text: r.text as string,
    recordedAt: r.recorded_at as string,
    status: (r.status as OptagelseStatus) ?? 'unprocessed',
    seasonNumber: (r.season_number as number | null) ?? null,
    seasonDay: (r.season_day as number | null) ?? null,
  }))
}

// hoest → minde (høst bliver til minde); observation → observation;
// note → log; opgave → opgave. Ved flere: den rigeste vinder.
const STATUS_RANG: OptagelseStatus[] = ['minde', 'observation', 'log', 'opgave']
function forslagStatus(f: TaleForslag): OptagelseStatus {
  if (f.type === 'hoest') return 'minde'
  if (f.type === 'observation') return 'observation'
  if (f.type === 'opgave') return 'opgave'
  return 'log'
}

/**
 * Gør en optagelse aktiv: opret de godkendte forslag som log/opgave og
 * opdatér optagelsens status + relationer. Loggen/opgaven dateres til
 * OPTAGELSENS dato (recorded_at) — ikke i dag.
 */
export async function behandlOptagelse(
  optagelseId: string,
  forslag: TaleForslag[],
): Promise<{ status: OptagelseStatus } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Hent optagelsens recorded_at (kilden til sandheden for datoen).
  const { data: note } = await supabase
    .from('voice_notes')
    .select('recorded_at')
    .eq('id', optagelseId)
    .eq('user_id', userId)
    .single()
  if (!note) return { error: 'Optagelsen findes ikke' }
  const optagetDato = (note.recorded_at as string).slice(0, 10)

  let createdLogId: string | null = null
  let createdTaskId: string | null = null
  let plantId: string | null = null
  const statuser: OptagelseStatus[] = []

  for (const f of forslag) {
    if (f.type === 'opgave') {
      const r = await createTask({
        title: f.titel,
        description: f.tekst || undefined,
        date: f.dato ?? optagetDato,
        taskType: 'custom',
        source: 'manual',
        linkedPlantId: f.plantId ?? undefined,
      })
      if ('id' in r) {
        createdTaskId = createdTaskId ?? r.id
        statuser.push('opgave')
      }
    } else if (f.plantId) {
      const r = await createPlantLog({
        plantId: f.plantId,
        date: optagetDato, // recorded_at, IKKE i dag
        type: f.type === 'hoest' ? 'harvest' : 'note',
        title: f.titel,
        note: f.tekst || undefined,
      })
      if ('id' in r) {
        createdLogId = createdLogId ?? r.id
        plantId = plantId ?? f.plantId
        statuser.push(forslagStatus(f))
      }
    }
  }

  if (statuser.length === 0) return { error: 'Intet kunne gemmes' }
  const status =
    STATUS_RANG.find(s => statuser.includes(s)) ?? 'log'
  const nu = new Date().toISOString()

  await supabase
    .from('voice_notes')
    .update({
      status,
      processed_at: nu,
      attached_to_log_at: createdLogId ? nu : null,
      created_log_id: createdLogId,
      created_task_id: createdTaskId,
      plant_id: plantId,
    })
    .eq('id', optagelseId)
    .eq('user_id', userId)

  return { status }
}
