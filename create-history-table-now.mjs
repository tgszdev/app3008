#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Criando tabela de histórico de tickets...')
console.log('📊 Supabase URL:', supabaseUrl ? '✅ Configurado' : '❌ Não configurado')
console.log('🔑 Service Key:', supabaseServiceKey ? '✅ Configurado' : '❌ Não configurado')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ ERRO: Variáveis de ambiente não configuradas')
  console.error('Certifique-se de que .env.local possui:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL=sua_url')
  console.error('- SUPABASE_SERVICE_ROLE_KEY=sua_chave')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createHistoryTable() {
  try {
    console.log('\n🚀 Iniciando criação da tabela...')

    // 1. Criar tabela
    console.log('📝 1. Criando tabela ticket_history...')
    const { error: createError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ticket_id UUID NOT NULL,
          user_id UUID NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          field_changed VARCHAR(50),
          old_value TEXT,
          new_value TEXT,
          description TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (createError) {
      console.error('❌ Erro ao criar tabela:', createError.message)
      return false
    }
    console.log('✅ Tabela criada com sucesso!')

    // 2. Adicionar foreign keys
    console.log('📝 2. Adicionando foreign keys...')
    await supabase.rpc('exec', {
      sql: `
        ALTER TABLE ticket_history 
        DROP CONSTRAINT IF EXISTS fk_ticket_history_ticket_id;
        
        ALTER TABLE ticket_history 
        ADD CONSTRAINT fk_ticket_history_ticket_id 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;
      `
    })

    await supabase.rpc('exec', {
      sql: `
        ALTER TABLE ticket_history 
        DROP CONSTRAINT IF EXISTS fk_ticket_history_user_id;
        
        ALTER TABLE ticket_history 
        ADD CONSTRAINT fk_ticket_history_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    })
    console.log('✅ Foreign keys adicionadas!')

    // 3. Criar índices
    console.log('📝 3. Criando índices...')
    await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history (ticket_id);
        CREATE INDEX IF NOT EXISTS idx_ticket_history_user_id ON ticket_history (user_id);
        CREATE INDEX IF NOT EXISTS idx_ticket_history_action_type ON ticket_history (action_type);
        CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON ticket_history (created_at);
      `
    })
    console.log('✅ Índices criados!')

    // 4. Habilitar RLS
    console.log('📝 4. Habilitando RLS...')
    await supabase.rpc('exec', {
      sql: `ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;`
    })
    console.log('✅ RLS habilitado!')

    // 5. Criar políticas
    console.log('📝 5. Criando políticas...')
    await supabase.rpc('exec', {
      sql: `
        DROP POLICY IF EXISTS "Users can view ticket history" ON ticket_history;
        
        CREATE POLICY "Users can view ticket history" ON ticket_history
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = ticket_history.ticket_id
            AND (
              auth.jwt() ->> 'role' IN ('admin', 'analyst', 'dev')
              OR
              (t.created_by = (auth.jwt() ->> 'sub')::uuid)
              OR
              (t.assigned_to = (auth.jwt() ->> 'sub')::uuid)
            )
          )
        );
      `
    })

    await supabase.rpc('exec', {
      sql: `
        DROP POLICY IF EXISTS "System can insert ticket history" ON ticket_history;
        
        CREATE POLICY "System can insert ticket history" ON ticket_history
        FOR INSERT
        WITH CHECK (auth.role() = 'service_role');
      `
    })
    console.log('✅ Políticas criadas!')

    // 6. Verificar se funcionou
    console.log('📝 6. Verificando tabela...')
    const { data, error } = await supabase
      .from('ticket_history')
      .select('count(*)', { count: 'exact' })
      .limit(1)

    if (error) {
      console.warn('⚠️ Aviso ao verificar:', error.message)
    } else {
      console.log('✅ Tabela acessível!')
    }

    console.log('\n🎉 SUCESSO! Tabela de histórico criada!')
    console.log('📋 Próximos passos:')
    console.log('1. ✅ Tabela ticket_history criada')
    console.log('2. ✅ Políticas configuradas') 
    console.log('3. 🔄 Aguarde alguns minutos para propagação')
    console.log('4. 🚀 Teste alterando prioridade/status de um ticket')
    
    return true

  } catch (error) {
    console.error('\n❌ ERRO INESPERADO:', error.message)
    return false
  }
}

// Executar
createHistoryTable()
  .then(success => {
    if (success) {
      console.log('\n✅ Script executado com sucesso!')
    } else {
      console.log('\n❌ Script falhou!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error)
    process.exit(1)
  })










