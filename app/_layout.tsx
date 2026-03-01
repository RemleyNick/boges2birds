import '../global.css'

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
import { ActivityIndicator, View } from 'react-native'
import { Stack } from 'expo-router'

import { runMigrations } from '@/db/migrate'
import { seedSystemDrills } from '@/db/seedDrills'
import { getOrCreateGuestUser } from '@/repositories/usersRepo'
import { useUserStore } from '@/store/userStore'

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)
  const queryClient = useRef(new QueryClient()).current

  useEffect(() => {
    async function initDb() {
      await runMigrations()
      await seedSystemDrills()
      const userId = await getOrCreateGuestUser()
      useUserStore.getState().setUserId(userId)
      setDbReady(true)
    }

    initDb().catch((e) => {
      console.error('[db] Init failed:', e)
      setDbReady(true)
    })
  }, [])

  if (!dbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator color="#2E7D32" />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  )
}
