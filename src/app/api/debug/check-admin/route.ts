import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Buscar o usuário admin
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('email, name, role, is_active, password_hash')
      .eq('email', 'admin@example.com')
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'User not found',
        details: error.message 
      }, { status: 404 })
    }

    // Testar se a senha admin123 funciona
    const testPassword = await bcrypt.compare('admin123', user.password_hash)
    
    // Gerar um novo hash para comparação
    const newHash = await bcrypt.hash('admin123', 10)

    return NextResponse.json({
      userFound: true,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active,
      passwordHashExists: !!user.password_hash,
      passwordHashLength: user.password_hash?.length,
      passwordTestResult: testPassword,
      expectedHash: '$2a$10$qVPQejPGUNnzBOX1Gut4buUVLXauhbR6QY.sDk9SHV7Rg1sepaive',
      actualHashMatches: user.password_hash === '$2a$10$qVPQejPGUNnzBOX1Gut4buUVLXauhbR6QY.sDk9SHV7Rg1sepaive',
      newHashExample: newHash,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error.message 
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'