// Sistema Multi-Tenant Híbrido - Configuração de Autenticação
// Versão simplificada para ativação

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
      timesheets_edit_own: true,
      timesheets_edit_all: true,
      timesheets_approve: true,
      users_view: true,
      users_create: true,
      users_edit: true,
      users_delete: true,
      settings_view: true,
      settings_edit: true,
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
      timesheets_view_own: true,
      timesheets_edit_own: true,
      timesheets_view_all: true,
    },
    developer: {
      tickets_view: true,
      tickets_create: true,
      tickets_edit_own: true,
      tickets_edit_all: true,
      tickets_assign: true,
      tickets_close: true,
      kb_view: true,
      kb_create: true,
      kb_edit: true,
      timesheets_view_own: true,
      timesheets_edit_own: true,
    },
    user: {
      tickets_view: true,
      tickets_create: true,
      tickets_edit_own: true,
      kb_view: true,
      timesheets_view_own: true,
      timesheets_edit_own: true,
    },
  }

  return defaultPermissions[role] || defaultPermissions.user
}

// Função para verificar senha usando bcryptjs
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs')
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Erro ao verificar senha:', error)
    return false
  }
}

// Função para invalidar sessões antigas
async function invalidateOldSessions(userId: string) {
  try {
    await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('user_id', userId)
  } catch (error) {
    console.error('Erro ao invalidar sessões antigas:', error)
  }
}

// Função para registrar nova sessão
async function registerSession(userId: string, sessionToken: string) {
  try {
    const expires = new Date()
    expires.setDate(expires.getDate() + 1) // 24 horas

    await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: userId,
        sessionToken,
        expires: expires.toISOString(),
        created_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('Erro ao registrar sessão:', error)
  }
}

export const authHybridConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text', optional: true } // 'matrix' or 'context'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string
        const userType = credentials.userType as 'matrix' | 'context' | undefined

        try {
          let user = null
          let type: 'matrix' | 'context' | 'legacy' = 'legacy' // Default to legacy for existing users

          // Try to log in as a matrix user
          if (userType === 'matrix' || !userType) { // If userType is matrix or not specified, try matrix first
            const { data: matrixUser, error: matrixError } = await supabaseAdmin
              .from('matrix_users')
              .select('*')
              .eq('email', email)
              .eq('is_active', true)
              .single()

            if (matrixUser && await verifyPassword(password, matrixUser.password_hash)) {
              user = matrixUser
              type = 'matrix'
            } else if (matrixError && matrixError.code !== 'PGRST116') { // PGRST116 means no rows found
              console.error('Supabase matrix user error:', matrixError)
            }
          }

          // If not a matrix user, try to log in as a context user
          if (!user && (userType === 'context' || !userType)) { // If userType is context or not specified, try context
            const { data: contextUser, error: contextError } = await supabaseAdmin
              .from('context_users')
              .select('*, contexts(id, name, slug, type)')
              .eq('email', email)
              .eq('is_active', true)
              .single()

            if (contextUser && await verifyPassword(password, contextUser.password_hash)) {
              user = contextUser
              type = 'context'
            } else if (contextError && contextError.code !== 'PGRST116') {
              console.error('Supabase context user error:', contextError)
            }
          }

          // If still no user, try to log in as a legacy user (from 'users' table)
          if (!user && !userType) { // Only try legacy if userType is not explicitly set
            const { data: legacyUser, error: legacyError } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', email)
              .eq('is_active', true)
              .single()

            if (legacyUser && await verifyPassword(password, legacyUser.password_hash)) {
              user = legacyUser
              type = 'legacy'
            } else if (legacyError && legacyError.code !== 'PGRST116') {
              console.error('Supabase legacy user error:', legacyError)
            }
          }

          if (!user) {
            console.log('User not found or invalid credentials:', email)
            return null
          }

          // Update last login
          if (type === 'matrix') {
            await supabaseAdmin.from('matrix_users').update({ last_login: new Date().toISOString() }).eq('id', user.id)
          } else if (type === 'context') {
            await supabaseAdmin.from('context_users').update({ last_login: new Date().toISOString() }).eq('id', user.id)
          } else { // legacy
            await supabaseAdmin.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id)
          }

          // Fetch permissions
          let userPermissions = {}
          const roleName = user.role_name || user.role
          if (roleName) {
            const { data: roleData } = await supabaseAdmin
              .from('roles')
              .select('permissions')
              .eq('name', roleName)
              .single()
            if (roleData?.permissions) {
              userPermissions = roleData.permissions
            }
          }
          if (Object.keys(userPermissions).length === 0) {
            userPermissions = getDefaultPermissions(roleName)
          }

          console.log('Login successful for:', email, 'Type:', type)

          const authUser: any = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: roleName,
            role_name: roleName,
            department: user.department,
            avatar_url: user.avatar_url,
            permissions: userPermissions,
            userType: type,
          }

          if (type === 'context' && user.contexts) {
            authUser.context_id = user.context_id
            authUser.context_name = user.contexts.name
            authUser.context_slug = user.contexts.slug
            authUser.context_type = user.contexts.type
          }

          return authUser
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.role_name = (user as any).role_name
        token.department = user.department
        token.avatar_url = user.avatar_url
        token.permissions = (user as any).permissions || {}
        token.userType = (user as any).userType // 'matrix' | 'context' | 'legacy'

        if ((user as any).context_id) {
          token.context_id = (user as any).context_id
          token.context_name = (user as any).context_name
          token.context_slug = (user as any).context_slug
          token.context_type = (user as any).context_type
        }

        // Generate unique session token
        const sessionToken = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
        token.sessionToken = sessionToken

        try {
          await registerSession(user.id as string, sessionToken)
          console.log('SessionToken created and saved:', sessionToken)
        } catch (error) {
          console.error('Error registering session:', error)
        }
      }

      // IMPORTANTE: Preservar o sessionToken em todas as requisições
      // Se não tem sessionToken mas tem user id, pode ser uma sessão antiga - gerar novo token
      if (!token.sessionToken && token.id) {
        console.log('[AUTH] Token sem sessionToken, gerando novo...')
        const newSessionToken = `${token.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
        token.sessionToken = newSessionToken
        
        try {
          await registerSession(token.id as string, newSessionToken)
          console.log('[AUTH] Novo sessionToken criado para sessão existente:', newSessionToken)
        } catch (error) {
          console.error('[AUTH] Erro ao criar novo sessionToken:', error)
        }
      }
      
      // Verificar sessão apenas em updates controlados
      if (token.sessionToken && trigger === 'update') {
        try {
          const { data: session } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('sessionToken', token.sessionToken as string)
            .gt('expires', new Date().toISOString())
            .single()
          
          if (!session) {
            console.log('[AUTH] Sessão não encontrada no banco:', {
              sessionToken: token.sessionToken,
              userId: token.id,
              trigger
            })
            return null
          } else {
            console.log('[AUTH] Sessão válida encontrada no update')
          }
        } catch (error) {
          console.error('Erro ao verificar sessão:', error)
          // Em caso de erro, não forçar logout - pode ser problema de rede
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        if (token.role_name) {
          session.user.role_name = token.role_name as string
        }
        session.user.department = token.department as string
        session.user.avatar_url = token.avatar_url as string
        session.user.permissions = token.permissions as any || {}
        
        // Novos campos multi-tenant
        session.user.userType = token.userType as any
        session.user.contextType = token.contextType as any
        session.user.context_id = token.context_id as string
        session.user.context_slug = token.context_slug as string
        session.user.context_name = token.context_name as string
        
        // SessionToken para APIs
        (session as any).sessionToken = token.sessionToken
        
        // Verificação de sessão desabilitada temporariamente para resolver problema de invalidação
        // TODO: Reativar verificação quando necessário
        console.log('[AUTH] Sessão mantida ativa (verificação desabilitada temporariamente)')
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
}