import type { Drill, ProgramSlug, Session, SessionType, SkillArea, SkillPriority, TrainingBlock, WeeklyTime } from '@/types'
import { SESSION_DURATION, SESSIONS_PER_WEEK, WEEK_VOLUME } from './thresholds'
import { selectDrills } from './drillSelector'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return number of sessions per week for the given time bucket. */
export function sessionsPerWeek(weeklyTime: WeeklyTime): number {
  return SESSIONS_PER_WEEK[weeklyTime]
}

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

/**
 * Decide which skill to focus on for a given session slot within a week.
 * Week 1: cycle through all skills (foundation)
 * Week 2: favour top 2 skills
 * Week 3: favour top 1 skill
 * Week 4: cycle through (consolidation)
 */
function pickSkillForSlot(
  priorities: SkillPriority[],
  weekNumber: 1 | 2 | 3 | 4,
  slotIndex: number,
  totalSlots: number,
): SkillArea {
  const top = priorities[0]?.skill ?? 'putting'
  const second = priorities[1]?.skill ?? 'shortGame'

  switch (weekNumber) {
    case 1:
    case 4:
      // Cycle through all 5 skills evenly
      return priorities[slotIndex % priorities.length]?.skill ?? top

    case 2:
      // First half of sessions → top 2, remainder cycle
      if (slotIndex < Math.ceil(totalSlots * 0.6)) {
        return slotIndex % 2 === 0 ? top : second
      }
      return priorities[slotIndex % priorities.length]?.skill ?? top

    case 3:
      // >50% of sessions on top skill
      if (slotIndex < Math.ceil(totalSlots * 0.6)) {
        return top
      }
      return second
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a full 4-week training block. Pure function — no I/O.
 * Volume is honoured by reducing session count (rounded down) for lighter weeks.
 */
export function generateBlockStructure(
  priorities: SkillPriority[],
  weeklyTime: WeeklyTime,
  program: ProgramSlug,
  blockNumber: number,
  drillPool: Drill[],
): TrainingBlock {
  const baseSessionCount = sessionsPerWeek(weeklyTime)
  const baseDuration = SESSION_DURATION[weeklyTime]
  const sessions: Session[] = []
  let sessionNumber = 1

  const weeks: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4]

  for (const weekNumber of weeks) {
    const volume = WEEK_VOLUME[weekNumber]
    const weekSessions = Math.max(1, Math.round(baseSessionCount * volume))

    for (let slot = 0; slot < weekSessions; slot++) {
      const primarySkill = pickSkillForSlot(priorities, weekNumber, slot, weekSessions)
      const sessionType = skillToSessionType(primarySkill)
      const drills = selectDrills(primarySkill, program, baseDuration, drillPool)

      sessions.push({
        weekNumber,
        sessionNumber,
        sessionType,
        primarySkill,
        durationMinutes: baseDuration,
        drillIds: drills.map((d) => d.id),
      })

      sessionNumber++
    }
  }

  return {
    blockNumber,
    skillPriorities: priorities,
    sessions,
    llmSummary: null,
  }
}

/**
 * Template fallback summary — always available, requires no network.
 * Produces friendly plain-text weekly summaries based on block structure.
 */
export function buildTemplateSummary(block: TrainingBlock): string {
  const topSkill = block.skillPriorities[0]?.skill ?? 'putting'
  const secondSkill = block.skillPriorities[1]?.skill ?? 'shortGame'

  const weekSummaries = ([1, 2, 3, 4] as const).map((week) => {
    const weekSessions = block.sessions.filter((s) => s.weekNumber === week)
    const skills = [...new Set(weekSessions.map((s) => s.primarySkill))].join(', ')
    const themes: Record<1 | 2 | 3 | 4, string> = {
      1: 'Foundation',
      2: 'Build',
      3: 'Peak',
      4: 'Consolidate',
    }
    return `Week ${week} (${themes[week]}): ${weekSessions.length} session${weekSessions.length !== 1 ? 's' : ''} focusing on ${skills || 'all skills'}.`
  })

  return (
    `This block prioritises ${topSkill} and ${secondSkill} — your biggest opportunities for improvement.\n\n` +
    weekSummaries.join('\n')
  )
}

/**
 * Async LLM enrichment — stubbed until src/services/llm.ts is implemented.
 * Returns the template summary immediately. When llm.ts is ready, replace the
 * body with an actual OpenAI call.
 */
export async function enrichWithLLMSummary(block: TrainingBlock): Promise<string> {
  // TODO: wire to src/services/llm.ts when available
  return buildTemplateSummary(block)
}
