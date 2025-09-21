import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

console.log('🔄 Tentando executar SQL diretamente via API...\n')

// Usar fetch direto para a API do Supabase
async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`)
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    })
    
    if (response.ok) {
      console.log(`✅ Sucesso!`)
      return true
    } else {
      const error = await response.text()
      console.log(`❌ Falhou: ${error}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`)
    return false
  }
}

// Tentar usar a Management API
async function executeViaManagementAPI() {
  console.log('🔧 Tentando via Management API...\n')
  
  const managementUrl = 'https://api.supabase.com/v1'
  const projectRef = 'eyfvvximmeqmwdfqzqov'
  
  // Primeiro, vamos tentar adicionar as colunas uma por vez
  const alterTableSQLs = [
    {
      sql: `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMP WITH TIME ZONE;`,
      desc: 'Adicionar coluna invalidated_at'
    },
    {
      sql: `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invalidated_reason TEXT;`,
      desc: 'Adicionar coluna invalidated_reason'
    }
  ]
  
  for (const { sql, desc } of alterTableSQLs) {
    await executeSQL(sql, desc)
  }
  
  // Criar a função
  const functionSQL = `
CREATE OR REPLACE FUNCTION invalidate_old_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions 
  SET 
    expires = CURRENT_TIMESTAMP - INTERVAL '1 second',
    invalidated_at = CURRENT_TIMESTAMP,
    invalidated_reason = 'new_login_detected'
  WHERE 
    "userId" = NEW."userId"
    AND "sessionToken" != NEW."sessionToken"
    AND expires > CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`
  
  await executeSQL(functionSQL, 'Criar função de invalidação')
  
  // Criar trigger
  const triggerSQL = `
DROP TRIGGER IF EXISTS on_new_session ON sessions;
CREATE TRIGGER on_new_session
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION invalidate_old_sessions();`
  
  await executeSQL(triggerSQL, 'Criar trigger')
}

// Testar com query simples primeiro
async function testConnection() {
  console.log('🧪 Testando conexão com o banco...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Testar query simples
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .single()
    
    if (error) {
      console.log('❌ Erro na query de teste:', error.message)
    } else {
      console.log('✅ Conexão OK!')
    }
    
    // Verificar se podemos usar SQL direto
    console.log('\n🔍 Verificando capacidades SQL...')
    
    // Tentar criar uma função simples de teste
    const testFunctionSQL = `
CREATE OR REPLACE FUNCTION test_function_${Date.now()}()
RETURNS TEXT AS $$
BEGIN
  RETURN 'test';
END;
$$ LANGUAGE plpgsql;`
    
    const { error: funcError } = await supabase.rpc('query', { 
      query_text: testFunctionSQL 
    })
    
    if (funcError) {
      console.log('⚠️  Não é possível executar DDL diretamente via API')
      console.log('    Será necessário executar o SQL manualmente no Dashboard')
    } else {
      console.log('✅ DDL pode ser executado!')
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
}

// Executar testes
async function main() {
  await testConnection()
  await executeViaManagementAPI()
  
  console.log('\n' + '='.repeat(60))
  console.log('📌 AÇÃO NECESSÁRIA:')
  console.log('='.repeat(60))
  console.log('\nComo a API do Supabase não permite DDL direto via service key,')
  console.log('você precisa executar o SQL manualmente:\n')
  console.log('1. Acesse o Supabase Dashboard:')
  console.log('   https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov/sql/new\n')
  console.log('2. Execute o seguinte SQL:\n')
  
  const fullSQL = `
-- Adicionar colunas de controle
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invalidated_reason TEXT;

-- Criar função de invalidação
CREATE OR REPLACE FUNCTION invalidate_old_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions 
  SET 
    expires = CURRENT_TIMESTAMP - INTERVAL '1 second',
    invalidated_at = CURRENT_TIMESTAMP,
    invalidated_reason = 'new_login_detected'
  WHERE 
    "userId" = NEW."userId"
    AND "sessionToken" != NEW."sessionToken"
    AND expires > CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS on_new_session ON sessions;
CREATE TRIGGER on_new_session
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION invalidate_old_sessions();

-- Verificar se foi criado
SELECT 
  tgname as trigger_name,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_new_session';
`
  
  console.log(fullSQL)
  console.log('\n✅ Após executar, o trigger estará ativo!')
}

main()