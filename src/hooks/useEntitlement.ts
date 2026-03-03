import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useUserStore } from '@/store/userStore'
import {
  checkEntitlement,
  listenForUpdates,
  syncSubscriptionToDb,
} from '@/services/subscriptions'

// In development, set EXPO_PUBLIC_FORCE_PREMIUM=true in .env to bypass the paywall
const DEV_PREMIUM = __DEV__ && process.env.EXPO_PUBLIC_FORCE_PREMIUM === 'true'

export function useEntitlement(): { isPremium: boolean; isLoading: boolean } {
  const userId = useUserStore((s) => s.userId)
  const queryClient = useQueryClient()

  const { data: isPremium = false, isLoading } = useQuery({
    queryKey: ['entitlement', userId],
    queryFn: checkEntitlement,
    enabled: !!userId && !DEV_PREMIUM,
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

  if (DEV_PREMIUM) return { isPremium: true, isLoading: false }

  // Safe default — never accidentally grant access while loading
  return { isPremium: isLoading ? false : isPremium, isLoading }
}
