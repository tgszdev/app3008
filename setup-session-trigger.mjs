import { createClient } from '@supabase/supabase-js'

// Credenciais fornecidas
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🚀 Iniciando configuração do trigger de sessão única...\n')

async function executeSql(sql, description) {
  console.log(`📝 ${description}...`)
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql }).single()
    
    if (error) {
      // Tentar método alternativo
      const { error: altError } = await supabase.from('_sql').insert({ query: sql })
      if (altError) {
        throw altError
      }
    }
    console.log(`✅ ${description} - Concluído!\n`)
    return true
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`)
    console.log('Tentando método alternativo...\n')
    return false
  }
}

// SQL para adicionar colunas
const addColumnsSQL = `
-- Adicionar coluna invalidated_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'invalidated_at'
  ) THEN
    ALTER TABLE sessions 
    ADD COLUMN invalidated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Adicionar coluna invalidated_reason se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'invalidated_reason'
  ) THEN
    ALTER TABLE sessions 
    ADD COLUMN invalidated_reason TEXT;
  END IF;
END $$;
`

// SQL para criar a função de invalidação
const createFunctionSQL = `
CREATE OR REPLACE FUNCTION invalidate_old_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para debug
  RAISE NOTICE 'Invalidating old sessions for user: %', NEW."userId";
  
  -- Invalida todas as sessões antigas do mesmo usuário
  UPDATE sessions 
  SET 
    expires = CURRENT_TIMESTAMP - INTERVAL '1 second',
    invalidated_at = CURRENT_TIMESTAMP,
    invalidated_reason = 'new_login_detected'
  WHERE 
    "userId" = NEW."userId"
    AND "sessionToken" != NEW."sessionToken"
    AND expires > CURRENT_TIMESTAMP;
  
  -- Retorna o novo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`

// SQL para criar o trigger
const createTriggerSQL = `
-- Remove trigger se existir
DROP TRIGGER IF EXISTS on_new_session ON sessions;

-- Cria novo trigger
CREATE TRIGGER on_new_session
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION invalidate_old_sessions();
`

// SQL para testar se está funcionando
const testSQL = `
-- Verificar se as colunas foram adicionadas
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'sessions' 
  AND column_name IN ('invalidated_at', 'invalidated_reason');
`

async function main() {
  try {
    // Executar via API SQL do Supabase
    console.log('🔧 Método 1: Tentando executar via Supabase Dashboard SQL Editor...\n')
    
    // Como não temos acesso direto ao RPC, vamos usar uma abordagem diferente
    // Vamos criar um arquivo SQL para ser executado manualmente
    
    const fullSQL = `
-- ================================================
-- Script de Configuração de Sessão Única
-- ================================================

${addColumnsSQL}

${createFunctionSQL}

${createTriggerSQL}

-- Verificar resultado
${testSQL}
`
    
    // Salvar SQL em arquivo
    const fs = await import('fs')
    fs.writeFileSync('/home/user/webapp/sql/setup_session_trigger.sql', fullSQL)
    
    console.log('📄 Arquivo SQL criado: /home/user/webapp/sql/setup_session_trigger.sql')
    console.log('\n⚠️  IMPORTANTE: Como não tenho acesso direto para executar DDL no Supabase,')
    console.log('    você precisa executar este SQL no Supabase Dashboard:')
    console.log('\n📋 Passos:')
    console.log('1. Acesse: https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov/sql')
    console.log('2. Cole o conteúdo do arquivo sql/setup_session_trigger.sql')
    console.log('3. Execute o SQL')
    console.log('\n🎯 O script irá:')
    console.log('   - Adicionar colunas invalidated_at e invalidated_reason')
    console.log('   - Criar função invalidate_old_sessions()')
    console.log('   - Criar trigger on_new_session')
    console.log('   - Verificar se tudo foi criado corretamente')
    
    // Verificar estado atual
    console.log('\n📊 Estado atual do banco:')
    const { data: sessions, count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .gt('expires', new Date().toISOString())
    
    console.log(`- Sessões ativas: ${count}`)
    
    if (sessions && sessions.length > 0) {
      const userMap = {}
      sessions.forEach(s => {
        if (!userMap[s.userId]) userMap[s.userId] = 0
        userMap[s.userId]++
      })
      
      Object.entries(userMap).forEach(([userId, count]) => {
        if (count > 1) {
          console.log(`  ⚠️ Usuário ${userId} tem ${count} sessões ativas`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

main()