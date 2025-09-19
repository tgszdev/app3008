import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Buscar últimos logs de email
    const { data: emailLogs, error: logsError } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (logsError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar logs',
        details: logsError.message
      }, { status: 500 })
    }
    
    // Buscar configuração atual
    const { data: config } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()
    
    // Estatísticas
    const stats = {
      total: emailLogs?.length || 0,
      sent: emailLogs?.filter(l => l.status === 'sent').length || 0,
      failed: emailLogs?.filter(l => l.status === 'failed').length || 0,
      queued: emailLogs?.filter(l => l.status === 'queued').length || 0
    }
    
    return NextResponse.json({
      success: true,
      stats,
      has_config: !!config,
      logs: emailLogs?.map(log => ({
        id: log.id,
        to: log.to,
        subject: log.subject,
        status: log.status,
        provider: log.provider,
        error_message: log.error_message,
        metadata: log.metadata,
        created_at: log.created_at
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}