import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { roundLogs } from '@/db/schema'
import type { RoundLog } from '@/db/schema'
import { logSyncEntry } from './syncLogHelper'

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

function validateRoundLog(data: SaveRoundLogInput): void {
  const errors: string[] = []
  if (data.totalScore < 18 || data.totalScore > 200) errors.push('totalScore out of range')
  if (data.fairwaysHit > data.fairwaysTotal) errors.push('fairwaysHit exceeds fairwaysTotal')
  if (data.girHit > data.girTotal) errors.push('girHit exceeds girTotal')
  if (data.holesPlayed !== 9 && data.holesPlayed !== 18) errors.push('holesPlayed must be 9 or 18')
  if (errors.length > 0) throw new Error(`Invalid round log: ${errors.join(', ')}`)
}

export async function saveRoundLog(
  userId: string,
  data: SaveRoundLogInput,
): Promise<string> {
  validateRoundLog(data)
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
  await logSyncEntry('round_logs', id, 'insert')

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
