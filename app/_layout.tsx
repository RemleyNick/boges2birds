import '../global.css'

import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack } from 'expo-router'

import { runMigrations } from '@/db/migrate'
import { seedSystemDrills } from '@/db/seedDrills'

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    async function initDb() {
      await runMigrations()
      await seedSystemDrills()
      setDbReady(true)
    }

    initDb().catch((e) => {
      console.error('[db] Init failed:', e)
      // Prefer degraded state over a black screen
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
