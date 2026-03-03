import { db } from '@/db/client'
import { syncLog } from '@/db/schema'

interface SyncEntry {
  tableName: string
  recordId: string
  operation: 'insert' | 'update' | 'delete'
}

/** Log a single sync entry for background push to Supabase. */
export async function logSyncEntry(
  tableName: string,
  recordId: string,
  operation: 'insert' | 'update' | 'delete',
): Promise<void> {
  const now = new Date()
  await db.insert(syncLog).values({
    id: crypto.randomUUID(),
    tableName,
    recordId,
    operation,
    synced: false,
    createdAt: now,
    updatedAt: now,
  })
}

/** Log multiple sync entries in one go (e.g. after saveTrainingBlock). */
export async function logSyncEntries(entries: SyncEntry[]): Promise<void> {
  if (entries.length === 0) return
  const now = new Date()
  await db.insert(syncLog).values(
    entries.map((e) => ({
      id: crypto.randomUUID(),
      tableName: e.tableName,
      recordId: e.recordId,
      operation: e.operation,
      synced: false,
      createdAt: now,
      updatedAt: now,
    })),
  )
}
