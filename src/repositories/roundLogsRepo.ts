import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { roundLogs } from '@/db/schema'
import type { RoundLog } from '@/db/schema'

export interface SaveRoundLogInput {
  playedAt: Date
  courseName?: string | null
  holesPlayed: number
  totalScore: number
  fairwaysHit: number
  fairwaysTotal: number
  girHit: number
  girTotal: number
  totalPutts: number
  penalties: number
}

export async function saveRoundLog(
  userId: string,
  data: SaveRoundLogInput,
): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(roundLogs).values({
    id,
    userId,
    playedAt: data.playedAt,
    courseName: data.courseName ?? null,
    holesPlayed: data.holesPlayed,
    totalScore: data.totalScore,
    fairwaysHit: data.fairwaysHit,
    fairwaysTotal: data.fairwaysTotal,
    girHit: data.girHit,
    girTotal: data.girTotal,
    totalPutts: data.totalPutts,
    penalties: data.penalties,
    createdAt: now,
    updatedAt: now,
  })

  return id
}

export async function getRoundLogsForUser(userId: string): Promise<RoundLog[]> {
  return db
    .select()
    .from(roundLogs)
    .where(eq(roundLogs.userId, userId))
    .orderBy(desc(roundLogs.playedAt))
}

export async function getRecentRoundLogs(
  userId: string,
  limit = 3,
): Promise<RoundLog[]> {
  return db
    .select()
    .from(roundLogs)
    .where(eq(roundLogs.userId, userId))
    .orderBy(desc(roundLogs.playedAt))
    .limit(limit)
}
