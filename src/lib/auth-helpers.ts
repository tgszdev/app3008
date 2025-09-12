import { supabaseAdmin } from '@/lib/supabase'

/**
 * Helper para criar sessão manualmente no banco se o adapter falhar
 */
export async function createDatabaseSession(userId: string) {
  try {
    // Gerar token de sessão único
    const sessionToken = generateSessionToken()
    
    // Criar sessão no banco
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        id: generateSessionId(),
        sessionToken,
        userId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating session:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Failed to create database session:', error)
    return null
  }
}

/**
 * Helper para verificar se uma sessão é válida
 */
export async function validateDatabaseSession(sessionToken: string) {
  try {
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select('*, users(*)')
      .eq('sessionToken', sessionToken)
      .gt('expires', new Date().toISOString())
      .single()
    
    if (error || !session) {
      return null
    }
    
    // Atualizar último acesso
    await supabaseAdmin
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session.id)
    
    return session
  } catch (error) {
    console.error('Failed to validate session:', error)
    return null
  }
}

/**
 * Helper para invalidar sessões antigas do usuário
 */
export async function invalidateOldSessions(userId: string, currentSessionId?: string) {
  try {
    const query = supabaseAdmin
      .from('sessions')
      .update({ expires: new Date(Date.now() - 1000).toISOString() })
      .eq('userId', userId)
    
    // Se tiver sessão atual, não invalidar ela
    if (currentSessionId) {
      query.neq('id', currentSessionId)
    }
    
    const { error } = await query
    
    if (error) {
      console.error('Error invalidating old sessions:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Failed to invalidate old sessions:', error)
    return false
  }
}

/**
 * Gerar ID único para sessão
 */
function generateSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Gerar token de sessão seguro
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}