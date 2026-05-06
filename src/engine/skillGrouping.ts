import type { SessionConfig, SessionsPerWeek, SkillArea, SkillPriority } from '@/types'

// ─── Focused mode: group by venue/activity type ─────────────────────────────
// Range skills together, green-side skills together.

export const FOCUSED_GROUPINGS: Record<SessionsPerWeek, SkillArea[][]> = {
  1: [['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']],
  2: [['teeShot', 'irons', 'courseMgmt'], ['shortGame', 'putting']],
  3: [['teeShot', 'irons'], ['shortGame', 'putting'], ['courseMgmt']],
  4: [['teeShot'], ['irons'], ['shortGame', 'putting'], ['courseMgmt']],
}

// ─── Auto mode: venue-based groupings with priority-weighted ordering ────────
// Uses the same venue groupings as focused mode, but reorders skills within
// each group so the highest-priority skill comes first (gets the most time
// via distributeTime).

export function computeAutoGroupings(
  sessionsPerWeek: SessionsPerWeek,
  priorities: SkillPriority[],
): SkillArea[][] {
  const scoreMap = new Map(priorities.map((p) => [p.skill, p.score]))
  const base = FOCUSED_GROUPINGS[sessionsPerWeek]

  return base.map((group) =>
    [...group].sort((a, b) => (scoreMap.get(b) ?? 0) - (scoreMap.get(a) ?? 0)),
  )
}

// ─── Mixed mode: all skills every session ────────────────────────────────────

export function computeMixedGroupings(sessionsPerWeek: SessionsPerWeek): SkillArea[][] {
  const allSkills: SkillArea[] = ['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']
  return Array.from({ length: sessionsPerWeek }, () => [...allSkills])
}

// ─── Session labels ──────────────────────────────────────────────────────────

const SKILL_LABELS: Record<SkillArea, string> = {
  teeShot: 'Tee Shots',
  irons: 'Iron Play',
  shortGame: 'Short Game',
  putting: 'Putting',
  courseMgmt: 'Course Mgmt',
}

const RANGE_SKILLS: Set<SkillArea> = new Set(['teeShot', 'irons'])

/** Generate a human-friendly session label like "Driving Range" or "Short Game + Putting". */
export function getSessionLabel(skills: SkillArea[]): string {
  if (skills.length === 1) return SKILL_LABELS[skills[0]]
  if (skills.length >= 5) return 'Full Practice'

  // All range skills (+ maybe courseMgmt) → "Driving Range"
  if (skills.every((s) => RANGE_SKILLS.has(s) || s === 'courseMgmt')
      && skills.some((s) => RANGE_SKILLS.has(s))) {
    return 'Driving Range'
  }

  // Short game + putting → "Short Game + Putting"
  if (skills.length === 2 && skills.includes('shortGame') && skills.includes('putting')) {
    return 'Short Game + Putting'
  }

  return skills.map((s) => SKILL_LABELS[s]).join(' + ')
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export function getSessionGroupings(
  config: SessionConfig,
  priorities: SkillPriority[],
): SkillArea[][] {
  switch (config.structure) {
    case 'focused':
      return FOCUSED_GROUPINGS[config.sessionsPerWeek]
    case 'mixed':
      return computeMixedGroupings(config.sessionsPerWeek)
    case 'auto':
      return computeAutoGroupings(config.sessionsPerWeek, priorities)
  }
}
