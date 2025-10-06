import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET - Buscar configurações WhatsApp do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Buscar preferências de notificação
    const { data: prefs, error: prefsError} = await supabaseAdmin
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (prefsError) throw prefsError

    // Montar resposta
    const settings = {
      phone: user.phone || '',
      whatsapp_enabled: prefs.whatsapp_enabled || false,
      preferences: {
        ticket_created: prefs.ticket_created?.whatsapp || false,
        ticket_assigned: prefs.ticket_assigned?.whatsapp || false,
        ticket_updated: prefs.ticket_updated?.whatsapp || false,
        ticket_resolved: prefs.ticket_resolved?.whatsapp || false,
        comment_added: prefs.comment_added?.whatsapp || false,
        comment_mention: prefs.comment_mention?.whatsapp || false
      }
    }

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('Erro ao buscar configurações WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Salvar configurações WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const { phone, whatsapp_enabled, preferences } = body

    // Validar telefone
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      if (!cleanPhone.startsWith('55') || cleanPhone.length < 12) {
        return NextResponse.json(
          { success: false, error: 'Telefone inválido. Use formato: +55 11 98765-4321' },
          { status: 400 }
        )
      }
    }

    // Atualizar telefone do usuário
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ phone })
      .eq('id', userId)

    if (userError) throw userError

    // Atualizar preferências
    const updateData: any = {
      whatsapp_enabled,
      ticket_created: {
        email: true,
        push: true,
        in_app: true,
        whatsapp: preferences.ticket_created
      },
      ticket_assigned: {
        email: true,
        push: true,
        in_app: true,
        whatsapp: preferences.ticket_assigned
      },
      ticket_updated: {
        email: false,
        push: false,
        in_app: true,
        whatsapp: preferences.ticket_updated
      },
      ticket_resolved: {
        email: true,
        push: false,
        in_app: true,
        whatsapp: preferences.ticket_resolved
      },
      comment_added: {
        email: true,
        push: true,
        in_app: true,
        whatsapp: preferences.comment_added
      },
      comment_mention: {
        email: true,
        push: true,
        in_app: true,
        whatsapp: preferences.comment_mention
      }
    }

    const { error: prefsError } = await supabaseAdmin
      .from('user_notification_preferences')
      .update(updateData)
      .eq('user_id', userId)

    if (prefsError) throw prefsError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao salvar configurações WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

