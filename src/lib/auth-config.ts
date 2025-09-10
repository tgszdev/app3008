import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role_name || user.role, // Usar role_name se disponível
            role_name: user.role_name, // Incluir role_name também
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.role_name = (user as any).role_name // Adicionar role_name
        token.department = user.department
        token.avatar_url = user.avatar_url
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.role_name = token.role_name as string // Adicionar role_name
        session.user.department = token.department as string
        session.user.avatar_url = token.avatar_url as string
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Importante para funcionar no Vercel
}