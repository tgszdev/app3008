import { NextRequest, NextResponse } from 'next/server'
import { decodeTrackingToken, trackEmailOpen } from '@/lib/email-tracking'

/**
 * GET /api/track/email/open
 * Tracking de abertura de email (pixel transparente 1x1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('t')
    
    if (!token) {
      return new NextResponse(null, { status: 400 })
    }
    
    // Decodificar token
    const decoded = decodeTrackingToken(token)
    
    if (!decoded) {
      return new NextResponse(null, { status: 400 })
    }
    
    // Registrar abertura (async, não esperar)
    trackEmailOpen(decoded.emailId, decoded.userId, {
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    }).catch(err => console.error('Error tracking email open:', err))
    
    // Retornar pixel transparente 1x1
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error in email open tracking:', error)
    
    // Retornar pixel mesmo em erro
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif'
      }
    })
  }
}

