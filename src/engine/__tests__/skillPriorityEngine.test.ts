import type { RoundStats, SkillRatings, SkillScore } from '@/types'
import {
  aggregateRoundScores,
  applyProgramMultipliers,
  blendScores,
  computeSkillPriorities,
  inferShortGameScore,
  rankSkills,
  selfRatingToScore,
  statToScore,
} from '../skillPriorityEngine'

describe('statToScore', () => {
  describe('fairway', () => {
    it('returns 4 for very low fairway %', () => {
      expect(statToScore(0.20, 'fairway')).toBe(4)
    })
    it('returns 3 for 35% fairways', () => {
      expect(statToScore(0.35, 'fairway')).toBe(3)
    })
    it('returns 2 for 50% fairways', () => {
      expect(statToScore(0.50, 'fairway')).toBe(2)
    })
    it('returns 1 for 70% fairways', () => {
      expect(statToScore(0.70, 'fairway')).toBe(1)
    })
  })

  describe('gir', () => {
    it('returns 4 for < 15% GIR', () => {
      expect(statToScore(0.10, 'gir')).toBe(4)
    })
    it('returns 1 for > 44% GIR', () => {
      expect(statToScore(0.50, 'gir')).toBe(1)
    })
  })

  describe('putts', () => {
    it('returns 4 for 2.3 putts/hole', () => {
      expect(statToScore(2.3, 'putts')).toBe(4)
    })
    it('returns 3 for 2.1 putts/hole', () => {
      expect(statToScore(2.1, 'putts')).toBe(3)
    })
    it('returns 1 for 1.7 putts/hole', () => {
      expect(statToScore(1.7, 'putts')).toBe(1)
    })
  })

  describe('penalties', () => {
    it('returns 4 for 6 penalties', () => {
      expect(statToScore(6, 'penalties')).toBe(4)
    })
    it('returns 1 for 0 penalties', () => {
      expect(statToScore(0, 'penalties')).toBe(1)
    })
  })
})

describe('selfRatingToScore', () => {
  it('rating 1 (solid) → score 4', () => {
    // self-rating: 1 = great, 5 = critical. Engine: 4 = critical, 1 = solid
    // selfRatingToScore(1) = 5 - 1 = 4
    expect(selfRatingToScore(1)).toBe(4)
  })

  it('rating 5 (solid) → score 1', () => {
    // selfRatingToScore(5) = 5 - 5 = 0, clamped to 1
    expect(selfRatingToScore(5)).toBe(1)
  })

  it('rating 3 → score 2', () => {
    expect(selfRatingToScore(3)).toBe(2)
  })
})

describe('blendScores', () => {
  it('weights stat 70% and self-rating 30%', () => {
    const result = blendScores(4, 2)
    expect(result).toBeCloseTo(4 * 0.7 + 2 * 0.3)
  })

  it('returns stat score when self-rating matches', () => {
    expect(blendScores(3, 3)).toBeCloseTo(3)
  })
})

describe('inferShortGameScore', () => {
  it('returns 4 when GIR is much worse than putting (gap >= 2)', () => {
    expect(inferShortGameScore(4, 1)).toBe(4)
  })

  it('returns 3 when gap is 1', () => {
    expect(inferShortGameScore(3, 2)).toBe(3)
  })

  it('returns average when gap is 0', () => {
    expect(inferShortGameScore(3, 3)).toBe(3)
  })
})

describe('aggregateRoundScores', () => {
  const sampleRound: RoundStats = {
    fairwaysHit: 4,
    fairwaysTotal: 14,
    girHit: 2,
    girTotal: 18,
    totalPutts: 36,
    holesPlayed: 18,
    penalties: 3,
  }

  it('returns empty object for no rounds', () => {
    expect(aggregateRoundScores([])).toEqual({})
  })

  it('returns skill scores for one round', () => {
    const result = aggregateRoundScores([sampleRound])
    expect(result.teeShot).toBeGreaterThanOrEqual(1)
    expect(result.teeShot).toBeLessThanOrEqual(4)
    expect(result.putting).toBeGreaterThanOrEqual(1)
  })

  it('only uses last 3 rounds when more are provided', () => {
    const manyRounds = Array(5).fill(sampleRound)
    const result = aggregateRoundScores(manyRounds)
    expect(result.teeShot).toBeDefined()
  })
})

describe('applyProgramMultipliers', () => {
  const baseScores: SkillScore = {
    teeShot: 2,
    irons: 2,
    shortGame: 2,
    putting: 2,
    courseMgmt: 2,
  }

  it('applies break100 putting multiplier of 1.3', () => {
    const result = applyProgramMultipliers(baseScores, 'break100')
    expect(result.putting).toBeCloseTo(2 * 1.3)
  })

  it('applies break80 courseMgmt multiplier of 1.4', () => {
    const result = applyProgramMultipliers(baseScores, 'break80')
    expect(result.courseMgmt).toBeCloseTo(2 * 1.4)
  })
})

describe('rankSkills', () => {
  it('sorts skills from highest to lowest score', () => {
    const scores: SkillScore = {
      teeShot: 1.5,
      irons: 3.2,
      shortGame: 2.0,
      putting: 4.0,
      courseMgmt: 1.0,
    }
    const ranked = rankSkills(scores)
    expect(ranked[0].skill).toBe('putting')
    expect(ranked[0].score).toBe(4.0)
    expect(ranked[ranked.length - 1].skill).toBe('courseMgmt')
  })

  it('returns all 5 skills', () => {
    const scores: SkillScore = {
      teeShot: 2, irons: 2, shortGame: 2, putting: 2, courseMgmt: 2,
    }
    expect(rankSkills(scores)).toHaveLength(5)
  })
})

describe('computeSkillPriorities', () => {
  const selfRatings: SkillRatings = {
    teeShot: 3,
    irons: 2,
    shortGame: 4,
    putting: 1,
    courseMgmt: 3,
  }

  it('returns 5 ranked skills with no round data', () => {
    const result = computeSkillPriorities([], selfRatings, 'break100')
    expect(result).toHaveLength(5)
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score)
  })

  it('first skill has highest score', () => {
    const result = computeSkillPriorities([], selfRatings, 'break90')
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score)
    }
  })

  it('returns 5 ranked skills with round data', () => {
    const round: RoundStats = {
      fairwaysHit: 3,
      fairwaysTotal: 14,
      girHit: 4,
      girTotal: 18,
      totalPutts: 38,
      holesPlayed: 18,
      penalties: 2,
    }
    const result = computeSkillPriorities([round], selfRatings, 'break80')
    expect(result).toHaveLength(5)
  })

  it('break100 putting is boosted (multiplier 1.3)', () => {
    const uniformRatings: SkillRatings = {
      teeShot: 3, irons: 3, shortGame: 3, putting: 3, courseMgmt: 3,
    }
    const result = computeSkillPriorities([], uniformRatings, 'break100')
    const puttingEntry = result.find((r) => r.skill === 'putting')!
    const ironsEntry = result.find((r) => r.skill === 'irons')!
    // Putting multiplier (1.3) > irons multiplier (1.0) so putting should rank higher
    expect(puttingEntry.score).toBeGreaterThan(ironsEntry.score)
  })
})
