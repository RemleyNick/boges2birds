import { eq, asc } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  syncLog,
  users,
  skillAssessments,
  userPrograms,
  trainingBlocks,
  sessions,
  sessionDrills,
  roundLogs,
} from '@/db/schema'
import type { SyncLogRow } from '@/db/schema'
import { getClient } from './auth'
import { useUserStore } from '@/store/userStore'

// Maps sync_log.table_name → { drizzleTable, supabaseTable }
const TABLE_MAP: Record<
  string,
  { drizzleTable: any; supabaseTable: string }
> = {
  users: { drizzleTable: users, supabaseTable: 'users' },
  skill_assessments: { drizzleTable: skillAssessments, supabaseTable: 'skill_assessments' },
  user_programs: { drizzleTable: userPrograms, supabaseTable: 'user_programs' },
  training_blocks: { drizzleTable: trainingBlocks, supabaseTable: 'training_blocks' },
  sessions: { drizzleTable: sessions, supabaseTable: 'sessions' },
  session_drills: { drizzleTable: sessionDrills, supabaseTable: 'session_drills' },
  round_logs: { drizzleTable: roundLogs, supabaseTable: 'round_logs' },
}

/** Convert camelCase JS key to snake_case Postgres column. */
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}

/** Convert a Drizzle row to a snake_case payload suitable for Supabase upsert. */
function toSupabasePayload(row: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const snakeKey = toSnakeCase(key)
    if (value instanceof Date) {
      payload[snakeKey] = value.toISOString()
    } else {
      payload[snakeKey] = value
    }
  }
  return payload
}

const BATCH_SIZE = 50

/**
 * Push unsynced local records to Supabase.
 *
 * - Bails if Supabase isn't configured or user is a guest
 * - Processes up to BATCH_SIZE entries per pass, recurses if more remain
 * - Fire-and-forget — errors are written to sync_log.error_message for retry
 */
export async function syncToSupabase(): Promise<void> {
  const client = getClient()
  if (!client) return

  // Don't sync for guest users (no Supabase auth identity)
  const isGuest = useUserStore.getState().isGuest
  if (isGuest) return

  const pending = await db
    .select()
    .from(syncLog)
    .where(eq(syncLog.synced, false))
    .orderBy(asc(syncLog.createdAt))
    .limit(BATCH_SIZE)

  if (pending.length === 0) return

  for (const entry of pending) {
    await processEntry(client, entry)
  }

  // If we filled the batch, there may be more
  if (pending.length === BATCH_SIZE) {
    await syncToSupabase()
  }
}

async function processEntry(
  client: NonNullable<ReturnType<typeof getClient>>,
  entry: SyncLogRow,
): Promise<void> {
  const mapping = TABLE_MAP[entry.tableName]
  if (!mapping) {
    await markError(entry.id, `Unknown table: ${entry.tableName}`)
    return
  }

  try {
    if (entry.operation === 'delete') {
      const { error } = await client
        .from(mapping.supabaseTable)
        .delete()
        .eq('id', entry.recordId)
      if (error) throw error
    } else {
      // insert or update — read the full row from SQLite and upsert
      const row = await db
        .select()
        .from(mapping.drizzleTable)
        .where(eq(mapping.drizzleTable.id, entry.recordId))
        .get()

      if (!row) {
        // Row was deleted locally after sync entry was created — issue delete
        const { error } = await client
          .from(mapping.supabaseTable)
          .delete()
          .eq('id', entry.recordId)
        if (error) throw error
      } else {
        const payload = toSupabasePayload(row as Record<string, unknown>)
        const { error } = await client
          .from(mapping.supabaseTable)
          .upsert(payload, { onConflict: 'id' })
        if (error) throw error
      }
    }

    // Success — mark synced
    await db
      .update(syncLog)
      .set({ synced: true, syncedAt: new Date(), updatedAt: new Date() })
      .where(eq(syncLog.id, entry.id))
  } catch (err: any) {
    await markError(entry.id, err?.message ?? String(err))
  }
}

async function markError(syncLogId: string, message: string): Promise<void> {
  await db
    .update(syncLog)
    .set({ errorMessage: message.slice(0, 500), updatedAt: new Date() })
    .where(eq(syncLog.id, syncLogId))
}
