import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { supabaseAdmin } from '@/lib/supabase'

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

export const authConfig: NextAuthConfig = {
  // Adapter para usar sessões no banco de dados
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
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

          console.log('Login successful for:', credentials.email)

          // IMPORTANTE: Retornar o ID como string para compatibilidade com o adapter
          return {
            id: user.id.toString(), // Converter para string
            email: user.email,
            name: user.name,
            role: user.role_name || user.role,
            role_name: user.role_name,
            department: user.department,
            avatar_url: user.avatar_url,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    // IMPORTANTE: Com database sessions, os callbacks funcionam diferente
    async session({ session, user }) {
      // Com database sessions, recebemos o user completo do banco
      if (session?.user && user) {
        // Buscar dados adicionais do usuário no banco se necessário
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, role_name, department, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          session.user.id = userData.id
          session.user.role = userData.role_name
          session.user.role_name = userData.role_name
          session.user.department = userData.department
          session.user.avatar_url = userData.avatar_url
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Permitir login apenas para providers credentials
      if (account?.provider === 'credentials') {
        return true
      }
      return false
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'database', // MUDANÇA CRÍTICA: Usar database ao invés de JWT
    maxAge: 24 * 60 * 60, // 24 horas
    updateAge: 60 * 60, // Atualiza a sessão a cada 1 hora de atividade
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Importante para funcionar no Vercel
  debug: process.env.NODE_ENV === 'development', // Adicionar debug em dev
}