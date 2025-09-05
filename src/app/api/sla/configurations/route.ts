import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase/server'

// GET - Listar configurações de SLA
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sla_configurations')
      .select(`
        *,
        category:categories(id, name, slug, color, icon)
      `)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Erro ao buscar configurações SLA:', error)
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Erro no GET /api/sla/configurations:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar nova configuração de SLA
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem criar configurações de SLA' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category_id,
      priority,
      first_response_time,
      resolution_time,
      business_hours_only,
      business_hours_start,
      business_hours_end,
      working_days,
      alert_percentage
    } = body

    // Validações
    if (!name || !priority || !first_response_time || !resolution_time) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: name, priority, first_response_time, resolution_time' 
      }, { status: 400 })
    }

    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Prioridade inválida. Use: low, medium, high, critical' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verifica se já existe configuração para categoria/prioridade
    if (category_id) {
      const { data: existing } = await supabase
        .from('sla_configurations')
        .select('id')
        .eq('category_id', category_id)
        .eq('priority', priority)
        .single()

      if (existing) {
        return NextResponse.json({ 
          error: 'Já existe uma configuração de SLA para esta categoria e prioridade' 
        }, { status: 400 })
      }
    }

    // Cria a configuração
    const { data, error } = await supabase
      .from('sla_configurations')
      .insert({
        name,
        description,
        category_id,
        priority,
        first_response_time: parseInt(first_response_time),
        resolution_time: parseInt(resolution_time),
        business_hours_only: business_hours_only ?? true,
        business_hours_start: business_hours_start || '08:00:00',
        business_hours_end: business_hours_end || '18:00:00',
        working_days: working_days || '1,2,3,4,5',
        alert_percentage: alert_percentage || 80
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar configuração SLA:', error)
      return NextResponse.json({ error: 'Erro ao criar configuração' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro no POST /api/sla/configurations:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}