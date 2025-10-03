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
        config.pass = ''
      }
    }

    return NextResponse.json(config)
  } catch (error: any) {
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

    // Tentar salvar primeiro, se falhar por causa da tabela, retornar instruções
    try {
      // Primeiro tentar buscar para ver se a tabela existe
      const { error: checkError } = await supabaseAdmin
        .from('system_settings')
        .select('key')
        .eq('key', 'email_config')
        .maybeSingle()

      // Se a tabela não existir, retornar instruções SQL
      if (checkError && checkError.message?.includes('relation "public.system_settings" does not exist')) {
        const createTableQuery = `
-- Tabela para armazenar configurações do sistema
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
        `.trim()
        
        return NextResponse.json({
          error: 'Tabela de configurações não existe',
          message: 'Execute o script SQL abaixo no Supabase SQL Editor para criar a tabela system_settings',
          sql: createTableQuery,
          instructions: [
            '1. Acesse o Supabase Dashboard',
            '2. Vá para SQL Editor',
            '3. Cole e execute o script SQL fornecido',
            '4. Tente salvar novamente'
          ]
        }, { status: 400 })
      }
    } catch (checkErr) {
    }

    // Upsert configurações
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: 'email_config',
        value: configToSave,
        description: 'Configurações de email SMTP',
        // updated_at gerenciado automaticamente pelo Supabase
        updated_by: session.user.id
      }, {
        onConflict: 'key'
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Limpar o cache de configuração de email para forçar recarregamento
    const { clearEmailConfigCache } = await import('@/lib/email-config')
    clearEmailConfigCache()

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}