import { NextRequest, NextResponse } from 'next/server'
import { sendEscalationEmail } from '@/lib/email-service'
import { supabaseAdmin } from '@/lib/supabase'
import { clearEmailConfigCache } from '@/lib/email-config'

export async function GET(request: NextRequest) {
  try {
    
    // Obter email de teste dos parâmetros ou usar padrão
    const searchParams = request.nextUrl.searchParams
    const testEmail = searchParams.get('email')
    
    if (!testEmail) {
      // Buscar email de um admin do sistema
      const { data: admin } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('role', 'admin')
        .limit(1)
        .single()
      
      if (!admin || !admin.email) {
        return NextResponse.json({
          success: false,
          error: 'Nenhum email de admin encontrado. Use ?email=seu@email.com'
        }, { status: 400 })
      }
    }
    
    const recipientEmail = testEmail || ''
    
    
    // Limpar cache de configuração para forçar buscar do banco
    clearEmailConfigCache()
    
    // Enviar email de teste
    const result = await sendEscalationEmail(
      'TEST-' + Date.now().toString(),
      '999999', // Número de teste
      'TESTE - Ticket de Exemplo para Verificar Escalação',
      'Teste de Email - Regra de 1 hora',
      [recipientEmail]
    )
    
    if (result) {
      
      // Verificar log no banco
      const { data: logs } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .eq('to', recipientEmail)
        .order('created_at', { ascending: false })
        .limit(1)
      
      return NextResponse.json({
        success: true,
        message: 'Email de teste enviado com sucesso!',
        recipient: recipientEmail,
        log: logs?.[0] || null,
        timestamp: new Date().toISOString()
      })
    } else {
      
      // Buscar erro no log
      const { data: errorLogs } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .eq('to', recipientEmail)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1)
      
      return NextResponse.json({
        success: false,
        error: 'Falha ao enviar email',
        recipient: recipientEmail,
        errorLog: errorLogs?.[0] || null,
        hint: 'Verifique as configurações SMTP no sistema'
      }, { status: 500 })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar teste',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório no body da requisição'
      }, { status: 400 })
    }
    
    
    // Enviar email de teste
    const result = await sendEscalationEmail(
      'TEST-' + Date.now().toString(),
      '999999', // Número de teste
      'TESTE - Verificação do Sistema de Escalação',
      'Email de Teste - Sistema Funcionando',
      [email]
    )
    
    return NextResponse.json({
      success: result,
      message: result ? 'Email enviado com sucesso!' : 'Falha ao enviar email',
      recipient: email,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar teste',
      details: error.message
    }, { status: 500 })
  }
}