import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase'

// Função para obter permissões padrão baseadas no role
function getDefaultPermissions(role: string) {
  const defaultPermissions: Record<string, any> = {
    admin: {
      tickets_view: true,
      tickets_create: true,
      tickets_edit_own: true,
      tickets_edit_all: true,
      tickets_delete: true,
      tickets_assign: true,
      tickets_close: true,
      kb_view: true,
      kb_create: true,
      kb_edit: true,
      kb_delete: true,
      kb_manage_categories: true,
      timesheets_view_own: true,
      timesheets_view_all: true,
      timesheets_create: true,
      timesheets_edit_own: true,
      timesheets_edit_all: true,
      timesheets_approve: true,
      timesheets_analytics: true,
      timesheets_analytics_full: true,
      system_settings: true,
      system_users: true,
      system_roles: true,
      system_backup: true,
      system_logs: true
    },
    developer: {
      tickets_view: true,
      tickets_create: true,
      tickets_edit_own: true,
      tickets_edit_all: true,
      tickets_delete: false,
      tickets_assign: true,
      tickets_close: true,
      kb_view: true,
      kb_create: true,
      kb_edit: true,
      kb_delete: false,
      kb_manage_categories: false,
      timesheets_view_own: true,
      timesheets_view_all: true,
      timesheets_create: true,
      timesheets_edit_own: true,
      timesheets_edit_all: false,
      timesheets_approve: false,
      timesheets_analytics: true,
      timesheets_analytics_full: false,
      system_settings: false,
      system_users: false,
      system_roles: false,
      system_backup: false,
      system_logs: false
    },
    dev: { // Alias para developer
      tickets_view: true,
      tickets_create: true,
      tickets_edit_own: true,
      tickets_edit_all: true,
      tickets_delete: false,
      tickets_assign: true,
      tickets_close: true,
      kb_view: true,
      kb_create: true,
      kb_edit: true,
      kb_delete: false,
      kb_manage_categories: false,
      timesheets_view_own: true,
      timesheets_view_all: true,
      timesheets_create: true,
      timesheets_edit_own: true,
      timesheets_edit_all: false,
      timesheets_approve: false,
      timesheets_analytics: true,
      timesheets_analytics_full: false,
      system_settings: false,
      system_users: false,
      system_roles: false,
      system_backup: false,
      system_logs: false
    },
    analyst: {
      tickets_view: true,
      tickets_create: true,
      tickets_edit_own: true,
      tickets_edit_all: true,
      tickets_assign: true,
      tickets_close: true,
      kb_view: true,
      kb_create: true,
      kb_edit: true,
      kb_delete: false,
      kb_manage_categories: false,
      timesheets_view_own: true,
      timesheets_view_all: true,
      timesheets_create: true,
      timesheets_edit_own: true,
      timesheets_edit_all: false,
      timesheets_approve: true,
      timesheets_analytics: true,
      timesheets_analytics_full: false,
      system_settings: false,
      system_users: false,
      system_roles: false,
      system_backup: false,
      system_logs: false
    },
    user: {
      tickets_view: true,
      tickets_create: true,
      tickets_edit_own: true,
      tickets_edit_all: false,
      tickets_delete: false,
      tickets_assign: false,
      tickets_close: false,
      kb_view: true,
      kb_create: false,
      kb_edit: false,
      kb_delete: false,
      kb_manage_categories: false,
      timesheets_view_own: true,
      timesheets_view_all: false,
      timesheets_create: true,
      timesheets_edit_own: true,
      timesheets_edit_all: false,
      timesheets_approve: false,
      timesheets_analytics: false,
      timesheets_analytics_full: false,
      system_settings: false,
      system_users: false,
      system_roles: false,
      system_backup: false,
      system_logs: false
    }
  }
  
  return defaultPermissions[role] || defaultPermissions['user']
}

async function verifyPassword(password: string, hashedPassword: string) {
  // Verificação de hash para compatibilidade
  const ADMIN_PASSWORD_HASH = '$2a$10$qVPQejPGUNnzBOX1Gut4buUVLXauhbR6QY.sDk9SHV7Rg1sepaive'
  
  // Para o usuário admin, verificar diretamente
  if (hashedPassword === ADMIN_PASSWORD_HASH && password === 'admin123') {
    return true
  }
  
  // Tentar usar a API route se disponível
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/auth/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, hashedPassword }),
    })
    
    if (response.ok) {
      const { valid } = await response.json()
      return valid
    }
  } catch (error) {
    console.error('Error calling verify-password API:', error)
  }
  
  // Fallback de verificação
  return false
}

// Função para invalidar sessões antigas
async function invalidateOldSessions(userId: string, newSessionToken: string) {
  try {
    // Marcar todas as sessões antigas como expiradas
    await supabaseAdmin
      .from('sessions')
      .update({ expires: new Date(Date.now() - 1000).toISOString() })
      .eq('userId', userId)
      .neq('sessionToken', newSessionToken)
    
    console.log(`Sessões antigas invalidadas para usuário: ${userId}`)
  } catch (error) {
    console.error('Erro ao invalidar sessões antigas:', error)
  }
}

// Função para registrar nova sessão
async function registerSession(userId: string, sessionToken: string) {
  try {
    // Primeiro, invalidar sessões antigas (backup do trigger)
    await supabaseAdmin
      .from('sessions')
      .update({ expires: new Date(Date.now() - 1000).toISOString() })
      .eq('userId', userId)
      .gt('expires', new Date().toISOString())
    
    // Criar nova sessão
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .upsert({
        id: sessionToken, // Usar o token como ID
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'sessionToken'
      })
    
    if (error) {
      console.error('Erro ao registrar sessão:', error)
    } else {
      console.log('Nova sessão registrada com sucesso')
    }
  } catch (error) {
    console.error('Erro ao registrar sessão:', error)
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .eq('is_active', true)
            .single()

          if (error) {
            console.error('Supabase error:', error)
            return null
          }

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          // Verificação de senha
          const isValidPassword = await verifyPassword(
            credentials.password as string,
            user.password_hash
          )

          if (!isValidPassword) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          // Update last login
          await supabaseAdmin
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)

          // Buscar contextos associados ao usuário
          let availableContexts = []
          if (user.user_type === 'matrix') {
            const { data: userContexts, error: contextsError } = await supabaseAdmin
              .from('user_contexts')
              .select('context_id, contexts(id, name, slug, type)')
              .eq('user_id', user.id)
            
            if (!contextsError && userContexts) {
              availableContexts = userContexts
                .filter(uc => uc.contexts) // Filtrar contextos válidos
                .map(uc => ({
                  id: uc.contexts.id,
                  name: uc.contexts.name,
                  slug: uc.contexts.slug,
                  type: uc.contexts.type
                }))
            }
          }

          // Buscar permissões do perfil do usuário
          let userPermissions = {}
          if (user.role_name) {
            // Buscar permissões do perfil no banco
            const { data: roleData } = await supabaseAdmin
              .from('roles')
              .select('permissions')
              .eq('name', user.role_name)
              .single()
            
            if (roleData?.permissions) {
              userPermissions = roleData.permissions
            }
          }

          // Se não encontrou no banco, usar permissões padrão baseadas no role
          if (Object.keys(userPermissions).length === 0) {
            userPermissions = getDefaultPermissions(user.role_name || user.role)
          }

          console.log('Login successful for:', credentials.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role_name || user.role,
            role_name: user.role_name,
            department: user.department,
            avatar_url: user.avatar_url,
            permissions: userPermissions,
            // Dados multi-tenant
            userType: user.user_type || 'context',
            contextType: user.context_type,
            context_id: user.context_id,
            context_name: user.context_name,
            context_slug: user.context_slug,
            availableContexts: availableContexts,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Primeiro login - criar sessão
      if (user) {
        token.id = user.id
        token.role = user.role
        token.role_name = (user as any).role_name
        token.department = user.department
        token.avatar_url = user.avatar_url
        token.permissions = (user as any).permissions || {}
        // Dados multi-tenant
        token.userType = (user as any).userType
        token.contextType = (user as any).contextType
        token.context_id = (user as any).context_id
        token.context_name = (user as any).context_name
        token.context_slug = (user as any).context_slug
        token.availableContexts = (user as any).availableContexts || []
        
        // Gerar token de sessão único
        const sessionToken = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
        token.sessionToken = sessionToken
        
        // Registrar sessão no banco (com invalidação de antigas)
        try {
          await registerSession(user.id as string, sessionToken)
          console.log('SessionToken criado e salvo:', sessionToken)
        } catch (error) {
          console.error('Erro ao registrar sessão:', error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.role_name) {
          session.user.role_name = token.role_name as string;
        }
        session.user.department = token.department as string;
        session.user.avatar_url = token.avatar_url as string;
        session.user.permissions = token.permissions as any || {};
        
        // Dados multi-tenant
        (session.user as any).userType = token.userType as string;
        (session.user as any).contextType = token.contextType as string;
        (session.user as any).context_id = token.context_id as string;
        (session.user as any).context_name = token.context_name as string;
        (session.user as any).context_slug = token.context_slug as string;
        (session.user as any).availableContexts = token.availableContexts as any[] || [];
        
        // IMPORTANTE: Adicionar sessionToken à sessão para as APIs poderem acessar
        (session as any).sessionToken = token.sessionToken;
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt', // VOLTAR PARA JWT (obrigatório para CredentialsProvider)
    maxAge: 24 * 60 * 60, // 24 horas
    updateAge: 60 * 60, // Atualiza a cada 1 hora
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
}
