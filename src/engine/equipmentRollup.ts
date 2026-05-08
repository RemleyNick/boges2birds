import type { Drill } from '@/types'

export function rollupEquipment(drills: Pick<Drill, 'equipment'>[]): string[] {
  const seen = new Set<string>()
  for (const d of drills) {
    for (const item of d.equipment ?? []) {
      seen.add(item)
    }
  }
  return [...seen].sort()
}
