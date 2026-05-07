import type { SessionConfig, SkillPriority } from '@/types'
import { DRILL_SEEDS } from '../drillSeeds'
import {
  buildTemplateSummary,
  distributeTime,
  generateBlockStructure,
} from '../blockGenerator'
import { MIN_SESSION_DURATION } from '../thresholds'

const MOCK_PRIORITIES: SkillPriority[] = [
  { skill: 'putting',    score: 4.0 },
  { skill: 'shortGame',  score: 3.5 },
  { skill: 'teeShot',    score: 2.8 },
  { skill: 'irons',      score: 2.0 },
  { skill: 'courseMgmt', score: 1.5 },
]

const EQUAL_PRIORITIES: SkillPriority[] = [
  { skill: 'putting',    score: 3.0 },
  { skill: 'shortGame',  score: 3.0 },
  { skill: 'teeShot',    score: 3.0 },
  { skill: 'irons',      score: 3.0 },
  { skill: 'courseMgmt', score: 3.0 },
]

const CONFIG_2x60: SessionConfig = { sessionsPerWeek: 2, sessionDuration: 60, structure: 'focused' }
const CONFIG_3x45: SessionConfig = { sessionsPerWeek: 3, sessionDuration: 45, structure: 'auto' }
const CONFIG_4x60: SessionConfig = { sessionsPerWeek: 4, sessionDuration: 60, structure: 'focused' }
const CONFIG_1x30: SessionConfig = { sessionsPerWeek: 1, sessionDuration: 30, structure: 'mixed' }
const CONFIG_2x60_MIXED: SessionConfig = { sessionsPerWeek: 2, sessionDuration: 60, structure: 'mixed' }

describe('distributeTime', () => {
  it('returns durations matching priority count', () => {
    const durations = distributeTime(MOCK_PRIORITIES, 120)
    expect(durations).toHaveLength(5)
  })

  it('durations sum to total minutes', () => {
    const total = 120
    const durations = distributeTime(MOCK_PRIORITIES, total)
    expect(durations.reduce((a, b) => a + b, 0)).toBe(total)
  })

  it('every duration >= MIN_SESSION_DURATION when budget allows', () => {
    const durations = distributeTime(MOCK_PRIORITIES, 120)
    for (const d of durations) {
      expect(d).toBeGreaterThanOrEqual(MIN_SESSION_DURATION)
    }
  })

  it('higher score gets more time', () => {
    const durations = distributeTime(MOCK_PRIORITIES, 120)
    // putting (score 4.0) should get more than courseMgmt (score 1.5)
    expect(durations[0]).toBeGreaterThan(durations[4])
  })

  it('equal scores produce equal durations', () => {
    const durations = distributeTime(EQUAL_PRIORITIES, 100)
    const unique = new Set(durations)
    expect(unique.size).toBe(1)
    expect(durations[0]).toBe(20)
  })

  it('handles very small budget gracefully', () => {
    const durations = distributeTime(MOCK_PRIORITIES, 30)
    expect(durations.reduce((a, b) => a + b, 0)).toBe(30)
    for (const d of durations) {
      expect(d).toBeGreaterThan(0)
    }
  })

  it('works with fewer than 5 skills (multi-skill session)', () => {
    const subset: SkillPriority[] = [
      { skill: 'teeShot', score: 3.0 },
      { skill: 'irons', score: 2.0 },
    ]
    const durations = distributeTime(subset, 60)
    expect(durations).toHaveLength(2)
    expect(durations.reduce((a, b) => a + b, 0)).toBe(60)
    expect(durations[0]).toBeGreaterThan(durations[1])
  })
})

describe('generateBlockStructure', () => {
  it('generates correct session count: 2 sessions/week = 8 total', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    expect(block.sessions).toHaveLength(8)
  })

  it('generates correct session count: 3 sessions/week = 12 total', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_3x45, 'break100', 1, DRILL_SEEDS)
    expect(block.sessions).toHaveLength(12)
  })

  it('generates correct session count: 4 sessions/week = 16 total', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_4x60, 'break80', 1, DRILL_SEEDS)
    expect(block.sessions).toHaveLength(16)
  })

  it('generates correct session count: 1 session/week = 4 total', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_1x30, 'break100', 1, DRILL_SEEDS)
    expect(block.sessions).toHaveLength(4)
  })

  it('every week has the correct number of sessions', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_3x45, 'break100', 1, DRILL_SEEDS)
    for (const wk of [1, 2, 3, 4]) {
      const weekSessions = block.sessions.filter((s) => s.weekNumber === wk)
      expect(weekSessions.length).toBe(3)
    }
  })

  it('all 5 skill areas are covered across sessions each week (focused, 2 sessions)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    for (const wk of [1, 2, 3, 4]) {
      const weekSkills = new Set(
        block.sessions
          .filter((s) => s.weekNumber === wk)
          .flatMap((s) => s.skills),
      )
      expect(weekSkills.size).toBe(5)
    }
  })

  it('all 5 skill areas are covered across sessions each week (focused, 4 sessions)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_4x60, 'break100', 1, DRILL_SEEDS)
    for (const wk of [1, 2, 3, 4]) {
      const weekSkills = new Set(
        block.sessions
          .filter((s) => s.weekNumber === wk)
          .flatMap((s) => s.skills),
      )
      expect(weekSkills.size).toBe(5)
    }
  })

  it('mixed mode: every session contains all 5 skills', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60_MIXED, 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.skills).toHaveLength(5)
      const unique = new Set(s.skills)
      expect(unique.size).toBe(5)
    }
  })

  it('sessions have skills array populated', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.skills.length).toBeGreaterThan(0)
      expect(s.skills).toContain(s.primarySkill)
    }
  })

  it('sets the correct blockNumber', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 3, DRILL_SEEDS)
    expect(block.blockNumber).toBe(3)
  })

  it('starts with llmSummary = null', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    expect(block.llmSummary).toBeNull()
  })

  it('includes skill priorities in output', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    expect(block.skillPriorities).toBe(MOCK_PRIORITIES)
  })

  it('sessions have sequential sessionNumbers starting at 1', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_3x45, 'break100', 1, DRILL_SEEDS)
    const numbers = block.sessions.map((s) => s.sessionNumber)
    expect(numbers[0]).toBe(1)
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBe(numbers[i - 1] + 1)
    }
  })

  it('all sessions have valid weekNumber (1-4)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_4x60, 'break80', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect([1, 2, 3, 4]).toContain(s.weekNumber)
    }
  })

  it('each session has a primarySkill matching a known skill area', () => {
    const validSkills = ['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(validSkills).toContain(s.primarySkill)
    }
  })

  it('each session has a positive durationMinutes', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_1x30, 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.durationMinutes).toBeGreaterThan(0)
    }
  })

  it('all sessions use the configured session duration', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.durationMinutes).toBe(60)
    }
  })

  it('session duration matches config across all weeks', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_3x45, 'break90', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.durationMinutes).toBe(45)
    }
  })

  it('sessions have drills array with DrillAllocation shape', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_3x45, 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(Array.isArray(s.drills)).toBe(true)
      for (const d of s.drills) {
        expect(d).toHaveProperty('drillId')
        expect(d).toHaveProperty('durationOverride')
        expect(d).toHaveProperty('shotCountOverride')
      }
    }
  })

  it('every session has at least one drill', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_4x60, 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.drills.length).toBeGreaterThan(0)
    }
  })

  it('previousDrillIds biases away from already-used drills (4-drill cells)', () => {
    // break90 has 4-drill cells for putting and shortGame, so block 2 should
    // surface at least one drill not seen in block 1.
    const block1 = generateBlockStructure(MOCK_PRIORITIES, CONFIG_4x60, 'break90', 1, DRILL_SEEDS)
    const block1DrillIds = new Set(
      block1.sessions.flatMap((s) => s.drills.map((d) => d.drillId)),
    )

    const block2 = generateBlockStructure(
      MOCK_PRIORITIES, CONFIG_4x60, 'break90', 2, DRILL_SEEDS, block1DrillIds,
    )

    const newDrills = block2.sessions
      .flatMap((s) => s.drills.map((d) => d.drillId))
      .filter((id) => !block1DrillIds.has(id))
    expect(newDrills.length).toBeGreaterThan(0)
  })

  it('previousDrillIds never increases overlap with the previous block', () => {
    // Even when pool sizes are tight (break100 = 3 drills per cell), the
    // exclusion-aware block must overlap the previous block ≤ a block
    // generated without exclusion.
    const block1 = generateBlockStructure(MOCK_PRIORITIES, CONFIG_4x60, 'break100', 1, DRILL_SEEDS)
    const block1DrillIds = new Set(
      block1.sessions.flatMap((s) => s.drills.map((d) => d.drillId)),
    )

    const block2WithExclusion = generateBlockStructure(
      MOCK_PRIORITIES, CONFIG_4x60, 'break100', 2, DRILL_SEEDS, block1DrillIds,
    )
    const block2WithoutExclusion = generateBlockStructure(
      MOCK_PRIORITIES, CONFIG_4x60, 'break100', 2, DRILL_SEEDS,
    )

    const overlapWith = block2WithExclusion.sessions
      .flatMap((s) => s.drills.map((d) => d.drillId))
      .filter((id) => block1DrillIds.has(id)).length
    const overlapWithout = block2WithoutExclusion.sessions
      .flatMap((s) => s.drills.map((d) => d.drillId))
      .filter((id) => block1DrillIds.has(id)).length

    expect(overlapWith).toBeLessThanOrEqual(overlapWithout)
  })
})

describe('buildTemplateSummary', () => {
  it('returns a non-empty string', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    const summary = buildTemplateSummary(block)
    expect(typeof summary).toBe('string')
    expect(summary.length).toBeGreaterThan(0)
  })

  it('mentions all 4 weeks', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    const summary = buildTemplateSummary(block)
    expect(summary).toContain('Week 1')
    expect(summary).toContain('Week 2')
    expect(summary).toContain('Week 3')
    expect(summary).toContain('Week 4')
  })

  it('reflects actual session count per week', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, CONFIG_2x60, 'break100', 1, DRILL_SEEDS)
    const summary = buildTemplateSummary(block)
    expect(summary).toContain('2 sessions')
  })
})
