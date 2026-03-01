import { db } from '@/db/client'
import { skillAssessments } from '@/db/schema'
import type { SkillRatings, WeeklyTime } from '@/types'

export async function saveSkillAssessment(
  userId: string,
  ratings: SkillRatings,
  weeklyTime: WeeklyTime,
): Promise<void> {
  const now = new Date()
  await db.insert(skillAssessments).values({
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
}
