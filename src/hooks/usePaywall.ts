import { useQueryClient } from '@tanstack/react-query'
import RevenueCatUI from 'react-native-purchases-ui'

import { useUserStore } from '@/store/userStore'

const DEV_PREMIUM = __DEV__ && process.env.EXPO_PUBLIC_FORCE_PREMIUM === 'true'

export function usePaywall(): { showPaywall: () => Promise<boolean> } {
  const queryClient = useQueryClient()
  const userId = useUserStore((s) => s.userId)

  async function showPaywall(): Promise<boolean> {
    if (DEV_PREMIUM) return true

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'premium',
      })

      // PURCHASED = user bought, RESTORED = user restored
      const purchased =
        result === 'PURCHASED' || result === 'RESTORED'

      if (purchased) {
        queryClient.invalidateQueries({ queryKey: ['entitlement', userId] })
      }

      return purchased
    } catch (e) {
      // Graceful fallback for Expo Go / missing native module
      console.warn('[Paywall] presentPaywall failed:', e)
      return false
    }
  }

  return { showPaywall }
}
