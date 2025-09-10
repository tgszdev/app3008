import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      role_name?: string
      department?: string
      avatar_url?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    role_name?: string
    department?: string
    avatar_url?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    role_name?: string
    department?: string
    avatar_url?: string
  }
}