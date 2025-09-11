import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create mock client for when Supabase is not configured
const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      download: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      remove: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      list: () => Promise.resolve({ data: [], error: null }),
      createSignedUrl: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    }),
  },
  rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
} as any)

// Validate and create clients
let supabase: any
let supabaseAdmin: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing!')
  console.warn('Please set the following environment variables:')
  console.warn('- NEXT_PUBLIC_SUPABASE_URL')
  console.warn('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.warn('Using mock client to prevent crashes.')
  
  // Use mock clients
  supabase = createMockClient()
  supabaseAdmin = createMockClient()
} else {
  // Client-side Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  // Server-side Supabase client with service role key (use only on server)
  supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : supabase // Fallback to regular client if no service key
}

// Export the clients
export { supabase, supabaseAdmin }

// Export configuration status
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey