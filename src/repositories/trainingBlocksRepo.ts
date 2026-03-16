import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions as sessionsTable, sessionDrills, trainingBlocks } from '@/db/schema'
import type { SessionRow, TrainingBlockRow } from '@/db/schema'
import type { ProgramSlug, SkillArea, SkillPriority, TrainingBlock, WeeklyTime } from '@/types'
import { logSyncEntries } from '@/repositories/syncLogHelper'
import { distributeTime } from '@/engine/blockGenerator'
import { selectDrills } from '@/engine/drillSelector'
import { WEEKLY_TIME_BUDGET, WEEK_VOLUME } from '@/engine/thresholds'
import { DRILL_SEEDS } from '@/engine/drillSeeds'

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

    for (let i = 0; i < session.drills.length; i++) {
      const allocation = session.drills[i]
      const sdId = crypto.randomUUID()
      await db.insert(sessionDrills).values({
        id: sdId,
        sessionId,
        drillId: allocation.drillId,
        orderIndex: i,
        durationOverride: allocation.durationOverride,
        shotCountOverride: allocation.shotCountOverride,
        completed: false,
        createdAt: now,
        updatedAt: now,
      })
      syncEntries.push({ tableName: 'session_drills', recordId: sdId, operation: 'insert' })
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

/**
 * Regenerate pending sessions for the active training block when weekly
 * practice time changes. Completed sessions are left untouched.
 * Updates durations and re-selects drills for each pending session.
 */
export async function regeneratePendingSessions(
  userId: string,
  newWeeklyTime: WeeklyTime,
  programSlug: ProgramSlug,
): Promise<void> {
  const block = await getActiveTrainingBlock(userId)
  if (!block) return

  const skillPriorities: SkillPriority[] = block.skillPriorities
  const pendingSessions = block.sessions.filter((s) => s.status !== 'complete')
  if (pendingSessions.length === 0) return

  // Group pending sessions by week number
  const byWeek = new Map<number, SessionRow[]>()
  for (const s of pendingSessions) {
    const list = byWeek.get(s.weekNumber) ?? []
    list.push(s)
    byWeek.set(s.weekNumber, list)
  }

  const syncEntries: SyncEntry[] = []
  const now = new Date()
  const baseBudget = WEEKLY_TIME_BUDGET[newWeeklyTime]

  // Build skill → index map for duration lookup
  const skillIndex = new Map(skillPriorities.map((p, i) => [p.skill, i]))

  for (const [weekNum, weekSessions] of byWeek) {
    const weekBudget = Math.round(baseBudget * WEEK_VOLUME[weekNum as 1 | 2 | 3 | 4])
    const durations = distributeTime(skillPriorities, weekBudget)

    for (const session of weekSessions) {
      const idx = skillIndex.get(session.primarySkill as SkillArea)
      if (idx === undefined) continue

      const newDuration = durations[idx]

      // Update session duration
      await db
        .update(sessionsTable)
        .set({ durationMinutes: newDuration, updatedAt: now })
        .where(eq(sessionsTable.id, session.id))
      syncEntries.push({ tableName: 'sessions', recordId: session.id, operation: 'update' })

      // Fetch existing session_drills for sync log, then delete
      const existingDrills = await db
        .select({ id: sessionDrills.id })
        .from(sessionDrills)
        .where(eq(sessionDrills.sessionId, session.id))
      for (const ed of existingDrills) {
        syncEntries.push({ tableName: 'session_drills', recordId: ed.id, operation: 'delete' })
      }
      await db.delete(sessionDrills).where(eq(sessionDrills.sessionId, session.id))

      // Select new drills for updated duration
      const selected = selectDrills(
        session.primarySkill as SkillArea,
        programSlug,
        newDuration,
        DRILL_SEEDS,
      )

      // Insert new session_drills
      for (let i = 0; i < selected.length; i++) {
        const sd = selected[i]
        const sdId = crypto.randomUUID()
        await db.insert(sessionDrills).values({
          id: sdId,
          sessionId: session.id,
          drillId: sd.drill.id,
          orderIndex: i,
          durationOverride: sd.durationOverride,
          shotCountOverride: sd.shotCountOverride,
          completed: false,
          createdAt: now,
          updatedAt: now,
        })
        syncEntries.push({ tableName: 'session_drills', recordId: sdId, operation: 'insert' })
      }
    }
  }

  // Update block's updatedAt
  await db
    .update(trainingBlocks)
    .set({ updatedAt: now })
    .where(eq(trainingBlocks.id, block.id))
  syncEntries.push({ tableName: 'training_blocks', recordId: block.id, operation: 'update' })

  await logSyncEntries(syncEntries)
}
