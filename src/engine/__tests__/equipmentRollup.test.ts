import { rollupEquipment } from '../equipmentRollup'

describe('rollupEquipment', () => {
  it('returns empty array for no drills', () => {
    expect(rollupEquipment([])).toEqual([])
  })

  it('returns empty array when all drills have empty equipment', () => {
    expect(rollupEquipment([{ equipment: [] }, { equipment: [] }])).toEqual([])
  })

  it('returns sorted equipment for a single drill', () => {
    expect(rollupEquipment([{ equipment: ['towel', 'alignment sticks'] }])).toEqual([
      'alignment sticks',
      'towel',
    ])
  })

  it('dedupes equipment across multiple drills', () => {
    const result = rollupEquipment([
      { equipment: ['practice green', 'tees (for gate)'] },
      { equipment: ['practice green', 'tees (3-ft circle markers)'] },
    ])
    expect(result).toEqual([
      'practice green',
      'tees (3-ft circle markers)',
      'tees (for gate)',
    ])
  })

  it('handles missing equipment field gracefully', () => {
    const drills = [
      { equipment: ['towel'] },
      { equipment: undefined as unknown as string[] },
    ]
    expect(rollupEquipment(drills)).toEqual(['towel'])
  })
})
