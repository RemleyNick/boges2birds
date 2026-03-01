import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { drills } from '@/db/schema'
import type { DrillRow } from '@/db/schema'

export async function getAllDrills(): Promise<DrillRow[]> {
  return db
    .select()
    .from(drills)
    .orderBy(drills.skillArea, drills.name)
}

export async function getDrillsBySkillArea(skillArea: string): Promise<DrillRow[]> {
  return db
    .select()
    .from(drills)
    .where(eq(drills.skillArea, skillArea))
    .orderBy(drills.name)
}
