import { db } from '@/db/client'
import { skillAssessments } from '@/db/schema'
import type { SessionConfig, SkillRatings } from '@/types'
import { logSyncEntry } from './syncLogHelper'

export async function saveSkillAssessment(
  userId: string,
  ratings: SkillRatings,
  sessionConfig: SessionConfig,
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
    sessionsPerWeek: sessionConfig.sessionsPerWeek,
    sessionDuration: sessionConfig.sessionDuration,
    sessionStructure: sessionConfig.structure,
    createdAt: now,
    updatedAt: now,
  })
  await logSyncEntry('skill_assessments', id, 'insert')
}
