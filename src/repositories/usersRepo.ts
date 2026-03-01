import AsyncStorage from '@react-native-async-storage/async-storage'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'

const GUEST_KEY = 'boges2birds:guestUserId'

export async function getOrCreateGuestUser(): Promise<string> {
  const stored = await AsyncStorage.getItem(GUEST_KEY)
  if (stored) {
    const existing = await db.select().from(users).where(eq(users.id, stored)).get()
    if (existing) return stored
  }
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(users).values({
    id,
    email: `guest-${id}@local`,
    subscriptionStatus: 'free',
    createdAt: now,
    updatedAt: now,
  })
  await AsyncStorage.setItem(GUEST_KEY, id)
  return id
}
