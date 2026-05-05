import type { SessionConfig, SessionsPerWeek, SkillArea, SkillPriority } from '@/types'

// ─── Focused mode: group by venue/activity type ─────────────────────────────
// Range skills together, green-side skills together.

export const FOCUSED_GROUPINGS: Record<SessionsPerWeek, SkillArea[][]> = {
  1: [['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']],
  2: [['teeShot', 'irons', 'courseMgmt'], ['shortGame', 'putting']],
  3: [['teeShot', 'irons'], ['shortGame', 'putting'], ['courseMgmt']],
  4: [['teeShot'], ['irons'], ['shortGame', 'putting'], ['courseMgmt']],
}

// ─── Auto mode: group by priority ───────────────────────────────────────────
// Highest-priority skills get dedicated sessions when possible.
// Lower-priority skills share sessions.

export function computeAutoGroupings(
  sessionsPerWeek: SessionsPerWeek,
  priorities: SkillPriority[],
): SkillArea[][] {
  const sorted = [...priorities].sort((a, b) => b.score - a.score)
  const skills = sorted.map((p) => p.skill)

  if (sessionsPerWeek === 1) {
    return [skills]
  }

  if (sessionsPerWeek === 2) {
    // Top 2 skills get the first session, bottom 3 share the second
    return [skills.slice(0, 3), skills.slice(3)]
  }

  if (sessionsPerWeek === 3) {
    // Top skill solo, 2nd+3rd together, 4th+5th together
    return [[skills[0]], [skills[1], skills[2]], [skills[3], skills[4]]]
  }

  // 4 sessions: top 2 skills solo, 3rd solo, 4th+5th together
  return [[skills[0]], [skills[1]], [skills[2]], [skills[3], skills[4]]]
}

// ─── Mixed mode: all skills every session ────────────────────────────────────

export function computeMixedGroupings(sessionsPerWeek: SessionsPerWeek): SkillArea[][] {
  const allSkills: SkillArea[] = ['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']
  return Array.from({ length: sessionsPerWeek }, () => [...allSkills])
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
