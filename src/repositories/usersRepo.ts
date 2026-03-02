import AsyncStorage from '@react-native-async-storage/async-storage'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  users,
  skillAssessments,
  userPrograms,
  trainingBlocks,
  roundLogs,
} from '@/db/schema'

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

export async function getOrCreateAuthUser(
  supabaseUserId: string,
  email: string,
): Promise<string> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, supabaseUserId))
    .get()
  if (existing) return supabaseUserId

  const now = new Date()
  await db.insert(users).values({
    id: supabaseUserId,
    email,
    subscriptionStatus: 'free',
    createdAt: now,
    updatedAt: now,
  })
  return supabaseUserId
}

export async function migrateGuestToAuth(
  guestUserId: string,
  supabaseUserId: string,
  email: string,
): Promise<void> {
  const now = new Date()

  // Insert new user row with the Supabase ID
  await db.insert(users).values({
    id: supabaseUserId,
    email,
    subscriptionStatus: 'free',
    createdAt: now,
    updatedAt: now,
  })

  // Copy display name from guest row if present
  const guest = await db.select().from(users).where(eq(users.id, guestUserId)).get()
  if (guest?.displayName) {
    await db
      .update(users)
      .set({ displayName: guest.displayName, updatedAt: now })
      .where(eq(users.id, supabaseUserId))
  }

  // Re-point all child FKs from guest → auth user
  await db
    .update(skillAssessments)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(skillAssessments.userId, guestUserId))

  await db
    .update(userPrograms)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(userPrograms.userId, guestUserId))

  await db
    .update(trainingBlocks)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(trainingBlocks.userId, guestUserId))

  await db
    .update(roundLogs)
    .set({ userId: supabaseUserId, updatedAt: now })
    .where(eq(roundLogs.userId, guestUserId))

  // Delete old guest row
  await db.delete(users).where(eq(users.id, guestUserId))

  // Clear guest key from AsyncStorage
  await AsyncStorage.removeItem(GUEST_KEY)
}
