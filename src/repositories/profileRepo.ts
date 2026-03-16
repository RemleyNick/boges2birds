import { desc, eq, and } from 'drizzle-orm'
import { db } from '@/db/client'
import { users, skillAssessments, userPrograms, programs } from '@/db/schema'
import type { User, SkillAssessment } from '@/db/schema'
import { logSyncEntry } from './syncLogHelper'
import { regeneratePendingSessions } from './trainingBlocksRepo'
import type { ProgramSlug, WeeklyTime } from '@/types'

export async function getUser(userId: string): Promise<User | undefined> {
  return db.select().from(users).where(eq(users.id, userId)).get()
}

export async function getLatestAssessment(
  userId: string,
): Promise<SkillAssessment | undefined> {
  const rows = await db
    .select()
    .from(skillAssessments)
    .where(eq(skillAssessments.userId, userId))
    .orderBy(desc(skillAssessments.createdAt))
    .limit(1)
  return rows[0]
}

export interface ActiveProgramInfo {
  programSlug: string
  programDisplayName: string
  enrolledAt: Date
}

export async function getActiveUserProgram(
  userId: string,
): Promise<ActiveProgramInfo | undefined> {
  const rows = await db
    .select({
      programSlug: programs.slug,
      programDisplayName: programs.displayName,
      enrolledAt: userPrograms.enrolledAt,
    })
    .from(userPrograms)
    .innerJoin(programs, eq(userPrograms.programId, programs.id))
    .where(and(eq(userPrograms.userId, userId), eq(userPrograms.status, 'active')))
    .orderBy(desc(userPrograms.enrolledAt))
    .limit(1)
  return rows[0]
}

export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<void> {
  const safeName = displayName.slice(0, 100)
  await db
    .update(users)
    .set({ displayName: safeName, updatedAt: new Date() })
    .where(eq(users.id, userId))
  await logSyncEntry('users', userId, 'update')
}

export async function updateWeeklyTime(
  userId: string,
  weeklyTime: string,
): Promise<void> {
  // Update the most recent assessment's weekly time
  const latest = await getLatestAssessment(userId)
  if (!latest) return
  await db
    .update(skillAssessments)
    .set({ weeklyTimeAvailable: weeklyTime, updatedAt: new Date() })
    .where(eq(skillAssessments.id, latest.id))
  await logSyncEntry('skill_assessments', latest.id, 'update')

  // Regenerate pending sessions with the new time budget
  const activeProgram = await getActiveUserProgram(userId)
  if (activeProgram) {
    await regeneratePendingSessions(
      userId,
      weeklyTime as WeeklyTime,
      activeProgram.programSlug as ProgramSlug,
    )
  }
}
