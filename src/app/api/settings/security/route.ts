import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar configurações de segurança
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode acessar configurações de segurança
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Buscar configurações do banco
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('setting_type', 'security')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Se não encontrou, retorna configurações padrão
    if (!settings) {
      return NextResponse.json({
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: false,
        passwordExpirationDays: 90,
        sessionTimeout: 30,
        maxConcurrentSessions: 3,
        requireMFA: false,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        enableAuditLog: true,
        auditLogRetentionDays: 90,
        enableIPWhitelist: false,
        ipWhitelist: [],
        enableIPBlacklist: false,
        ipBlacklist: []
      })
    }

    return NextResponse.json(settings.settings_data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Salvar configurações de segurança
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode modificar configurações de segurança
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()

    // Verificar se já existe configuração
    const { data: existing } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .eq('setting_type', 'security')
      .single()

    if (existing) {
      // Atualizar configuração existente
      const { error: updateError } = await supabaseAdmin
        .from('system_settings')
        .update({
          settings_data: body,
          updated_by: session.user.id,
          // updated_at gerenciado automaticamente pelo Supabase
        })
        .eq('setting_type', 'security')

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }
    } else {
      // Criar nova configuração
      const { error: insertError } = await supabaseAdmin
        .from('system_settings')
        .insert({
          setting_type: 'security',
          settings_data: body,
          created_by: session.user.id,
          updated_by: session.user.id
        })

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }
    }

    // Log de auditoria
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: 'UPDATE_SECURITY_SETTINGS',
        resource_type: 'system_settings',
        resource_id: 'security',
        details: {
          settings_updated: Object.keys(body)
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}