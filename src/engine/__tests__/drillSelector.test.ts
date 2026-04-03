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

  it('distributes time evenly across drills', () => {
    // shortGame break90, 25 min budget: numDrills = min(3, candidates, floor(25/5)=5) = 3
    // Even split: 8 + 1 remainder = 9 min for first, 8 min each for rest
    // All natural durations (20, 15, 12) exceed 9/8 min → all drills are scaled
    const result = selectDrills('shortGame', 'break90', 25, DRILL_SEEDS)
    expect(result).toHaveLength(3)
    // All drills should be scaled (allocated < natural duration)
    for (const sd of result) {
      expect(sd.durationOverride).not.toBeNull()
    }
    // Total allocated time should equal session budget
    const total = result.reduce((sum, sd) => sum + sd.durationOverride!, 0)
    expect(total).toBe(25)
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

  it('splits time evenly so no drill gets a tiny sliver', () => {
    // Regression: 21-min short_game previously produced 20 min + 1 min split
    const result = selectDrills('shortGame', 'break100', 21, DRILL_SEEDS)
    expect(result.length).toBeGreaterThan(1)
    for (const sd of result) {
      const dur = sd.durationOverride ?? sd.drill.durationMinutes
      expect(dur).toBeGreaterThanOrEqual(5)
    }
    // No drill should receive more than 3× the time of the shortest
    const durations = result.map((sd) => sd.durationOverride ?? sd.drill.durationMinutes)
    const maxDur = Math.max(...durations)
    const minDur = Math.min(...durations)
    expect(maxDur / minDur).toBeLessThan(3)
  })
})
