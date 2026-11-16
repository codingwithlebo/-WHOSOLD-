import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * The browser client. It is `null` until the Supabase project keys are in
 * `.env` (see `.env.example`), so the UI can still run and show a notice.
 * Only the public anon key is used here; RLS protects the data.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseConfigured = supabase !== null
