import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions as sessionsTable, sessionDrills, trainingBlocks } from '@/db/schema'
import type { SessionRow, TrainingBlockRow } from '@/db/schema'
import type { TrainingBlock } from '@/types'
import { logSyncEntries } from '@/repositories/syncLogHelper'

export interface ActiveTrainingBlock extends TrainingBlockRow {
  sessions: SessionRow[]
}

interface SyncEntry {
  tableName: string
  recordId: string
  operation: 'insert' | 'update' | 'delete'
}

export async function saveTrainingBlock(
  userId: string,
  block: TrainingBlock,
): Promise<string> {
  const blockId = crypto.randomUUID()
  const now = new Date()
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 28)

  const syncEntries: SyncEntry[] = []

  await db.insert(trainingBlocks).values({
    id: blockId,
    userId,
    blockNumber: block.blockNumber,
    weekStartDate: today,
    weekEndDate: endDate,
    skillPriorities: block.skillPriorities,
    llmSummary: block.llmSummary,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })
  syncEntries.push({ tableName: 'training_blocks', recordId: blockId, operation: 'insert' })

  for (const session of block.sessions) {
    const sessionId = crypto.randomUUID()
    await db.insert(sessionsTable).values({
      id: sessionId,
      trainingBlockId: blockId,
      weekNumber: session.weekNumber,
      sessionNumber: session.sessionNumber,
      sessionType: session.sessionType,
      primarySkill: session.primarySkill,
      durationMinutes: session.durationMinutes,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
    syncEntries.push({ tableName: 'sessions', recordId: sessionId, operation: 'insert' })

    for (let i = 0; i < session.drillIds.length; i++) {
      const drillId = crypto.randomUUID()
      await db.insert(sessionDrills).values({
        id: drillId,
        sessionId,
        drillId: session.drillIds[i],
        orderIndex: i,
        completed: false,
        createdAt: now,
        updatedAt: now,
      })
      syncEntries.push({ tableName: 'session_drills', recordId: drillId, operation: 'insert' })
    }
  }

  await logSyncEntries(syncEntries)

  return blockId
}

export async function getActiveTrainingBlock(
  userId: string,
): Promise<ActiveTrainingBlock | null> {
  const block = await db
    .select()
    .from(trainingBlocks)
    .where(and(eq(trainingBlocks.userId, userId), eq(trainingBlocks.status, 'active')))
    .orderBy(desc(trainingBlocks.createdAt))
    .get()

  if (!block) return null

  const blockSessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.trainingBlockId, block.id))
    .orderBy(sessionsTable.weekNumber, sessionsTable.sessionNumber)

  return { ...block, sessions: blockSessions }
}
