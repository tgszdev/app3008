import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    
    // Teste 1: Verificar se o arquivo existe
    try {
      const { executeEscalationForTicketSimple } = await import('@/lib/escalation-engine-simple')
      
      // Teste 2: Verificar se a função existe
      if (typeof executeEscalationForTicketSimple === 'function') {
      } else {
      }
      
    } catch (importError: any) {
      return NextResponse.json({
        success: false,
        error: `Erro ao importar: ${importError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Teste 3: Verificar se o Supabase está funcionando
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      // Teste 4: Verificar conexão com banco
      const { data, error } = await supabaseAdmin
        .from('escalation_rules')
        .select('id, name')
        .limit(1)
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: `Erro no banco: ${error.message}`,
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }
      
      
    } catch (supabaseError: any) {
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
    return NextResponse.json({
      success: false,
      error: `Erro geral: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
