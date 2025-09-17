import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const emailConfig = {
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'not-set',
      EMAIL_API_KEY: process.env.EMAIL_API_KEY ? '***configured***' : 'not-set',
      EMAIL_FROM: process.env.EMAIL_FROM || 'not-set',
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'not-set',
      hasEmailApiKey: !!process.env.EMAIL_API_KEY,
      hasEmailService: !!process.env.EMAIL_SERVICE,
      hasEmailFrom: !!process.env.EMAIL_FROM,
      hasEmailFromName: !!process.env.EMAIL_FROM_NAME,
    };

    return NextResponse.json({
      success: true,
      message: 'Configuração de e-mail verificada',
      emailConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao verificar configuração de e-mail',
      details: error.message 
    }, { status: 500 });
  }
}
