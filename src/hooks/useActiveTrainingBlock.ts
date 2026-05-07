import { useQuery } from '@tanstack/react-query'
import { getActiveTrainingBlock, getLatestBlock } from '@/repositories/trainingBlocksRepo'

export function useActiveTrainingBlock(userId: string | null) {
  return useQuery({
    queryKey: ['active-block', userId],
    queryFn: () => getActiveTrainingBlock(userId!),
    enabled: userId != null,
  })
}

export function useLatestBlock(userId: string | null) {
  return useQuery({
    queryKey: ['latest-block', userId],
    queryFn: () => getLatestBlock(userId!),
    enabled: userId != null,
  })
}
