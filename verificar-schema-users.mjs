import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarSchemaUsers() {
  console.log('🔍 VERIFICANDO SCHEMA DA TABELA USERS')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar estrutura da tabela users
    console.log('\n1️⃣ VERIFICANDO ESTRUTURA DA TABELA USERS...')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })

    if (columnsError) {
      console.log('❌ Erro ao buscar colunas:', columnsError.message)
      
      // Tentar método alternativo
      console.log('\n2️⃣ TENTANDO MÉTODO ALTERNATIVO...')
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1)

      if (usersError) {
        console.error('❌ Erro ao acessar tabela users:', usersError.message)
        return
      }

      if (users && users.length > 0) {
        console.log('✅ Colunas encontradas na tabela users:')
        Object.keys(users[0]).forEach(column => {
          console.log(`  - ${column}`)
        })
      }
    } else {
      console.log('✅ Colunas da tabela users:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`)
      })
    }

    // 2. Verificar se a coluna phone existe
    console.log('\n3️⃣ VERIFICANDO SE COLUNA PHONE EXISTE...')
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .limit(1)

    if (testError) {
      console.log('❌ Coluna phone não existe:', testError.message)
      
      // 3. Adicionar coluna phone se não existir
      console.log('\n4️⃣ ADICIONANDO COLUNA PHONE...')
      const { error: alterError } = await supabase
        .rpc('add_column_if_not_exists', {
          table_name: 'users',
          column_name: 'phone',
          column_type: 'text'
        })

      if (alterError) {
        console.log('❌ Erro ao adicionar coluna phone:', alterError.message)
        
        // Tentar SQL direto
        console.log('\n5️⃣ TENTANDO SQL DIRETO...')
        const { error: sqlError } = await supabase
          .from('users')
          .select('*')
          .limit(0) // Apenas para testar conexão
        
        if (sqlError) {
          console.log('❌ Erro de conexão:', sqlError.message)
        } else {
          console.log('✅ Conexão OK, mas coluna phone não existe')
          console.log('🔧 Execute este SQL no Supabase:')
          console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;')
        }
      } else {
        console.log('✅ Coluna phone adicionada com sucesso!')
      }
    } else {
      console.log('✅ Coluna phone existe e está funcionando!')
      console.log('📋 Dados do usuário de teste:', testUser[0])
    }

    // 4. Verificar outras colunas necessárias
    console.log('\n6️⃣ VERIFICANDO OUTRAS COLUNAS NECESSÁRIAS...')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (allUsersError) {
      console.log('❌ Erro ao buscar usuários:', allUsersError.message)
    } else if (allUsers && allUsers.length > 0) {
      const user = allUsers[0]
      console.log('✅ Colunas disponíveis na tabela users:')
      Object.keys(user).forEach(key => {
        console.log(`  - ${key}: ${typeof user[key]}`)
      })
      
      // Verificar colunas esperadas
      const expectedColumns = ['id', 'name', 'email', 'role', 'department', 'phone', 'is_active', 'user_type', 'context_id']
      console.log('\n📋 VERIFICANDO COLUNAS ESPERADAS:')
      expectedColumns.forEach(col => {
        const exists = col in user
        console.log(`  - ${col}: ${exists ? '✅' : '❌'}`)
      })
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verificarSchemaUsers()
