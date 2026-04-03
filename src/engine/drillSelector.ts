import type { Drill, ProgramSlug, SkillArea } from '@/types'
import { MIN_DRILL_DURATION, MIN_PER_SHOT } from './thresholds'

export interface SelectedDrill {
  drill: Drill
  durationOverride: number | null
  shotCountOverride: number | null
}

/**
 * Given a session's primarySkill + program + duration, pick 1–3 appropriate
 * drills from the pool. Filters by skill area and compatible program, then
 * distributes time evenly across drills so no drill receives less than
 * MIN_DRILL_DURATION minutes. When a drill's allocated time is less than its
 * natural duration, scales its shot count down proportionally.
 */
export function selectDrills(
  primarySkill: SkillArea,
  program: ProgramSlug,
  durationMinutes: number,
  drillPool: Drill[],
): SelectedDrill[] {
  const candidates = drillPool.filter(
    (d) => d.skillArea === primarySkill && d.programSlugs.includes(program),
  )

  if (candidates.length === 0) return []

  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id))
  const rate = MIN_PER_SHOT[primarySkill]

  // Pre-determine how many drills to use: at least 1, at most 3,
  // capped so each drill receives at least MIN_DRILL_DURATION minutes.
  const numDrills = Math.max(
    1,
    Math.min(3, sorted.length, Math.floor(durationMinutes / MIN_DRILL_DURATION)),
  )
  const chosen = sorted.slice(0, numDrills)

  // Distribute time evenly — give any remainder to the first drill
  const baseTime = Math.floor(durationMinutes / numDrills)
  const remainder = durationMinutes - baseTime * numDrills

  return chosen.map((drill, i) => {
    const allocated = baseTime + (i === 0 ? remainder : 0)

    if (allocated >= drill.durationMinutes) {
      // Budget meets or exceeds this drill's natural duration — no scaling needed
      return { drill, durationOverride: null, shotCountOverride: null }
    }

    // Scale down to fit allocated time
    const scaledShots = Math.max(1, Math.round(allocated / rate))
    return { drill, durationOverride: allocated, shotCountOverride: scaledShots }
  })
}
