import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

let _supabase: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (_supabase) return _supabase
  if (!supabaseUrl || !supabaseAnonKey) return null
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  return _supabase
}

/** Exposed for callers that need the raw client (e.g. onAuthStateChange type) */
export { getClient }

// ─── Auth wrappers ─────────────────────────────────────────────────────────────
// Return no-op results when Supabase isn't configured so the app runs in guest-only mode.

export async function signUp(email: string, password: string) {
  const client = getClient()
  if (!client) throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL to .env.')
  return client.auth.signUp({ email, password })
}

export async function signIn(email: string, password: string) {
  const client = getClient()
  if (!client) throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL to .env.')
  return client.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  const client = getClient()
  if (!client) return { error: null }
  return client.auth.signOut()
}

export async function getSession() {
  const client = getClient()
  if (!client) return { data: { session: null }, error: null }
  return client.auth.getSession()
}

export function onAuthStateChange(
  callback: (event: string, session: any) => void,
) {
  const client = getClient()
  if (!client) {
    // Return a no-op subscription so callers don't need to guard
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return client.auth.onAuthStateChange(callback as any)
}
