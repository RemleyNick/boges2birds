import type { Drill, DrillAllocation, ProgramSlug, Session, SessionConfig, SessionType, SkillArea, SkillPriority, TrainingBlock } from '@/types'
import { MIN_SESSION_DURATION } from './thresholds'
import { selectDrills } from './drillSelector'
import { getSessionGroupings } from './skillGrouping'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map a SkillArea to its matching SessionType. */
function skillToSessionType(skill: SkillArea): SessionType {
  switch (skill) {
    case 'teeShot':    return 'driving'
    case 'irons':      return 'irons'
    case 'shortGame':  return 'short_game'
    case 'putting':    return 'putting'
    case 'courseMgmt': return 'mixed'
  }
}

/** Derive the session type from a multi-skill group. */
function groupToSessionType(skills: SkillArea[]): SessionType {
  if (skills.length === 1) return skillToSessionType(skills[0])
  // If all skills are range-type, label as driving; otherwise mixed
  const rangeSkills: SkillArea[] = ['teeShot', 'irons']
  if (skills.every((s) => rangeSkills.includes(s))) return 'driving'
  return 'mixed'
}

/**
 * Distribute `totalMinutes` across skills proportional to priority score.
 * Higher score = more time. Each skill gets at least MIN_SESSION_DURATION.
 * Returns durations in the same order as `priorities`.
 */
export function distributeTime(
  priorities: SkillPriority[],
  totalMinutes: number,
): number[] {
  const count = priorities.length
  const minTotal = count * MIN_SESSION_DURATION

  // If budget can't cover minimums, give each skill an equal share
  if (totalMinutes <= minTotal) {
    const each = Math.round(totalMinutes / count)
    return priorities.map(() => each)
  }

  // Reserve minimums, then distribute the remainder by score weight
  const remainder = totalMinutes - minTotal
  const totalScore = priorities.reduce((sum, p) => sum + p.score, 0)

  const raw = priorities.map(
    (p) => MIN_SESSION_DURATION + (p.score / totalScore) * remainder,
  )

  // Round to whole minutes, then adjust for rounding drift
  const rounded = raw.map((r) => Math.round(r))
  let drift = totalMinutes - rounded.reduce((a, b) => a + b, 0)

  // Fix drift by adjusting the highest-score skill first
  for (let i = 0; drift !== 0 && i < count; i++) {
    const adjust = drift > 0 ? 1 : -1
    rounded[i] += adjust
    drift -= adjust
  }

  return rounded
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a full 4-week training block. Pure function — no I/O.
 *
 * Sessions per week and duration are determined by SessionConfig.
 * Skills are grouped across sessions based on structure preference.
 * Week volume multipliers scale effective session duration.
 */
export function generateBlockStructure(
  priorities: SkillPriority[],
  sessionConfig: SessionConfig,
  program: ProgramSlug,
  blockNumber: number,
  drillPool: Drill[],
  previousDrillIds?: ReadonlySet<string>,
): TrainingBlock {
  const groupings = getSessionGroupings(sessionConfig, priorities)
  const sessions: Session[] = []
  let sessionNumber = 1

  for (const weekNumber of [1, 2, 3, 4] as const) {
    const sessionDuration = sessionConfig.sessionDuration

    for (let slotIndex = 0; slotIndex < groupings.length; slotIndex++) {
      const skillGroup = groupings[slotIndex]

      // Build priorities subset for skills in this session
      const sessionPriorities = skillGroup.map((skill) => {
        const found = priorities.find((p) => p.skill === skill)
        return found ?? { skill, score: 1 }
      })

      // Distribute time across skills within this session
      const durations = distributeTime(sessionPriorities, sessionDuration)

      // Select drills for each skill's time slice
      const allDrills: DrillAllocation[] = []
      for (let i = 0; i < skillGroup.length; i++) {
        const skill = skillGroup[i]
        const skillDuration = durations[i]
        const selectedDrills = selectDrills(skill, program, skillDuration, drillPool, previousDrillIds)
        for (const sd of selectedDrills) {
          allDrills.push({
            drillId: sd.drill.id,
            durationOverride: sd.durationOverride,
            shotCountOverride: sd.shotCountOverride,
          })
        }
      }

      const primarySkill = sessionPriorities[0].skill
      sessions.push({
        weekNumber,
        sessionNumber,
        sessionType: groupToSessionType(skillGroup),
        primarySkill,
        skills: skillGroup,
        durationMinutes: sessionDuration,
        drills: allDrills,
      })

      sessionNumber++
    }
  }

  return {
    blockNumber,
    skillPriorities: priorities,
    sessions,
  }
}
