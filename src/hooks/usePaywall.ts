import { useQueryClient } from '@tanstack/react-query'
import Purchases from 'react-native-purchases'
import RevenueCatUI from 'react-native-purchases-ui'

import { useUserStore } from '@/store/userStore'
import { isRevenueCatConfigured } from '@/services/subscriptions'

const DEV_PREMIUM = __DEV__ && process.env.EXPO_PUBLIC_FORCE_PREMIUM === 'true'

export function usePaywall(): { showPaywall: () => Promise<boolean> } {
  const queryClient = useQueryClient()
  const userId = useUserStore((s) => s.userId)

  async function showPaywall(): Promise<boolean> {
    if (DEV_PREMIUM) return true
    if (!isRevenueCatConfigured()) return false

    try {
      // Skip if no offerings are available (products not yet linked in App Store Connect)
      const offerings = await Purchases.getOfferings()
      if (!offerings.current) return false

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
