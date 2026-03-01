import { useQuery } from '@tanstack/react-query'
import { getActiveTrainingBlock } from '@/repositories/trainingBlocksRepo'

export function useActiveTrainingBlock(userId: string | null) {
  return useQuery({
    queryKey: ['active-block', userId],
    queryFn: () => getActiveTrainingBlock(userId!),
    enabled: userId != null,
  })
}
