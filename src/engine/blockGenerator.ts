import type { Drill, ProgramSlug, Session, SessionType, SkillArea, SkillPriority, TrainingBlock, WeeklyTime } from '@/types'
import { MIN_SESSION_DURATION, WEEKLY_TIME_BUDGET, WEEK_VOLUME } from './thresholds'
import { selectDrills } from './drillSelector'

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

/**
 * Distribute `totalMinutes` across all 5 skills proportional to priority score.
 * Higher score = more time. Each skill gets at least MIN_SESSION_DURATION.
 * Returns durations in priority order (same order as `priorities`).
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
 * Every week produces exactly 5 sessions (one per skill area).
 * Time per session is weighted by priority score (higher = more time).
 * Week volume scales the total weekly time budget.
 */
export function generateBlockStructure(
  priorities: SkillPriority[],
  weeklyTime: WeeklyTime,
  program: ProgramSlug,
  blockNumber: number,
  drillPool: Drill[],
): TrainingBlock {
  const baseBudget = WEEKLY_TIME_BUDGET[weeklyTime]
  const sessions: Session[] = []
  let sessionNumber = 1

  for (const weekNumber of [1, 2, 3, 4] as const) {
    const weekBudget = Math.round(baseBudget * WEEK_VOLUME[weekNumber])
    const durations = distributeTime(priorities, weekBudget)

    for (let i = 0; i < priorities.length; i++) {
      const primarySkill = priorities[i].skill
      const durationMinutes = durations[i]
      const sessionType = skillToSessionType(primarySkill)
      const drills = selectDrills(primarySkill, program, durationMinutes, drillPool)

      sessions.push({
        weekNumber,
        sessionNumber,
        sessionType,
        primarySkill,
        durationMinutes,
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
    const totalMin = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const themes: Record<1 | 2 | 3 | 4, string> = {
      1: 'Foundation',
      2: 'Build',
      3: 'Peak',
      4: 'Consolidate',
    }
    return `Week ${week} (${themes[week]}): ${weekSessions.length} sessions, ${totalMin} min total.`
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
