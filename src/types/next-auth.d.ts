import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: string
    department?: string
    avatar_url?: string
  }

  interface Session {
    user: {
      id: string
      role: string
      department?: string
      avatar_url?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    department?: string
    avatar_url?: string
  }
}