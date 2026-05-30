import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions as sessionsTable, sessionDrills, trainingBlocks } from '@/db/schema'
import type { SessionRow, TrainingBlockRow } from '@/db/schema'
import type { ProgramSlug, SessionConfig, SkillArea, SkillPriority, TrainingBlock } from '@/types'
import { logSyncEntries, logSyncEntry } from '@/repositories/syncLogHelper'
import { distributeTime } from '@/engine/blockGenerator'
import { selectDrills } from '@/engine/drillSelector'
import { WEEK_VOLUME } from '@/engine/thresholds'
import { getSessionGroupings } from '@/engine/skillGrouping'
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
  sessionConfig?: SessionConfig,
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
    sessionConfig: sessionConfig ?? null,
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
      skills: session.skills,
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

export async function getLatestBlock(
  userId: string,
): Promise<ActiveTrainingBlock | null> {
  const block = await db
    .select()
    .from(trainingBlocks)
    .where(eq(trainingBlocks.userId, userId))
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

export async function getDrillIdsForBlock(blockId: string): Promise<Set<string>> {
  const rows = await db
    .select({ drillId: sessionDrills.drillId })
    .from(sessionDrills)
    .innerJoin(sessionsTable, eq(sessionDrills.sessionId, sessionsTable.id))
    .where(eq(sessionsTable.trainingBlockId, blockId))

  return new Set(rows.map((r) => r.drillId))
}

export async function updateTrainingBlockStatus(
  blockId: string,
  status: 'active' | 'completed',
): Promise<void> {
  await db
    .update(trainingBlocks)
    .set({ status, updatedAt: new Date() })
    .where(eq(trainingBlocks.id, blockId))
  await logSyncEntry('training_blocks', blockId, 'update')
}

/**
 * Regenerate pending sessions for the active training block when session
 * config changes. Completed sessions are left untouched.
 * Deletes pending sessions and regenerates them with new groupings/durations.
 */
export async function regeneratePendingSessions(
  userId: string,
  sessionConfig: SessionConfig,
  programSlug: ProgramSlug,
): Promise<void> {
  const block = await getActiveTrainingBlock(userId)
  if (!block) return

  const skillPriorities: SkillPriority[] = block.skillPriorities
  const pendingSessions = block.sessions.filter((s) => s.status !== 'complete')
  if (pendingSessions.length === 0) return

  // Determine which weeks still have pending sessions
  const pendingWeeks = [...new Set(pendingSessions.map((s) => s.weekNumber))]

  const syncEntries: SyncEntry[] = []
  const now = new Date()

  // Delete all pending sessions and their drills
  for (const session of pendingSessions) {
    const existingDrills = await db
      .select({ id: sessionDrills.id })
      .from(sessionDrills)
      .where(eq(sessionDrills.sessionId, session.id))
    for (const ed of existingDrills) {
      syncEntries.push({ tableName: 'session_drills', recordId: ed.id, operation: 'delete' })
    }
    await db.delete(sessionDrills).where(eq(sessionDrills.sessionId, session.id))
    await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id))
    syncEntries.push({ tableName: 'sessions', recordId: session.id, operation: 'delete' })
  }

  // Regenerate sessions for pending weeks with new config
  const groupings = getSessionGroupings(sessionConfig, skillPriorities)
  let sessionNumber = block.sessions
    .filter((s) => s.status === 'complete')
    .length + 1

  for (const weekNum of pendingWeeks.sort()) {
    const effectiveDuration = Math.round(sessionConfig.sessionDuration * WEEK_VOLUME[weekNum as 1 | 2 | 3 | 4])

    for (const skillGroup of groupings) {
      const sessionPriorities = skillGroup.map((skill) => {
        const found = skillPriorities.find((p) => p.skill === skill)
        return found ?? { skill, score: 1 }
      })

      const durations = distributeTime(sessionPriorities, effectiveDuration)
      const allDrills: { drillId: string; durationOverride: number | null; shotCountOverride: number | null }[] = []

      for (let i = 0; i < skillGroup.length; i++) {
        const selected = selectDrills(skillGroup[i], programSlug, durations[i], DRILL_SEEDS)
        for (const sd of selected) {
          allDrills.push({
            drillId: sd.drill.id,
            durationOverride: sd.durationOverride,
            shotCountOverride: sd.shotCountOverride,
          })
        }
      }

      const primarySkill = sessionPriorities[0].skill
      const sessionId = crypto.randomUUID()
      await db.insert(sessionsTable).values({
        id: sessionId,
        trainingBlockId: block.id,
        weekNumber: weekNum,
        sessionNumber,
        sessionType: skillGroup.length === 1
          ? (skillGroup[0] === 'teeShot' ? 'driving' : skillGroup[0] === 'irons' ? 'irons' : skillGroup[0] === 'shortGame' ? 'short_game' : skillGroup[0] === 'putting' ? 'putting' : 'mixed')
          : 'mixed',
        primarySkill,
        skills: skillGroup,
        durationMinutes: effectiveDuration,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      syncEntries.push({ tableName: 'sessions', recordId: sessionId, operation: 'insert' })
      sessionNumber++

      for (let i = 0; i < allDrills.length; i++) {
        const drill = allDrills[i]
        const sdId = crypto.randomUUID()
        await db.insert(sessionDrills).values({
          id: sdId,
          sessionId,
          drillId: drill.drillId,
          orderIndex: i,
          durationOverride: drill.durationOverride,
          shotCountOverride: drill.shotCountOverride,
          completed: false,
          createdAt: now,
          updatedAt: now,
        })
        syncEntries.push({ tableName: 'session_drills', recordId: sdId, operation: 'insert' })
      }
    }
  }

  // Update block's sessionConfig and updatedAt
  await db
    .update(trainingBlocks)
    .set({ sessionConfig, updatedAt: now })
    .where(eq(trainingBlocks.id, block.id))
  syncEntries.push({ tableName: 'training_blocks', recordId: block.id, operation: 'update' })

  await logSyncEntries(syncEntries)
}
