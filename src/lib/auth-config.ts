import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase'

async function verifyPassword(password: string, hashedPassword: string) {
  // Como bcrypt não funciona no Edge Runtime do Vercel,
  // vamos usar uma verificação temporária ou delegar para uma API route
  // Em produção, você deve usar uma API route separada para verificação de senha
  
  // Por enquanto, vamos fazer uma verificação simples para desenvolvimento
  // IMPORTANTE: Em produção, implemente uma API route adequada
  if (process.env.NODE_ENV === 'development') {
    // Para desenvolvimento, aceita a senha admin123
    return password === 'admin123' && hashedPassword.startsWith('$2a$10$')
  }
  
  // Em produção, você deve chamar uma API route que use bcrypt no servidor Node.js
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, hashedPassword }),
  })
  
  if (!response.ok) return false
  const { valid } = await response.json()
  return valid
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
          return null
        }

        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .eq('is_active', true)
          .single()

        if (error || !user) {
          return null
        }

        // Verificação temporária para desenvolvimento
        // Em produção, use a API route /api/auth/verify-password
        const isValidPassword = await verifyPassword(
          credentials.password as string,
          user.password_hash
        )

        if (!isValidPassword) {
          return null
        }

        // Update last login
        await supabaseAdmin
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          avatar_url: user.avatar_url,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = user.department
        token.avatar_url = user.avatar_url
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
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
}