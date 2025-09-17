import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG-ESCALATION] Iniciando debug...')
    
    // Teste 1: Verificar se o arquivo existe
    try {
      const { executeEscalationForTicketSimple } = await import('@/lib/escalation-engine-simple')
      console.log('✅ [DEBUG-ESCALATION] Arquivo escalation-engine-simple.ts carregado com sucesso')
      
      // Teste 2: Verificar se a função existe
      if (typeof executeEscalationForTicketSimple === 'function') {
        console.log('✅ [DEBUG-ESCALATION] Função executeEscalationForTicketSimple encontrada')
      } else {
        console.log('❌ [DEBUG-ESCALATION] Função executeEscalationForTicketSimple não encontrada')
      }
      
    } catch (importError: any) {
      console.error('❌ [DEBUG-ESCALATION] Erro ao importar arquivo:', importError.message)
      return NextResponse.json({
        success: false,
        error: `Erro ao importar: ${importError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Teste 3: Verificar se o Supabase está funcionando
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      console.log('✅ [DEBUG-ESCALATION] Supabase carregado com sucesso')
      
      // Teste 4: Verificar conexão com banco
      const { data, error } = await supabaseAdmin
        .from('escalation_rules')
        .select('id, name')
        .limit(1)
      
      if (error) {
        console.error('❌ [DEBUG-ESCALATION] Erro ao conectar com banco:', error.message)
        return NextResponse.json({
          success: false,
          error: `Erro no banco: ${error.message}`,
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }
      
      console.log('✅ [DEBUG-ESCALATION] Conexão com banco funcionando')
      console.log(`✅ [DEBUG-ESCALATION] Encontradas ${data?.length || 0} regras de escalação`)
      
    } catch (supabaseError: any) {
      console.error('❌ [DEBUG-ESCALATION] Erro no Supabase:', supabaseError.message)
      return NextResponse.json({
        success: false,
        error: `Erro no Supabase: ${supabaseError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Debug concluído com sucesso',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ [DEBUG-ESCALATION] Erro geral:', error.message)
    return NextResponse.json({
      success: false,
      error: `Erro geral: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
