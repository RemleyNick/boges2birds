import { Alert } from 'react-native'
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

    if (!isRevenueCatConfigured()) {
      Alert.alert(
        'Purchases Unavailable',
        'In-app purchases are not available on this device. Please try again from a production build.',
      )
      return false
    }

    try {
      const offerings = await Purchases.getOfferings()

      if (!offerings.current) {
        Alert.alert(
          'Unable to Load',
          'Subscription options could not be loaded. Please check your connection and try again.',
        )
        return false
      }

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'premium',
      })

      const purchased =
        result === 'PURCHASED' || result === 'RESTORED'

      if (purchased) {
        queryClient.invalidateQueries({ queryKey: ['entitlement', userId] })
      }

      return purchased
    } catch (e) {
      console.warn('[Paywall] presentPaywall failed:', e)
      Alert.alert(
        'Something Went Wrong',
        'We couldn\u2019t open the upgrade screen. Please try again later.',
      )
      return false
    }
  }

  return { showPaywall }
}
