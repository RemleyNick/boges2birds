import type { SessionConfig, SessionsPerWeek, SkillArea, SkillPriority } from '@/types'
import {
  FOCUSED_GROUPINGS,
  computeAutoGroupings,
  computeMixedGroupings,
  getSessionGroupings,
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

  it('4 sessions: highest-priority skill gets its own session', () => {
    const grouping = computeAutoGroupings(4, MOCK_PRIORITIES)
    // putting (highest score) should be solo
    const puttingSession = grouping.find(
      (g) => g.length === 1 && g[0] === 'putting',
    )
    expect(puttingSession).toBeDefined()
  })

  it('3 sessions: top skill gets dedicated session', () => {
    const grouping = computeAutoGroupings(3, MOCK_PRIORITIES)
    const topSession = grouping.find(
      (g) => g.length === 1 && g[0] === 'putting',
    )
    expect(topSession).toBeDefined()
  })

  it('1 session: all skills in one group', () => {
    const grouping = computeAutoGroupings(1, MOCK_PRIORITIES)
    expect(grouping).toHaveLength(1)
    expect(grouping[0]).toHaveLength(5)
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
