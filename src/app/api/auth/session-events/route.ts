import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Server-Sent Events para notificação em tempo real
export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const userId = session.user?.id
  const sessionToken = (session as any).sessionToken
  
  const encoder = new TextEncoder()
  
  // Criar stream para Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      // Enviar heartbeat inicial
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
      
      // Verificar sessão periodicamente
      const checkInterval = setInterval(async () => {
        try {
          // Verificar se a sessão ainda é válida
          const { data: validSession } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('userId', userId)
            .gt('expires', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          if (!validSession || validSession.sessionToken !== sessionToken) {
            // Sessão foi invalidada
            controller.enqueue(encoder.encode('data: {"type":"session_invalidated"}\n\n'))
            clearInterval(checkInterval)
            controller.close()
          } else {
            // Heartbeat - sessão ainda válida
            controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'))
          }
        } catch (error) {
        }
      }, 2000) // Verifica a cada 2 segundos
      
      // Limpar ao fechar conexão
      request.signal.addEventListener('abort', () => {
        clearInterval(checkInterval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}