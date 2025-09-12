import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      checks: {
        tables: {},
        triggers: {},
        counts: {},
        test: {}
      },
      success: false,
      message: ''
    }

    // 1. Verificar se a tabela sessions existe
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .limit(1)
    
    results.checks.tables.sessions = !sessionsError
    
    // 2. Verificar se a tabela accounts existe
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .limit(1)
    
    results.checks.tables.accounts = !accountsError
    
    // 3. Verificar se a tabela verification_tokens existe
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .limit(1)
    
    results.checks.tables.verification_tokens = !tokensError
    
    // 4. Contar sessões existentes
    const { count: totalSessions } = await supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
    
    results.checks.counts.total_sessions = totalSessions || 0
    
    // 5. Contar sessões ativas
    const { count: activeSessions } = await supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('expires', new Date().toISOString())
    
    results.checks.counts.active_sessions = activeSessions || 0
    
    // 6. Verificar função de status
    const { data: statusCheck, error: statusError } = await supabaseAdmin
      .rpc('check_session_system_status')
    
    results.checks.triggers.status_function = !statusError
    
    if (statusCheck && statusCheck[0]) {
      results.checks.counts.from_function = statusCheck[0]
    }
    
    // 7. Teste criar uma sessão fake para ver se o trigger funciona
    const testUserId = 'test-' + Date.now()
    const testSession1 = {
      id: 'test-session-1-' + Date.now(),
      sessionToken: 'test-token-1-' + Date.now(),
      userId: testUserId,
      expires: new Date(Date.now() + 3600000).toISOString() // 1 hora
    }
    
    const testSession2 = {
      id: 'test-session-2-' + Date.now(),
      sessionToken: 'test-token-2-' + Date.now(),
      userId: testUserId, // Mesmo usuário!
      expires: new Date(Date.now() + 3600000).toISOString() // 1 hora
    }
    
    // Inserir primeira sessão de teste
    const { error: insert1Error } = await supabaseAdmin
      .from('sessions')
      .insert(testSession1)
    
    results.checks.test.first_insert = !insert1Error
    
    if (!insert1Error) {
      // Inserir segunda sessão (deve invalidar a primeira)
      const { error: insert2Error } = await supabaseAdmin
        .from('sessions')
        .insert(testSession2)
      
      results.checks.test.second_insert = !insert2Error
      
      // Verificar se a primeira foi invalidada
      const { data: checkFirst } = await supabaseAdmin
        .from('sessions')
        .select('expires')
        .eq('id', testSession1.id)
        .single()
      
      if (checkFirst) {
        const isExpired = new Date(checkFirst.expires) < new Date()
        results.checks.test.first_session_invalidated = isExpired
        results.checks.test.trigger_working = isExpired
      }
      
      // Limpar sessões de teste
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('userId', testUserId)
      
      results.checks.test.cleanup = true
    }
    
    // Determinar sucesso
    results.success = 
      results.checks.tables.sessions && 
      results.checks.tables.accounts && 
      results.checks.tables.verification_tokens
    
    if (results.success) {
      results.message = '✅ Sistema de sessão única configurado corretamente!'
      if (results.checks.test.trigger_working) {
        results.message += ' Trigger funcionando perfeitamente!'
      }
    } else {
      results.message = '❌ Algumas tabelas não foram criadas. Execute o SQL novamente.'
    }
    
    return NextResponse.json(results, { status: 200 })
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false,
      message: '❌ Erro ao verificar sistema'
    }, { status: 500 })
  }
}