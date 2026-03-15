import Purchases, { type CustomerInfo } from 'react-native-purchases'
import Constants from 'expo-constants'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'

const ENTITLEMENT_ID = 'premium'

const isExpoGo = Constants.appOwnership === 'expo'

/** Tracks whether Purchases.configure() was called successfully. */
let isConfigured = false

export function isRevenueCatConfigured(): boolean {
  return isConfigured
}

export async function initRevenueCat(): Promise<void> {
  if (isExpoGo) {
    console.warn('[RevenueCat] Skipping init — not supported in Expo Go')
    return
  }
  const apiKey = process.env.EXPO_PUBLIC_RC_APPLE_API_KEY
  if (!apiKey || apiKey.startsWith('appl_XXXX')) {
    console.warn('[RevenueCat] No valid API key — skipping init')
    return
  }
  try {
    Purchases.configure({ apiKey })
    isConfigured = true
  } catch (e) {
    console.warn('[RevenueCat] configure failed:', e)
  }
}

export async function identifyUser(userId: string): Promise<void> {
  if (!isConfigured) return
  try {
    await Purchases.logIn(userId)
  } catch (e) {
    console.warn('[RevenueCat] identifyUser failed:', e)
  }
}

export async function checkEntitlement(): Promise<boolean> {
  if (!isConfigured) return false
  try {
    const info = await Purchases.getCustomerInfo()
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch {
    return false
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isConfigured) return false
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
  if (!isConfigured) return () => {}
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
  if (!isConfigured) return
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
