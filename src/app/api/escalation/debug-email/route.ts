import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { clearEmailConfigCache } from '@/lib/email-config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG-EMAIL] Iniciando debug de configuração de email...')
    
    // 1. Verificar configuração no banco
    const { data: emailConfig, error: configError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()
    
    let configInfo = null
    if (emailConfig && emailConfig.value) {
      // Não expor senha completa
      configInfo = {
        ...emailConfig.value,
        pass: emailConfig.value.pass ? '***' + emailConfig.value.pass.slice(-4) : 'NOT SET',
        user: emailConfig.value.user || 'NOT SET',
        host: emailConfig.value.host || 'NOT SET',
        port: emailConfig.value.port || 'NOT SET'
      }
    }
    
    // 2. Verificar últimos logs de email
    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 3. Testar envio real com logging detalhado
    const testEmail = request.nextUrl.searchParams.get('email') || 'rodrigues220589@gmail.com'
    
    // Limpar cache
    clearEmailConfigCache()
    
    // Importar com logging
    console.log('📧 [DEBUG-EMAIL] Importando email-config...')
    const emailConfigModule = await import('@/lib/email-config')
    
    console.log('📧 [DEBUG-EMAIL] Tentando enviar email de teste...')
    
    // Tentar enviar com logging completo
    const result = await emailConfigModule.sendEmail({
      to: testEmail,
      subject: `[DEBUG] Teste de Email - ${new Date().toISOString()}`,
      html: `
        <h1>Email de Debug</h1>
        <p>Este é um email de teste enviado em: ${new Date().toLocaleString('pt-BR')}</p>
        <p>Se você recebeu este email, o sistema está funcionando!</p>
        <hr>
        <p>Informações do Sistema:</p>
        <ul>
          <li>Timestamp: ${new Date().toISOString()}</li>
          <li>Destinatário: ${testEmail}</li>
          <li>Origem: API de Debug</li>
        </ul>
      `,
      text: `Email de teste enviado em ${new Date().toLocaleString('pt-BR')}`
    })
    
    console.log('📧 [DEBUG-EMAIL] Resultado do envio:', result)
    
    // 4. Verificar se foi gravado no log
    const { data: newLog } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .eq('to', testEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // 5. Verificar configurações de variáveis de ambiente
    const envInfo = {
      SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT ? 'SET' : 'NOT SET',
      SMTP_USER: process.env.SMTP_USER ? '***' + (process.env.SMTP_USER?.slice(-10) || '') : 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'NOT SET',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET'
    }
    
    // 6. Testar envio direto com nodemailer
    let directTestResult = null
    try {
      const nodemailer = await import('nodemailer')
      
      // Configuração direta do Gmail
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'rodrigues220589@gmail.com',
          pass: process.env.GMAIL_APP_PASS || '' // Você precisará configurar esta variável
        }
      })
      
      console.log('📧 [DEBUG-EMAIL] Verificando transporter...')
      await transporter.verify()
      
      console.log('📧 [DEBUG-EMAIL] Enviando email direto...')
      const directInfo = await transporter.sendMail({
        from: '"Sistema Debug" <rodrigues220589@gmail.com>',
        to: testEmail,
        subject: '[DIRETO] Teste Nodemailer - ' + new Date().toISOString(),
        text: 'Teste direto via nodemailer',
        html: '<b>Teste direto via nodemailer</b>'
      })
      
      directTestResult = {
        success: true,
        messageId: directInfo.messageId,
        accepted: directInfo.accepted
      }
    } catch (directError: any) {
      directTestResult = {
        success: false,
        error: directError.message
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        config_in_db: configInfo || 'No config found in database',
        env_vars: envInfo,
        send_result: result,
        direct_test: directTestResult,
        new_log_created: newLog ? {
          id: newLog.id,
          status: newLog.status,
          error: newLog.error_message,
          created_at: newLog.created_at
        } : null,
        recent_logs: recentLogs?.map(log => ({
          to: log.to,
          status: log.status,
          error: log.error_message,
          created_at: log.created_at
        }))
      },
      test_email: testEmail,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ [DEBUG-EMAIL] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no debug',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}