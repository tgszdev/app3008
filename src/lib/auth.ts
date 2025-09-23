import NextAuth from 'next-auth'
import { authHybridConfig } from './auth-hybrid'

export const { auth, handlers, signIn, signOut } = NextAuth(authHybridConfig)