import { useQuery } from '@tanstack/react-query'
import { getAllDrills } from '@/repositories/drillsRepo'

export function useDrills() {
  return useQuery({
    queryKey: ['drills'],
    queryFn: getAllDrills,
    staleTime: Infinity,
  })
}
