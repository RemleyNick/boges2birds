/**
 * Sync stub — pushes unsynced SQLite records to Supabase.
 * Currently a no-op. Wired up in Step 6 of the roadmap (offline sync + App Store prep).
 *
 * Call from:
 * - AppState 'active' listener (foreground resume)
 * - After any write that creates a sync_log entry
 */
export async function syncToSupabase(): Promise<void> {
  // TODO: query sync_log WHERE synced = false
  // TODO: upsert each record to Supabase by table_name + record_id
  // TODO: mark synced = true + set synced_at on success
  // TODO: write error_message on failure, leave synced = false for retry
}
