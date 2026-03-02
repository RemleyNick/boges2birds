import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useUserStore } from '@/store/userStore'
import {
  checkEntitlement,
  listenForUpdates,
  syncSubscriptionToDb,
} from '@/services/subscriptions'

export function useEntitlement(): { isPremium: boolean; isLoading: boolean } {
  const userId = useUserStore((s) => s.userId)
  const queryClient = useQueryClient()

  const { data: isPremium = false, isLoading } = useQuery({
    queryKey: ['entitlement', userId],
    queryFn: checkEntitlement,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min
  })

  useEffect(() => {
    if (!userId) return

    const unsubscribe = listenForUpdates(async (premium) => {
      await syncSubscriptionToDb(userId, premium)
      queryClient.invalidateQueries({ queryKey: ['entitlement', userId] })
    })

    return unsubscribe
  }, [userId, queryClient])

  // Safe default — never accidentally grant access while loading
  return { isPremium: isLoading ? false : isPremium, isLoading }
}
