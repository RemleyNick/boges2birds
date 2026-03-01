import { db } from './client'
import { drills } from './schema'
import { DRILL_SEEDS } from '@/engine/drillSeeds'

/**
 * Insert system drills into the DB if they don't already exist.
 * Safe to call on every app start — INSERT OR IGNORE on the stable seed IDs.
 */
export async function seedSystemDrills(): Promise<void> {
  const now = new Date()

  const rows = DRILL_SEEDS.map((d) => ({
    id: d.id,
    name: d.name,
    skillArea: d.skillArea,
    sessionType: d.sessionType,
    difficulty: null,
    durationMinutes: d.durationMinutes,
    programSlugs: d.programSlugs,
    instructions: d.instructions,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  }))

  await db.insert(drills).values(rows).onConflictDoNothing()
}
