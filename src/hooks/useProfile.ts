import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getUser,
  getLatestAssessment,
  getActiveUserProgram,
  updateDisplayName,
  updateSessionConfig,
} from '@/repositories/profileRepo'
import type { SessionConfig } from '@/types'

export function useUser(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId!),
    enabled: userId != null,
  })
}

export function useLatestAssessment(userId: string | null) {
  return useQuery({
    queryKey: ['latest-assessment', userId],
    queryFn: () => getLatestAssessment(userId!),
    enabled: userId != null,
  })
}

export function useActiveProgram(userId: string | null) {
  return useQuery({
    queryKey: ['active-program', userId],
    queryFn: () => getActiveUserProgram(userId!),
    enabled: userId != null,
  })
}

export function useUpdateDisplayName(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => updateDisplayName(userId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
    },
  })
}

export function useUpdateSessionConfig(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: SessionConfig) => updateSessionConfig(userId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-assessment', userId] })
      queryClient.invalidateQueries({ queryKey: ['active-block', userId] })
    },
  })
}
