import { sql } from 'drizzle-orm'
import { db } from './client'
import { drills } from './schema'
import { DRILL_SEEDS } from '@/engine/drillSeeds'

/**
 * Insert or update system drills in the DB.
 * Uses upsert so existing drills get updated shotCount and any other changes.
 * Safe to call on every app start.
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
    shotCount: d.shotCount,
    programSlugs: d.programSlugs,
    instructions: d.instructions,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  }))

  await db
    .insert(drills)
    .values(rows)
    .onConflictDoUpdate({
      target: drills.id,
      set: {
        name: sql`excluded.name`,
        durationMinutes: sql`excluded.duration_minutes`,
        shotCount: sql`excluded.shot_count`,
        instructions: sql`excluded.instructions`,
        programSlugs: sql`excluded.program_slugs`,
        updatedAt: now,
      },
    })
}
