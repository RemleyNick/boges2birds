import { migrate } from 'drizzle-orm/expo-sqlite/migrator'
import { db } from './client'
import migrations from './migrations/migrations'

/**
 * Run all pending SQLite migrations.
 * Called once on app start before any screen renders.
 * Subsequent calls are near-instant (no-op if already up to date).
 */
export async function runMigrations(): Promise<void> {
  await migrate(db, migrations)
}
