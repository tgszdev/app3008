import { createClient } from '@supabase/supabase-js'

// Safe Supabase client initialization with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we have the required environment variables
const hasSupabaseConfig = supabaseUrl && supabaseAnonKey

// Create a safe client that won't crash if env vars are missing
export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Admin client for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = hasSupabaseConfig && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => hasSupabaseConfig

// Export the configuration status
export const supabaseConfig = {
  isConfigured: hasSupabaseConfig,
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey
}