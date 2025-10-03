import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        authenticated: false
      }, { status: 401 })
    }
    
    if (!session.user) {
      return NextResponse.json({ 
        error: 'No user in session',
        authenticated: false,
        session: !!session
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      session: {
        exists: !!session,
        user: !!session.user
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Auth error',
      details: error.message,
      authenticated: false
    }, { status: 500 })
  }
}
