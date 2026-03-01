import type { Drill, ProgramSlug, SkillArea } from '@/types'

/**
 * Given a session's primarySkill + program + duration, pick 1–3 appropriate
 * drills from the pool. Filters by skill area and compatible program, then
 * fills time without going over by more than one drill's duration.
 */
export function selectDrills(
  primarySkill: SkillArea,
  program: ProgramSlug,
  durationMinutes: number,
  drillPool: Drill[],
): Drill[] {
  const candidates = drillPool.filter(
    (d) => d.skillArea === primarySkill && d.programSlugs.includes(program),
  )

  if (candidates.length === 0) return []

  // Shuffle deterministically for repeatability within a session type
  // (simple sort by id so output is stable)
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id))

  const selected: Drill[] = []
  let remaining = durationMinutes

  for (const drill of sorted) {
    if (selected.length >= 3) break
    if (drill.durationMinutes <= remaining) {
      selected.push(drill)
      remaining -= drill.durationMinutes
    }
  }

  // If nothing fit (very short session), just pick the shortest drill
  if (selected.length === 0 && sorted.length > 0) {
    const shortest = sorted.reduce((min, d) =>
      d.durationMinutes < min.durationMinutes ? d : min,
    )
    selected.push(shortest)
  }

  return selected
}
