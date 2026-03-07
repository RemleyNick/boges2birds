import type { Drill, ProgramSlug, SkillArea } from '@/types'
import { MIN_PER_SHOT } from './thresholds'

export interface SelectedDrill {
  drill: Drill
  durationOverride: number | null
  shotCountOverride: number | null
}

/**
 * Given a session's primarySkill + program + duration, pick 1–3 appropriate
 * drills from the pool. Filters by skill area and compatible program, then
 * fills time without going over. When a drill doesn't fit at full size,
 * scales its shot count down to fit the remaining budget.
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

  const selected: SelectedDrill[] = []
  let remaining = durationMinutes

  for (const drill of sorted) {
    if (selected.length >= 3) break
    if (remaining <= 0) break

    if (drill.durationMinutes <= remaining) {
      // Drill fits fully — no scaling needed
      selected.push({ drill, durationOverride: null, shotCountOverride: null })
      remaining -= drill.durationMinutes
    } else if (selected.length === 0 || remaining >= rate) {
      // Drill doesn't fit fully — scale it down
      const scaledShots = Math.max(1, Math.floor(remaining / rate))
      const scaledDuration = Math.round(scaledShots * rate)
      selected.push({
        drill,
        durationOverride: scaledDuration,
        shotCountOverride: scaledShots,
      })
      remaining -= scaledDuration
    }
  }

  // If nothing was selected (empty candidates already handled above),
  // pick the shortest drill and scale it
  if (selected.length === 0 && sorted.length > 0) {
    const shortest = sorted.reduce((min, d) =>
      d.durationMinutes < min.durationMinutes ? d : min,
    )
    const scaledShots = Math.max(1, Math.floor(durationMinutes / rate))
    const scaledDuration = Math.round(scaledShots * rate)
    selected.push({
      drill: shortest,
      durationOverride: scaledDuration,
      shotCountOverride: scaledShots,
    })
  }

  return selected
}
