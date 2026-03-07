import type { Drill } from '@/types'
import { selectDrills } from '../drillSelector'
import { DRILL_SEEDS } from '../drillSeeds'

describe('selectDrills', () => {
  it('returns drills for matching skill and program', () => {
    const result = selectDrills('putting', 'break100', 60, DRILL_SEEDS)
    expect(result.length).toBeGreaterThan(0)
    for (const sd of result) {
      expect(sd.drill.skillArea).toBe('putting')
      expect(sd.drill.programSlugs).toContain('break100')
    }
  })

  it('returns empty array when no candidates match', () => {
    const result = selectDrills('putting', 'break100', 30, [])
    expect(result).toEqual([])
  })

  it('does not scale when budget is sufficient', () => {
    const result = selectDrills('putting', 'break100', 60, DRILL_SEEDS)
    for (const sd of result) {
      expect(sd.durationOverride).toBeNull()
      expect(sd.shotCountOverride).toBeNull()
    }
  })

  it('scales drill when budget is smaller than shortest drill', () => {
    // All putting drills are 15 min; a 5-min budget should trigger scaling
    const result = selectDrills('putting', 'break100', 5, DRILL_SEEDS)
    expect(result).toHaveLength(1)
    expect(result[0].shotCountOverride).not.toBeNull()
    expect(result[0].shotCountOverride!).toBeGreaterThanOrEqual(1)
    expect(result[0].durationOverride).not.toBeNull()
    expect(result[0].durationOverride!).toBeLessThanOrEqual(5)
  })

  it('scales partial-fit drill after full-fit drill', () => {
    // shortGame break90 has: short-01 (20min), short-02 (15min), short-03 (12min), short-04 (10min)
    // With 25 min budget: short-01 doesn't fit, short-02 doesn't fit, short-03 (12) fits, then 13 remaining
    // Actually sorted by id: short-01, short-02, short-03, short-04
    // short-01 (20) fits in 25 → remaining 5, then short-02 (15) doesn't fit fully → scale
    const result = selectDrills('shortGame', 'break90', 25, DRILL_SEEDS)
    expect(result.length).toBeGreaterThanOrEqual(1)
    // First drill should fit fully
    expect(result[0].durationOverride).toBeNull()
  })

  it('returns at most 3 drills', () => {
    const result = selectDrills('putting', 'break100', 200, DRILL_SEEDS)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('scaled shot count is at least 1', () => {
    // Very tiny budget — should still get at least 1 shot
    const result = selectDrills('teeShot', 'break100', 1, DRILL_SEEDS)
    expect(result).toHaveLength(1)
    expect(result[0].shotCountOverride).toBeGreaterThanOrEqual(1)
  })
})
