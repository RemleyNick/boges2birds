import '../global.css'

import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
})

// Polyfill crypto.randomUUID for Expo Go / Hermes environments that don't expose it globally
import * as ExpoCrypto from 'expo-crypto'
if (typeof (globalThis as any).crypto?.randomUUID !== 'function') {
  ;(globalThis as any).crypto = {
    ...((globalThis as any).crypto ?? {}),
    randomUUID: () => ExpoCrypto.randomUUID(),
  }
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, View } from 'react-native'
import { Stack } from 'expo-router'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { runMigrations } from '@/db/migrate'
import { seedSystemDrills } from '@/db/seedDrills'
import { getOrCreateGuestUser, getOrCreateAuthUser } from '@/repositories/usersRepo'
import { getSession, onAuthStateChange } from '@/services/auth'
import { initRevenueCat, identifyUser } from '@/services/subscriptions'
import { syncToSupabase } from '@/services/sync'
import { useUserStore } from '@/store/userStore'

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)
  const queryClient = useRef(new QueryClient()).current

  useEffect(() => {
    async function init() {
      // 1. DB setup (unchanged)
      await runMigrations()
      await seedSystemDrills()

      // 2. Check for existing Supabase session
      const { data: sessionData } = await getSession()
      const session = sessionData.session

      if (session?.user) {
        // Returning auth user
        const userId = await getOrCreateAuthUser(session.user.id, session.user.email!)
        useUserStore.getState().setUserId(userId)
        useUserStore.getState().setIsGuest(false)
      } else {
        // No session — guest mode
        const userId = await getOrCreateGuestUser()
        useUserStore.getState().setUserId(userId)
        useUserStore.getState().setIsGuest(true)
      }

      // 3. Initialize RevenueCat + identify user
      await initRevenueCat()
      await identifyUser(useUserStore.getState().userId!)

      useUserStore.getState().setAuthReady(true)
      setDbReady(true)
    }

    init().catch((e) => {
      console.error('[init] Failed:', e)
      setDbReady(true)
    })
  }, [])

  // Listen for runtime auth state changes (sign-out triggers new guest)
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        const userId = await getOrCreateGuestUser()
        useUserStore.getState().setUserId(userId)
        useUserStore.getState().setIsGuest(true)
        await identifyUser(userId)
        queryClient.invalidateQueries()
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  // Sync to Supabase on cold start and whenever the app returns to foreground
  useEffect(() => {
    if (!dbReady) return

    // Cold start sync
    syncToSupabase().catch((e) => console.warn('[sync] Failed:', e))

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncToSupabase().catch((e) => console.warn('[sync] Failed:', e))
      }
    })

    return () => sub.remove()
  }, [dbReady])

  if (!dbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator color="#2E7D32" />
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="practice/[sessionId]" />
        </Stack>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
