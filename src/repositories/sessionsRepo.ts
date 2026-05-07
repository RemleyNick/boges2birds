import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/db/client'
import { drills, sessionDrills, sessions, trainingBlocks } from '@/db/schema'
import type { DrillRow, SessionDrill, SessionRow } from '@/db/schema'
import { logSyncEntry } from './syncLogHelper'

export interface SessionDrillDetail extends SessionDrill {
  drill: DrillRow
}

export interface SessionWithDrills extends SessionRow {
  drills: SessionDrillDetail[]
}

export async function getSessionWithDrills(
  sessionId: string,
): Promise<SessionWithDrills | null> {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get()

  if (!session) return null

  const rows = await db
    .select()
    .from(sessionDrills)
    .innerJoin(drills, eq(sessionDrills.drillId, drills.id))
    .where(eq(sessionDrills.sessionId, sessionId))
    .orderBy(sessionDrills.orderIndex)

  const drillDetails: SessionDrillDetail[] = rows.map((row) => ({
    ...row.session_drills,
    drill: row.drills,
  }))

  return { ...session, drills: drillDetails }
}

export async function toggleDrillComplete(
  sessionDrillId: string,
  completed: boolean,
): Promise<void> {
  await db
    .update(sessionDrills)
    .set({ completed, updatedAt: new Date() })
    .where(eq(sessionDrills.id, sessionDrillId))
  await logSyncEntry('session_drills', sessionDrillId, 'update')
}

export async function completeSession(sessionId: string): Promise<void> {
  const now = new Date()
  await db
    .update(sessions)
    .set({ status: 'complete', updatedAt: now })
    .where(eq(sessions.id, sessionId))
  await logSyncEntry('sessions', sessionId, 'update')

  const session = await db
    .select({ trainingBlockId: sessions.trainingBlockId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get()
  if (!session) return

  const incomplete = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.trainingBlockId, session.trainingBlockId),
        ne(sessions.status, 'complete'),
      ),
    )
    .get()

  if (incomplete) return

  await db
    .update(trainingBlocks)
    .set({ status: 'completed', updatedAt: now })
    .where(eq(trainingBlocks.id, session.trainingBlockId))
  await logSyncEntry('training_blocks', session.trainingBlockId, 'update')
}
