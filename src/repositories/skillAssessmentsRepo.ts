import { db } from '@/db/client'
import { skillAssessments } from '@/db/schema'
import type { SkillRatings, WeeklyTime } from '@/types'
import { logSyncEntry } from './syncLogHelper'

export async function saveSkillAssessment(
  userId: string,
  ratings: SkillRatings,
  weeklyTime: WeeklyTime,
): Promise<void> {
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(skillAssessments).values({
    id,
    userId,
    teeShotRating: ratings.teeShot,
    ironRating: ratings.irons,
    shortGameRating: ratings.shortGame,
    puttingRating: ratings.putting,
    courseMgmtRating: ratings.courseMgmt,
    weeklyTimeAvailable: weeklyTime,
    createdAt: now,
    updatedAt: now,
  })
  await logSyncEntry('skill_assessments', id, 'insert')
}
