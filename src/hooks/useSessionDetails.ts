import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeSession,
  getSessionWithDrills,
  toggleDrillComplete,
  type SessionWithDrills,
} from '@/repositories/sessionsRepo'

export function useSessionDetails(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSessionWithDrills(sessionId),
  })
}

export function useToggleDrill(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionDrillId, completed }: { sessionDrillId: string; completed: boolean }) =>
      toggleDrillComplete(sessionDrillId, completed),
    onMutate: async ({ sessionDrillId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['session', sessionId] })

      const previous = queryClient.getQueryData<SessionWithDrills | null>(['session', sessionId])

      queryClient.setQueryData<SessionWithDrills | null>(['session', sessionId], (old) => {
        if (!old) return old
        return {
          ...old,
          drills: old.drills.map((d) =>
            d.id === sessionDrillId ? { ...d, completed } : d,
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['session', sessionId], context.previous)
      }
    },
  })
}

export function useCompleteSession(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['active-block'] })
    },
  })
}
