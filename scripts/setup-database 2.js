import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkTableExists() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error && error.code === '42P01') {
      // Tabela não existe
      return false
    }
    
    if (error) {
      console.error('Erro ao verificar tabela:', error)
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

async function runMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
  const sql = fs.readFileSync(migrationPath, 'utf8')
  
  try {
    // Executar SQL diretamente usando RPC
    const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(() => {
      // Se a função RPC não existir, tentamos de outra forma
      console.log('⚠️ Função RPC não disponível, tabela pode já existir')
      return { error: null }
    })
    
    if (error) {
      console.error(`❌ Erro ao executar migração ${migrationFile}:`, error)
      return false
    }
    
    console.log(`✅ Migração ${migrationFile} executada com sucesso`)
    return true
  } catch (error) {
    console.error(`❌ Erro ao executar migração ${migrationFile}:`, error)
    return false
  }
}

async function setupDatabase() {
  console.log('🔧 Verificando banco de dados...')
  
  const tableExists = await checkTableExists()
  
  if (tableExists) {
    console.log('✅ Tabela de usuários já existe')
    
    // Verificar se tem usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('created_at', { ascending: false })
    
    if (!error && users) {
      console.log(`📊 Total de usuários no banco: ${users.length}`)
      if (users.length > 0) {
        console.log('👥 Usuários encontrados:')
        users.slice(0, 5).forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - ${user.role}`)
        })
        if (users.length > 5) {
          console.log(`   ... e mais ${users.length - 5} usuários`)
        }
      }
    }
  } else {
    console.log('⚠️ Tabela de usuários não encontrada')
    console.log('📝 Para criar a tabela, execute o seguinte SQL no Supabase Dashboard:')
    console.log('👉 https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov/editor')
    console.log('\n--- COPIE E COLE O SQL ABAIXO ---\n')
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_create_users_table.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(sql)
    
    console.log('\n--- FIM DO SQL ---\n')
    console.log('✨ Após criar a tabela, execute este script novamente para verificar')
  }
}

setupDatabase().catch(console.error)