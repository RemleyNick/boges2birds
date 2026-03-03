import AsyncStorage from '@react-native-async-storage/async-storage'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  users,
  skillAssessments,
  userPrograms,
  trainingBlocks,
  roundLogs,
  sessions,
  sessionDrills,
} from '@/db/schema'
import { logSyncEntry, logSyncEntries } from './syncLogHelper'

const GUEST_KEY = 'boges2birds:guestUserId'

export async function getOrCreateGuestUser(): Promise<string> {
  const stored = await AsyncStorage.getItem(GUEST_KEY)
  if (stored) {
    const existing = await db.select().from(users).where(eq(users.id, stored)).get()
    if (existing) return stored
  }
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(users).values({
    id,
    email: `guest-${id}@local`,
    subscriptionStatus: 'free',
    createdAt: now,
    updatedAt: now,
  })
  await logSyncEntry('users', id, 'insert')
  await AsyncStorage.setItem(GUEST_KEY, id)
  return id
}

export async function getOrCreateAuthUser(
  supabaseUserId: string,
  email: string,
): Promise<string> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, supabaseUserId))
    .get()
  if (existing) return supabaseUserId

  const now = new Date()
  await db.insert(users).values({
    id: supabaseUserId,
    email,
    subscriptionStatus: 'free',
    createdAt: now,
    updatedAt: now,
  })
  await logSyncEntry('users', supabaseUserId, 'insert')
  return supabaseUserId
}

export async function migrateGuestToAuth(
  guestUserId: string,
  supabaseUserId: string,
  email: string,
): Promise<void> {
  const now = new Date()

  // Insert new user row with the Supabase ID
  await db.insert(users).values({
    id: supabaseUserId,
    email,
    subscriptionStatus: 'free',
    createdAt: now,
    updatedAt: now,
  })

  // Copy display name from guest row if present
  const guest = await db.select().from(users).where(eq(users.id, guestUserId)).get()
  if (guest?.displayName) {
    await db
      .update(users)
      .set({ displayName: guest.displayName, updatedAt: now })
      .where(eq(users.id, supabaseUserId))
  }

  // Query child record IDs before re-pointing FKs (for sync logging)
  const assessmentRows = await db
    .select({ id: skillAssessments.id })
    .from(skillAssessments)
    .where(eq(skillAssessments.userId, guestUserId))
  const programRows = await db
    .select({ id: userPrograms.id })
    .from(userPrograms)
    .where(eq(userPrograms.userId, guestUserId))
  const blockRows = await db
    .select({ id: trainingBlocks.id })
    .from(trainingBlocks)
    .where(eq(trainingBlocks.userId, guestUserId))
  const roundRows = await db
    .select({ id: roundLogs.id })
    .from(roundLogs)
    .where(eq(roundLogs.userId, guestUserId))

  // Get session + session_drill IDs via training blocks
  const sessionRows = blockRows.length > 0
    ? await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(
          // drizzle-orm inArray requires an import, use a simpler approach
          eq(sessions.trainingBlockId, blockRows[0]?.id ?? ''),
        )
    : []
  // For multiple blocks, gather all sessions
  let allSessionIds: string[] = []
  for (const block of blockRows) {
    const s = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.trainingBlockId, block.id))
    allSessionIds.push(...s.map((r) => r.id))
  }
  let allSessionDrillIds: string[] = []
  for (const sid of allSessionIds) {
    const sd = await db
      .select({ id: sessionDrills.id })
      .from(sessionDrills)
      .where(eq(sessionDrills.sessionId, sid))
    allSessionDrillIds.push(...sd.map((r) => r.id))
  }

  // Re-point all child FKs from guest → auth user
  await db
    .update(skillAssessments)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(skillAssessments.userId, guestUserId))

  await db
    .update(userPrograms)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(userPrograms.userId, guestUserId))

  await db
    .update(trainingBlocks)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(trainingBlocks.userId, guestUserId))

  await db
    .update(roundLogs)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(roundLogs.userId, guestUserId))

  // Delete old guest row
  await db.delete(users).where(eq(users.id, guestUserId))

  // Log sync entries for the new auth user + all re-pointed children
  const entries = [
    { tableName: 'users', recordId: supabaseUserId, operation: 'insert' as const },
    ...assessmentRows.map((r) => ({
      tableName: 'skill_assessments',
      recordId: r.id,
      operation: 'update' as const,
    })),
    ...programRows.map((r) => ({
      tableName: 'user_programs',
      recordId: r.id,
      operation: 'update' as const,
    })),
    ...blockRows.map((r) => ({
      tableName: 'training_blocks',
      recordId: r.id,
      operation: 'update' as const,
    })),
    ...allSessionIds.map((id) => ({
      tableName: 'sessions',
      recordId: id,
      operation: 'update' as const,
    })),
    ...allSessionDrillIds.map((id) => ({
      tableName: 'session_drills',
      recordId: id,
      operation: 'update' as const,
    })),
    ...roundRows.map((r) => ({
      tableName: 'round_logs',
      recordId: r.id,
      operation: 'update' as const,
    })),
  ]
  await logSyncEntries(entries)

  // Clear guest key from AsyncStorage
  await AsyncStorage.removeItem(GUEST_KEY)
}
