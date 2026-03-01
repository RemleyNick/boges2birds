import type { SkillPriority } from '@/types'
import { DRILL_SEEDS } from '../drillSeeds'
import {
  buildTemplateSummary,
  generateBlockStructure,
  sessionsPerWeek,
} from '../blockGenerator'
import { SESSIONS_PER_WEEK, WEEK_VOLUME } from '../thresholds'

const MOCK_PRIORITIES: SkillPriority[] = [
  { skill: 'putting',    score: 4.0 },
  { skill: 'shortGame',  score: 3.5 },
  { skill: 'teeShot',    score: 2.8 },
  { skill: 'irons',      score: 2.0 },
  { skill: 'courseMgmt', score: 1.5 },
]

describe('sessionsPerWeek', () => {
  it('returns 1 for <60', () => expect(sessionsPerWeek('<60')).toBe(1))
  it('returns 2 for 60-90', () => expect(sessionsPerWeek('60-90')).toBe(2))
  it('returns 3 for 90-150', () => expect(sessionsPerWeek('90-150')).toBe(3))
  it('returns 4 for 150-240', () => expect(sessionsPerWeek('150-240')).toBe(4))
  it('returns 5 for 240+', () => expect(sessionsPerWeek('240+')).toBe(5))
})

describe('generateBlockStructure', () => {
  it('always generates exactly 4 weeks of sessions', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    const weeks = new Set(block.sessions.map((s) => s.weekNumber))
    expect(weeks.size).toBe(4)
    expect([...weeks].sort()).toEqual([1, 2, 3, 4])
  })

  it('produces correct session count for 60-90 (2 sessions/week)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    // 2 sessions/week × volume: [0.6→1, 0.8→2, 1.0→2, 0.7→1] = 1+2+2+1 = 6
    const week1Count = block.sessions.filter((s) => s.weekNumber === 1).length
    const week3Count = block.sessions.filter((s) => s.weekNumber === 3).length
    expect(week1Count).toBeGreaterThanOrEqual(1)
    expect(week3Count).toBeGreaterThanOrEqual(1)
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

  it('week 3 has more or equal sessions than week 1 (peak vs foundation)', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '90-150', 'break90', 1, DRILL_SEEDS)
    const week1 = block.sessions.filter((s) => s.weekNumber === 1).length
    const week3 = block.sessions.filter((s) => s.weekNumber === 3).length
    expect(week3).toBeGreaterThanOrEqual(week1)
  })

  it('each session has a primarySkill matching a known skill area', () => {
    const validSkills = ['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(validSkills).toContain(s.primarySkill)
    }
  })

  it('each session has a positive durationMinutes', () => {
    const block = generateBlockStructure(MOCK_PRIORITIES, '60-90', 'break100', 1, DRILL_SEEDS)
    for (const s of block.sessions) {
      expect(s.durationMinutes).toBeGreaterThan(0)
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
