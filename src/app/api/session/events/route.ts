import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Obter sessão atual
  const session = await auth()
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const userId = session.user.id
  const sessionToken = (session as any)?.sessionToken
  
  if (!sessionToken) {
    return new Response('No session token', { status: 401 })
  }
  
  console.log(`[SSE] Iniciando stream para usuário ${userId}`)
  
  // Criar stream de eventos
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Enviar evento de conexão estabelecida
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ 
          type: 'connected',
          userId,
          timestamp: new Date().toISOString()
        })}\n\n`)
      )
      
      // Função para verificar sessão
      const checkSession = async () => {
        try {
          const { data: currentSession, error } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('userId', userId)
            .eq('sessionToken', sessionToken)
            .single()
          
          if (error || !currentSession) {
            // Sessão não existe mais, mas manter conexão ativa
            console.log(`[SSE] Sessão não encontrada para usuário ${userId}, mas mantendo conexão ativa`)
            // Não invalidar a sessão - manter conexão ativa
            return true
          }
          
          // Verificar se foi invalidada
          if (currentSession.invalidated_at) {
            console.log(`[SSE] Sessão invalidada detectada para usuário ${userId}`)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'session_invalidated',
                reason: currentSession.invalidated_reason || 'new_login_detected',
                invalidated_at: currentSession.invalidated_at,
                timestamp: new Date().toISOString()
              })}\n\n`)
            )
            controller.close()
            return false
          }
          
          // Verificar se expirou
          const now = new Date()
          const expires = new Date(currentSession.expires)
          
          if (expires < now) {
            console.log(`[SSE] Sessão expirada para usuário ${userId}`)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'session_expired',
                expired_at: currentSession.expires,
                timestamp: new Date().toISOString()
              })}\n\n`)
            )
            controller.close()
            return false
          }
          
          // Sessão ainda válida
          return true
        } catch (error) {
          console.error('[SSE] Erro ao verificar sessão:', error)
          // Em caso de erro, continuar tentando
          return true
        }
      }
      
      // Verificar imediatamente
      const initialCheck = await checkSession()
      if (!initialCheck) {
        return // Sessão já inválida, stream fechado
      }
      
      // Contador para heartbeat
      let heartbeatCount = 0
      
      // Verificar a cada 1 segundo (detecção mais rápida)
      const interval = setInterval(async () => {
        const isValid = await checkSession()
        
        if (!isValid) {
          clearInterval(interval)
        } else {
          // Enviar heartbeat a cada 20 verificações (20 segundos)
          heartbeatCount++
          if (heartbeatCount >= 20) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`)
            )
            heartbeatCount = 0
          }
        }
      }, 500) // Verificação a cada 500ms (ultra agressivo para logout imediato)
      
      // Cleanup quando cliente desconectar
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Cliente desconectado - usuário ${userId}`)
        clearInterval(interval)
        controller.close()
      })
      
      // Timeout de segurança (1 hora)
      setTimeout(() => {
        console.log(`[SSE] Timeout de segurança atingido - usuário ${userId}`)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'timeout',
            message: 'Connection timeout - please reconnect',
            timestamp: new Date().toISOString()
          })}\n\n`)
        )
        clearInterval(interval)
        controller.close()
      }, 60 * 60 * 1000) // 1 hora
    }
  })
  
  // Retornar resposta SSE com headers apropriados
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilitar buffering em proxies
    }
  })
}