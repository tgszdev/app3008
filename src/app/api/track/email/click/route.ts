import { NextRequest, NextResponse } from 'next/server'
import { decodeTrackingToken, trackEmailClick } from '@/lib/email-tracking'

/**
 * GET /api/track/email/click
 * Tracking de cliques em links do email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('t')
    const targetUrl = searchParams.get('url')
    
    if (!token || !targetUrl) {
      return NextResponse.redirect(process.env.NEXT_PUBLIC_URL || 'https://www.ithostbr.tech')
    }
    
    // Decodificar token
    const decoded = decodeTrackingToken(token)
    
    if (decoded) {
      // Registrar clique (async, não esperar)
      trackEmailClick(decoded.emailId, decoded.userId, targetUrl, {
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      }).catch(err => console.error('Error tracking email click:', err))
    }
    
    // Redirecionar para URL destino
    return NextResponse.redirect(targetUrl)
  } catch (error) {
    console.error('Error in email click tracking:', error)
    
    // Redirecionar mesmo em erro
    const targetUrl = request.nextUrl.searchParams.get('url')
    if (targetUrl) {
      return NextResponse.redirect(targetUrl)
    }
    
    return NextResponse.redirect(process.env.NEXT_PUBLIC_URL || 'https://www.ithostbr.tech')
  }
}

