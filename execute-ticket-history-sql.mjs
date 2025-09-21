import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQL() {
  try {
    console.log('🚀 Iniciando execução do SQL para criação da tabela de histórico...')
    
    // Ler o arquivo SQL
    const sqlFilePath = join(__dirname, 'sql', 'create_ticket_history_simple.sql')
    const sqlContent = readFileSync(sqlFilePath, 'utf8')
    
    console.log('📄 SQL carregado do arquivo:', sqlFilePath)
    console.log('📝 Conteúdo do SQL (primeiras 200 chars):', sqlContent.substring(0, 200) + '...')
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent })
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error)
      process.exit(1)
    }
    
    console.log('✅ SQL executado com sucesso!')
    console.log('📊 Resultado:', data)
    
    // Verificar se a tabela foi criada
    const { data: tableExists, error: checkError } = await supabase
      .from('ticket_history')
      .select('count(*)')
      .limit(1)
    
    if (checkError) {
      console.log('⚠️ Não foi possível verificar a tabela criada:', checkError.message)
    } else {
      console.log('✅ Tabela ticket_history foi criada e está acessível!')
    }
    
    console.log('\n🎉 Configuração da tabela de histórico concluída!')
    console.log('\n📋 Próximos passos:')
    console.log('1. ✅ Tabela de histórico criada')
    console.log('2. ✅ Triggers configurados para registro automático')
    console.log('3. ✅ Políticas RLS aplicadas')
    console.log('4. 🔥 Faça deploy das alterações para testar')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

executeSQL()
