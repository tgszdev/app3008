/**
 * Utilidades para trabalhar com sessão de forma segura
 */

import { Session } from 'next-auth'

/**
 * Obtém o email do usuário da sessão de forma segura
 * @param session - Sessão do NextAuth
 * @returns Email do usuário ou null se não disponível
 */
export function getUserEmail(session: Session | null): string | null {
  if (!session?.user?.email) {
    return null
  }
  return session.user.email
}

/**
 * Valida se a sessão tem um email válido
 * @param session - Sessão do NextAuth
 * @returns true se o email existe e é válido
 */
export function hasValidEmail(session: Session | null): boolean {
  return !!(session?.user?.email && session.user.email.includes('@'))
}

/**
 * Obtém o email do usuário ou lança erro
 * @param session - Sessão do NextAuth
 * @returns Email do usuário
 * @throws Error se o email não estiver disponível
 */
export function requireUserEmail(session: Session | null): string {
  const email = getUserEmail(session)
  if (!email) {
    throw new Error('Email do usuário não encontrado na sessão')
  }
  return email
}