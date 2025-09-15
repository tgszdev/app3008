import { createClient } from '@supabase/supabase-js'

// Cliente admin do Supabase para operações do servidor
// Temporariamente usando anon key pois service role key está com problema
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Temporário: usar anon key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Função auxiliar para verificar se estamos usando a service key
export const isUsingServiceKey = () => {
  return !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
}

// Cliente normal do Supabase (para referência)
export { supabaseClient } from './supabase-client'