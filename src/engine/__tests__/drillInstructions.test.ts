import { resolveInstructions } from '../drillInstructions'
import { DRILL_SEEDS } from '../drillSeeds'
import type { Drill } from '@/types'

function getDrill(id: string): Drill {
  const drill = DRILL_SEEDS.find((d) => d.id === id)
  if (!drill) throw new Error(`Drill ${id} not found`)
  return drill
}

describe('resolveInstructions', () => {
  it('returns original text when override is null', () => {
    const drill = getDrill('drive-01')
    expect(resolveInstructions(drill, null)).toBe(drill.instructions)
  })

  it('returns original text when override equals original shotCount', () => {
    const drill = getDrill('drive-01')
    expect(resolveInstructions(drill, drill.shotCount)).toBe(drill.instructions)
  })

  // ─── Simple drills ───────────────────────────────────────────────────
  it('simple drill: interpolates scaled shot count', () => {
    const drill = getDrill('drive-01') // shotCount 10
    const result = resolveInstructions(drill, 5)
    expect(result).toContain('Hit 5 drives')
    expect(result).not.toContain('Hit 10 drives')
  })

  it('simple drill: iron-01 scales correctly', () => {
    const drill = getDrill('iron-01') // shotCount 16
    const result = resolveInstructions(drill, 8)
    expect(result).toContain('Hit 8 iron shots')
  })

  it('simple drill: putt-01 scales correctly', () => {
    const drill = getDrill('putt-01') // shotCount 20
    const result = resolveInstructions(drill, 10)
    expect(result).toContain('10 putts')
  })

  it('simple drill: mgmt-01 scales correctly', () => {
    const drill = getDrill('mgmt-01') // shotCount 10
    const result = resolveInstructions(drill, 6)
    expect(result).toContain('simulate 6 tee shots')
  })

  // ─── Ratio drills ────────────────────────────────────────────────────
  it('ratio drill: drive-02 (70%) computes proportional target', () => {
    const drill = getDrill('drive-02') // shotCount 10, target 7
    const result = resolveInstructions(drill, 6)
    // Math.round(6 * 0.7) = 4
    expect(result).toContain('hit 4 of 6')
  })

  it('ratio drill: drive-03 (67%) computes proportional target', () => {
    const drill = getDrill('drive-03') // shotCount 12, target 8
    const result = resolveInstructions(drill, 9)
    // Math.round(9 * 0.67) = 6
    expect(result).toContain('Aim for 6/9')
  })

  it('ratio drill: mgmt-03 (70%) computes proportional target', () => {
    const drill = getDrill('mgmt-03') // shotCount 10, target 7
    const result = resolveInstructions(drill, 5)
    // Math.round(5 * 0.7) = 4 (actually 3.5 → 4)
    expect(result).toContain('4/5 times')
  })

  // ─── Sub-group drills ────────────────────────────────────────────────
  it('sub-group drill: drive-04 (3 tee heights)', () => {
    const drill = getDrill('drive-04') // shotCount 12, 4 each
    const result = resolveInstructions(drill, 6)
    // Math.floor(6 / 3) = 2
    expect(result).toContain('Hit 2 balls each')
  })

  it('sub-group drill: iron-04 (4 distances)', () => {
    const drill = getDrill('iron-04') // shotCount 12, 3 each
    const result = resolveInstructions(drill, 8)
    // Math.floor(8 / 4) = 2
    expect(result).toContain('Hit 2 balls at each distance')
    expect(result).toContain('8 total shots')
  })

  it('sub-group drill: short-01 (n/2 spots)', () => {
    const drill = getDrill('short-01') // shotCount 20, 10 spots
    const result = resolveInstructions(drill, 8)
    // Math.floor(8 / 2) = 4
    expect(result).toContain('From 4 different spots')
  })

  it('sub-group drill: short-03 (4 targets)', () => {
    const drill = getDrill('short-03') // shotCount 12, 3 each
    const result = resolveInstructions(drill, 8)
    // Math.floor(8 / 4) = 2
    expect(result).toContain('Hit 2 shots to each')
  })

  it('sub-group drill: putt-03 (4 distances)', () => {
    const drill = getDrill('putt-03') // shotCount 20, 5 each
    const result = resolveInstructions(drill, 12)
    // Math.floor(12 / 4) = 3
    expect(result).toContain('hit 3 putts each')
    expect(result).toContain('12 putts total')
  })

  // ─── Special split drills ────────────────────────────────────────────
  it('special: putt-04 (n/2 reads × 2)', () => {
    const drill = getDrill('putt-04') // shotCount 20, 10 reads
    const result = resolveInstructions(drill, 10)
    // Math.floor(10 / 2) = 5
    expect(result).toContain('Choose 5 putts')
    expect(result).toContain('10 putts total')
    expect(result).toContain('5 reads × 2 attempts')
  })

  it('special: putt-05 (thirds split)', () => {
    const drill = getDrill('putt-05') // shotCount 20
    const result = resolveInstructions(drill, 12)
    // third = Math.floor(12 / 3) = 4, remainder = 12 - 8 = 4
    expect(result).toContain('Putt 4 balls')
    expect(result).toContain('Then 4 with trail')
    expect(result).toContain('Then 4 normal')
    expect(result).toContain('12 putts total')
  })

  // ─── Edge cases ──────────────────────────────────────────────────────
  it('edge: shotCountOverride = 1 on simple drill', () => {
    const drill = getDrill('drive-01')
    const result = resolveInstructions(drill, 1)
    expect(result).toContain('Hit 1 drives')
  })

  it('edge: shotCountOverride = 1 on sub-group drill (floor to 1 per group)', () => {
    const drill = getDrill('iron-04') // 4 groups
    const result = resolveInstructions(drill, 1)
    // Math.max(1, Math.floor(1 / 4)) = 1
    expect(result).toContain('Hit 1 balls at each distance')
  })

  it('edge: shotCountOverride = 1 on ratio drill', () => {
    const drill = getDrill('drive-02')
    const result = resolveInstructions(drill, 1)
    // Math.round(1 * 0.7) = 1
    expect(result).toContain('hit 1 of 1')
  })

  // ─── All 25 drills have templates ────────────────────────────────────
  it('every seed drill produces different text when shot count changes', () => {
    for (const drill of DRILL_SEEDS) {
      const scaled = resolveInstructions(drill, drill.shotCount - 1)
      // With a different count, the template should produce different text
      expect(scaled).not.toBe(drill.instructions)
    }
  })
})
