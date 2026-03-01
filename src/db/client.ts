import { openDatabaseSync } from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import * as schema from './schema'

// Open the SQLite file synchronously — safe at module init time on the JS thread.
// enableChangeListener enables live query subscriptions for TanStack Query hooks.
const expo = openDatabaseSync('boges2birds.db', { enableChangeListener: true })

export const db = drizzle(expo, { schema })
