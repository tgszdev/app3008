import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Chave para criptografar senhas (em produção, use uma variável de ambiente)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this'

// Função para criptografar
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

// Função para descriptografar
function decrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const [ivHex, encrypted] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// GET - Buscar configurações de email
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem ver configurações de email
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar configurações do banco
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
      console.error('Erro ao buscar configurações:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!settings) {
      // Retornar configurações padrão
      return NextResponse.json({
        service: 'smtp',
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        user: '',
        pass: '',
        from: '',
        fromName: 'Sistema de Suporte Técnico'
      })
    }

    // Descriptografar senha antes de enviar
    const config = settings.value
    if (config.pass) {
      try {
        config.pass = decrypt(config.pass)
      } catch (e) {
        console.error('Erro ao descriptografar senha:', e)
        config.pass = ''
      }
    }

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Salvar configurações de email
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem configurar email
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const config = await request.json()

    // Validação básica
    if (!config.host || !config.port || !config.user || !config.pass) {
      return NextResponse.json(
        { error: 'Configurações incompletas' },
        { status: 400 }
      )
    }

    // Criptografar senha antes de salvar
    const configToSave = { ...config }
    configToSave.pass = encrypt(config.pass)

    // Primeiro, verificar se a tabela system_settings existe
    const { error: tableError } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .limit(1)

    if (tableError && tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
      // Criar tabela se não existir
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS system_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by UUID REFERENCES users(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
      `
      
      // Nota: Não podemos executar SQL diretamente via Supabase Admin API
      // Retornar instruções para criar a tabela
      return NextResponse.json({
        error: 'Tabela system_settings não existe. Execute o script SQL no Supabase.',
        sql: createTableQuery
      }, { status: 500 })
    }

    // Upsert configurações
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: 'email_config',
        value: configToSave,
        description: 'Configurações de email SMTP',
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      }, {
        onConflict: 'key'
      })

    if (error) {
      console.error('Erro ao salvar configurações:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Salvar também nas variáveis de ambiente para uso imediato
    // (Em produção, você deve reiniciar o servidor ou usar um sistema de cache)
    process.env.EMAIL_SERVICE = config.service || 'smtp'
    process.env.SMTP_HOST = config.host
    process.env.SMTP_PORT = config.port
    process.env.SMTP_SECURE = config.secure ? 'true' : 'false'
    process.env.SMTP_USER = config.user
    process.env.SMTP_PASS = config.pass
    process.env.EMAIL_FROM = config.from || config.user
    process.env.EMAIL_FROM_NAME = config.fromName

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}