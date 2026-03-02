import Purchases, { type CustomerInfo } from 'react-native-purchases'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'

const ENTITLEMENT_ID = 'premium'

export async function initRevenueCat(): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_RC_APPLE_API_KEY
  if (!apiKey) {
    console.warn('[RevenueCat] No API key found — skipping init')
    return
  }
  Purchases.configure({ apiKey })
}

export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId)
  } catch (e) {
    console.warn('[RevenueCat] identifyUser failed:', e)
  }
}

export async function checkEntitlement(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo()
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch {
    return false
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases()
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch {
    return false
  }
}

export function listenForUpdates(
  onUpdate: (isPremium: boolean) => void,
): () => void {
  const listener = (info: CustomerInfo) => {
    const isPremium = info.entitlements.active[ENTITLEMENT_ID] !== undefined
    onUpdate(isPremium)
  }
  Purchases.addCustomerInfoUpdateListener(listener)
  return () => Purchases.removeCustomerInfoUpdateListener(listener)
}

export async function syncSubscriptionToDb(
  userId: string,
  isPremium: boolean,
): Promise<void> {
  try {
    const info = await Purchases.getCustomerInfo()
    const expiration =
      info.entitlements.active[ENTITLEMENT_ID]?.expirationDate
    await db
      .update(users)
      .set({
        subscriptionStatus: isPremium ? 'active' : 'free',
        subscriptionExpiresAt: expiration ? new Date(expiration) : null,
        revenuecatCustomerId: info.originalAppUserId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
  } catch (e) {
    console.warn('[RevenueCat] syncSubscriptionToDb failed:', e)
  }
}
