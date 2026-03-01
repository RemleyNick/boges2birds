import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRoundLogsForUser,
  saveRoundLog,
  type SaveRoundLogInput,
} from '@/repositories/roundLogsRepo'

export function useRoundLogs(userId: string | null) {
  return useQuery({
    queryKey: ['round-logs', userId],
    queryFn: () => getRoundLogsForUser(userId!),
    enabled: userId != null,
  })
}

export function useSaveRoundLog(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveRoundLogInput) => saveRoundLog(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round-logs'] })
    },
  })
}
