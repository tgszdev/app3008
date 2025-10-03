import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

// GET - Listar ações de escalação disponíveis
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: actions, error } = await supabaseAdmin
      .from('escalation_actions')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar ações' }, { status: 500 })
    }

    return NextResponse.json(actions || [])
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
