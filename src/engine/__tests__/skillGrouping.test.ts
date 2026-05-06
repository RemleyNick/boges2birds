import type { SessionConfig, SessionsPerWeek, SkillArea, SkillPriority } from '@/types'
import {
  FOCUSED_GROUPINGS,
  computeAutoGroupings,
  computeMixedGroupings,
  getSessionGroupings,
  getSessionLabel,
} from '../skillGrouping'

const ALL_SKILLS: SkillArea[] = ['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt']

const MOCK_PRIORITIES: SkillPriority[] = [
  { skill: 'putting',    score: 4.0 },
  { skill: 'shortGame',  score: 3.5 },
  { skill: 'teeShot',    score: 2.8 },
  { skill: 'irons',      score: 2.0 },
  { skill: 'courseMgmt', score: 1.5 },
]

describe('FOCUSED_GROUPINGS', () => {
  it.each([1, 2, 3, 4] as SessionsPerWeek[])('covers all 5 skills for %i sessions/week', (n) => {
    const grouping = FOCUSED_GROUPINGS[n]
    expect(grouping).toHaveLength(n)
    const allSkillsInGrouping = grouping.flat()
    expect(allSkillsInGrouping.sort()).toEqual([...ALL_SKILLS].sort())
  })

  it('2 sessions: groups range and short game separately', () => {
    const [session1, session2] = FOCUSED_GROUPINGS[2]
    expect(session1).toContain('teeShot')
    expect(session1).toContain('irons')
    expect(session2).toContain('shortGame')
    expect(session2).toContain('putting')
  })

  it('4 sessions: short game and putting share a session', () => {
    const grouping = FOCUSED_GROUPINGS[4]
    const sgPuttingSession = grouping.find(
      (g) => g.includes('shortGame') && g.includes('putting'),
    )
    expect(sgPuttingSession).toBeDefined()
  })
})

describe('computeAutoGroupings', () => {
  it.each([1, 2, 3, 4] as SessionsPerWeek[])('covers all 5 skills for %i sessions/week', (n) => {
    const grouping = computeAutoGroupings(n, MOCK_PRIORITIES)
    expect(grouping).toHaveLength(n)
    const allSkillsInGrouping = grouping.flat()
    expect(allSkillsInGrouping.sort()).toEqual([...ALL_SKILLS].sort())
  })

  it('uses same venue groupings as focused mode', () => {
    const grouping = computeAutoGroupings(2, MOCK_PRIORITIES)
    // Should have same group structure as focused: [range+courseMgmt, shortGame+putting]
    const rangeSession = grouping.find((g) => g.includes('teeShot') && g.includes('irons'))
    const sgSession = grouping.find((g) => g.includes('shortGame') && g.includes('putting'))
    expect(rangeSession).toBeDefined()
    expect(sgSession).toBeDefined()
  })

  it('reorders skills within groups by priority score', () => {
    // putting has highest score, but it's in the shortGame+putting group
    const grouping = computeAutoGroupings(2, MOCK_PRIORITIES)
    const sgSession = grouping.find((g) => g.includes('shortGame') && g.includes('putting'))!
    // putting (4.0) should come before shortGame (3.5)
    expect(sgSession[0]).toBe('putting')
  })

  it('1 session: all skills in one group sorted by priority', () => {
    const grouping = computeAutoGroupings(1, MOCK_PRIORITIES)
    expect(grouping).toHaveLength(1)
    expect(grouping[0]).toHaveLength(5)
    // Highest priority first
    expect(grouping[0][0]).toBe('putting')
  })
})

describe('getSessionLabel', () => {
  it('labels single skill sessions', () => {
    expect(getSessionLabel(['teeShot'])).toBe('Tee Shots')
    expect(getSessionLabel(['putting'])).toBe('Putting')
  })

  it('labels range sessions', () => {
    expect(getSessionLabel(['teeShot', 'irons'])).toBe('Driving Range')
    expect(getSessionLabel(['teeShot', 'irons', 'courseMgmt'])).toBe('Driving Range')
  })

  it('labels short game + putting', () => {
    expect(getSessionLabel(['shortGame', 'putting'])).toBe('Short Game + Putting')
  })

  it('labels full practice', () => {
    expect(getSessionLabel(['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt'])).toBe('Full Practice')
  })
})

describe('computeMixedGroupings', () => {
  it.each([1, 2, 3, 4] as SessionsPerWeek[])('returns %i groups, each with all 5 skills', (n) => {
    const grouping = computeMixedGroupings(n)
    expect(grouping).toHaveLength(n)
    for (const group of grouping) {
      expect(group.sort()).toEqual([...ALL_SKILLS].sort())
    }
  })
})

describe('getSessionGroupings', () => {
  it('dispatches to focused groupings', () => {
    const config: SessionConfig = { sessionsPerWeek: 2, sessionDuration: 60, structure: 'focused' }
    const result = getSessionGroupings(config, MOCK_PRIORITIES)
    expect(result).toEqual(FOCUSED_GROUPINGS[2])
  })

  it('dispatches to mixed groupings', () => {
    const config: SessionConfig = { sessionsPerWeek: 3, sessionDuration: 45, structure: 'mixed' }
    const result = getSessionGroupings(config, MOCK_PRIORITIES)
    expect(result).toHaveLength(3)
    for (const group of result) {
      expect(group).toHaveLength(5)
    }
  })

  it('dispatches to auto groupings', () => {
    const config: SessionConfig = { sessionsPerWeek: 4, sessionDuration: 60, structure: 'auto' }
    const result = getSessionGroupings(config, MOCK_PRIORITIES)
    expect(result).toHaveLength(4)
    expect(result.flat().sort()).toEqual([...ALL_SKILLS].sort())
  })
})
