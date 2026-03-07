import type { SkillPriority } from '@/types'
import { DRILL_SEEDS } from '../drillSeeds'
import {
  buildTemplateSummary,
  distributeTime,
  generateBlockStructure,
} from '../blockGenerator'
import { MIN_SESSION_DURATION, WEEKLY_TIME_BUDGET, WEEK_VOLUME } from '../thresholds'

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

describe('distributeTime', () => {
  it('returns 5 durations matching priority count', () => {
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
})

describe('generateBlockStructure', () => {
  it('always generates exactly 20 sessions (5 skills × 4 weeks)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    expect(block.sessions).toHaveLength(20)
  })

  it('every week has exactly 5 sessions', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '90-150', 'break100', 1, DRILL_SEEDS)
    for (const wk of [1, 2, 3, 4]) {
      const weekSessions = block.sessions.filter((s) => s.weekNumber === wk)
      expect(weekSessions.length).toBe(5)
    }
  })

  it('every week covers all 5 skill areas', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '<60', 'break100', 1, DRILL_SEEDS)
    for (const wk of [1, 2, 3, 4]) {
      const skills = new Set(
        block.sessions.filter((s) => s.weekNumber === wk).map((s) => s.primarySkill),
      )
      expect(skills.size).toBe(5)
    }
  })

  it('sets the correct blockNumber', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 3, DRILL_SEEDS)
    expect(block.blockNumber).toBe(3)
  })

  it('starts with llmSummary = null', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    expect(block.llmSummary).toBeNull()
  })

  it('includes skill priorities in output', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    expect(block.skillPriorities).toBe(MOCK_PRIORITIES)
  })

  it('sessions have sequential sessionNumbers starting at 1', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    const numbers = block.sessions.map((s) => s.sessionNumber)
    expect(numbers[0]).toBe(1)
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBe(numbers[i - 1] + 1)
    }
  })

  it('all sessions have valid weekNumber (1–4)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '240+', 'break80', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect([1, 2, 3, 4]).toContain(s.weekNumber)
    }
  })

  it('each session has a primarySkill matching a known skill area', () => {
    const validSkills = ['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(validSkills).toContain(s.primarySkill)
    }
  })

  it('each session has a positive durationMinutes', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '<60', 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.durationMinutes).toBeGreaterThan(0)
    }
  })

  it('week 3 (peak) has more total time than week 1 (foundation)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '90-150', 'break90', 1, DRILL_SEEDS)
    const week1Time = block.sessions
      .filter((s) => s.weekNumber === 1)
      .reduce((sum, s) => sum + s.durationMinutes, 0)
    const week3Time = block.sessions
      .filter((s) => s.weekNumber === 3)
      .reduce((sum, s) => sum + s.durationMinutes, 0)
    expect(week3Time).toBeGreaterThan(week1Time)
  })

  it('highest-priority skill gets the most time each week', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '240+', 'break100', 1, DRILL_SEEDS)
    for (const wk of [1, 2, 3, 4]) {
      const weekSessions = block.sessions.filter((s) => s.weekNumber === wk)
      const puttingSession = weekSessions.find((s) => s.primarySkill === 'putting')!
      for (const s of weekSessions) {
        expect(puttingSession.durationMinutes).toBeGreaterThanOrEqual(s.durationMinutes)
      }
    }
  })

  it('equal priorities produce nearly equal durations within each week (±1 min rounding)', () => {
    const block = generateBlockStructure(EQUAL_PRIORITIES, '90-150', 'break100', 1, DRILL_SEEDS)
    for (const wk of [1, 2, 3, 4]) {
      const durations = block.sessions
        .filter((s) => s.weekNumber === wk)
        .map((s) => s.durationMinutes)
      const min = Math.min(...durations)
      const max = Math.max(...durations)
      expect(max - min).toBeLessThanOrEqual(1)
    }
  })

  it('sessions have drills array with DrillAllocation shape', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(Array.isArray(s.drills)).toBe(true)
      for (const d of s.drills) {
        expect(d).toHaveProperty('drillId')
        expect(d).toHaveProperty('durationOverride')
        expect(d).toHaveProperty('shotCountOverride')
      }
    }
  })

  it('scales drills when session budget is smaller than shortest drill', () => {
    // <60 budget, week 1 (0.6 multiplier) = 27 min total / 5 skills = ~5 min per session
    const block = generateBlockStructure(MOCK_PRIORITIES, '<60', 'break100', 1, DRILL_SEEDS)
    const smallSessions = block.sessions.filter((s) => s.durationMinutes < 10)
    for (const s of smallSessions) {
      // At least one drill should have scaling overrides
      const scaledDrills = s.drills.filter((d) => d.shotCountOverride !== null)
      expect(scaledDrills.length).toBeGreaterThan(0)
      for (const d of scaledDrills) {
        expect(d.durationOverride).toBeGreaterThan(0)
        expect(d.shotCountOverride).toBeGreaterThan(0)
      }
    }
  })

  it('does not scale drills when session budget exceeds all drill durations', () => {
    // Equal priorities with 240+ budget: 300 min / 5 = 60 min per skill even at week 1 (0.6)
    // That's 36 min each — all drills are ≤30 min, so at least the first drill should never be scaled
    const block = generateBlockStructure(EQUAL_PRIORITIES, '240+', 'break100', 1, DRILL_SEEDS)
    const week3Sessions = block.sessions.filter((s) => s.weekNumber === 3)
    for (const s of week3Sessions) {
      // First drill should always fit without scaling
      expect(s.drills[0].durationOverride).toBeNull()
      expect(s.drills[0].shotCountOverride).toBeNull()
    }
  })
})

describe('buildTemplateSummary', () => {
  it('returns a non-empty string', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    const summary = buildTemplateSummary(block)
    expect(typeof summary).toBe('string')
    expect(summary.length).toBeGreaterThan(0)
  })

  it('mentions all 4 weeks', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    const summary = buildTemplateSummary(block)
    expect(summary).toContain('Week 1')
    expect(summary).toContain('Week 2')
    expect(summary).toContain('Week 3')
    expect(summary).toContain('Week 4')
  })
})
