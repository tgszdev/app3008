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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkTablesExist() {
  try {
    // Verificar tabela de tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id')
      .limit(1)
    
    if (ticketsError && ticketsError.code === '42P01') {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

async function setupTicketsTables() {
  console.log('🎫 Configurando sistema de chamados...\n')
  
  const tablesExist = await checkTablesExist()
  
  if (tablesExist) {
    console.log('✅ Tabelas de chamados já existem')
    
    // Verificar tickets existentes
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, status, priority')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (!error && tickets) {
      console.log(`\n📊 Total de chamados no banco: ${tickets.length || 0}`)
      if (tickets.length > 0) {
        console.log('🎫 Últimos chamados:')
        tickets.forEach(ticket => {
          console.log(`   - ${ticket.title} (${ticket.status} - ${ticket.priority})`)
        })
      }
    }
  } else {
    console.log('⚠️ Tabelas de chamados não encontradas')
    console.log('\n📝 Para criar as tabelas, execute o seguinte SQL no Supabase Dashboard:')
    console.log('👉 https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov/editor')
    console.log('\n--- COPIE E COLE O SQL ABAIXO ---\n')
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_create_tickets_table.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(sql)
    
    console.log('\n--- FIM DO SQL ---\n')
    console.log('✨ Após criar as tabelas, execute este script novamente para verificar')
    console.log('\n💡 Dica: Você pode executar o SQL diretamente no SQL Editor do Supabase')
  }
  
  // Verificar se há usuários para atribuir tickets
  const { data: users } = await supabase
    .from('users')
    .select('id, name, role')
    .in('role', ['admin', 'analyst'])
  
  if (users && users.length > 0) {
    console.log('\n👥 Analistas disponíveis para atribuição:')
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role})`)
    })
  }
}

setupTicketsTables().catch(console.error)