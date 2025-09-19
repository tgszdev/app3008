#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupEmailSystem() {
  console.log('🚀 Configurando sistema de email...')
  
  try {
    // 1. Criar tabela email_logs
    console.log('\n📧 Criando tabela email_logs...')
    const emailLogsSQL = fs.readFileSync(resolve(__dirname, '../sql/create_email_logs_table.sql'), 'utf8')
    
    const { error: emailLogsError } = await supabase.rpc('exec_sql', { 
      sql: emailLogsSQL 
    }).single()
    
    if (emailLogsError && !emailLogsError.message.includes('already exists')) {
      console.error('❌ Erro ao criar tabela email_logs:', emailLogsError)
    } else {
      console.log('✅ Tabela email_logs configurada')
    }
    
    // 2. Verificar se existe tabela system_settings
    console.log('\n⚙️ Verificando tabela system_settings...')
    const { data: settingsCheck, error: settingsCheckError } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1)
    
    if (settingsCheckError) {
      console.log('📝 Tabela system_settings não existe. Criando...')
      
      // Criar tabela system_settings
      const createSettingsSQL = `
        CREATE TABLE IF NOT EXISTS system_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- RLS
        ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
        
        -- Política: Todos podem ler
        CREATE POLICY "Todos podem ler configurações" ON system_settings
          FOR SELECT USING (true);
        
        -- Política: Apenas admins podem modificar
        CREATE POLICY "Admins podem modificar configurações" ON system_settings
          FOR ALL
          USING (
            auth.uid() IN (
              SELECT id FROM users WHERE role = 'admin'
            )
          );
      `
      
      const { error: createSettingsError } = await supabase.rpc('exec_sql', { 
        sql: createSettingsSQL 
      }).single()
      
      if (createSettingsError && !createSettingsError.message.includes('already exists')) {
        console.error('❌ Erro ao criar tabela system_settings:', createSettingsError)
      } else {
        console.log('✅ Tabela system_settings criada')
      }
    } else {
      console.log('✅ Tabela system_settings já existe')
    }
    
    // 3. Inserir configurações padrão de email
    console.log('\n📝 Configurando parâmetros de email...')
    
    const emailSettings = [
      {
        key: 'email_provider',
        value: 'supabase',
        description: 'Provedor de email (supabase, smtp, sendgrid, resend)'
      },
      {
        key: 'email_from',
        value: 'noreply@ithostbr.tech',
        description: 'Email remetente padrão'
      },
      {
        key: 'smtp_host',
        value: '',
        description: 'Host do servidor SMTP'
      },
      {
        key: 'smtp_port',
        value: '587',
        description: 'Porta do servidor SMTP'
      },
      {
        key: 'smtp_user',
        value: '',
        description: 'Usuário SMTP'
      },
      {
        key: 'smtp_pass',
        value: '',
        description: 'Senha SMTP'
      },
      {
        key: 'sendgrid_api_key',
        value: '',
        description: 'API Key do SendGrid'
      },
      {
        key: 'resend_api_key',
        value: '',
        description: 'API Key do Resend'
      }
    ]
    
    for (const setting of emailSettings) {
      const { error } = await supabase
        .from('system_settings')
        .upsert(setting, { onConflict: 'key' })
      
      if (error) {
        console.error(`❌ Erro ao configurar ${setting.key}:`, error.message)
      } else {
        console.log(`✅ Configuração ${setting.key} definida`)
      }
    }
    
    // 4. Verificar regras de escalação
    console.log('\n🔍 Verificando regras de escalação...')
    const { data: rules, error: rulesError } = await supabase
      .from('escalation_rules')
      .select('id, name, is_active')
    
    if (rulesError) {
      console.error('❌ Erro ao buscar regras de escalação:', rulesError)
    } else if (rules && rules.length > 0) {
      console.log(`✅ ${rules.length} regras de escalação encontradas:`)
      rules.forEach(rule => {
        console.log(`   - ${rule.name} (${rule.is_active ? 'Ativa' : 'Inativa'})`)
      })
    } else {
      console.log('⚠️ Nenhuma regra de escalação encontrada')
      console.log('💡 Crie regras de escalação no painel administrativo')
    }
    
    console.log('\n✅ Sistema de email configurado com sucesso!')
    console.log('\n📌 Próximos passos:')
    console.log('1. Configure o provedor de email no painel administrativo')
    console.log('2. Se usar SMTP, configure as credenciais')
    console.log('3. Se usar SendGrid/Resend, adicione a API Key')
    console.log('4. Teste o envio de emails com uma escalação manual')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

// Executar setup
setupEmailSystem().catch(console.error)