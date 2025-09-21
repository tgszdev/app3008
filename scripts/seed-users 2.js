import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

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

const testUsers = [
  {
    email: 'analyst1@example.com',
    name: 'Ana Silva',
    password: 'analyst123',
    role: 'analyst',
    department: 'Suporte Técnico',
    phone: '(11) 98765-4321',
    is_active: true
  },
  {
    email: 'analyst2@example.com',
    name: 'Carlos Santos',
    password: 'analyst123',
    role: 'analyst',
    department: 'Infraestrutura',
    phone: '(11) 98765-1234',
    is_active: true
  },
  {
    email: 'user1@example.com',
    name: 'Maria Oliveira',
    password: 'user123',
    role: 'user',
    department: 'Vendas',
    phone: '(11) 99999-8888',
    is_active: true
  },
  {
    email: 'user2@example.com',
    name: 'João Pereira',
    password: 'user123',
    role: 'user',
    department: 'Marketing',
    phone: '(11) 99999-7777',
    is_active: true
  },
  {
    email: 'user3@example.com',
    name: 'Fernanda Costa',
    password: 'user123',
    role: 'user',
    department: 'Recursos Humanos',
    phone: '(11) 99999-6666',
    is_active: false // Usuário inativo para teste
  }
]

async function seedUsers() {
  console.log('🌱 Iniciando seed de usuários...')
  
  for (const userData of testUsers) {
    try {
      // Verificar se o usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', userData.email)
        .single()
      
      if (existingUser) {
        console.log(`⏭️ Usuário ${userData.email} já existe, pulando...`)
        continue
      }
      
      // Hash da senha
      const password_hash = await bcrypt.hash(userData.password, 10)
      
      // Criar usuário
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          password: undefined, // Remover campo password
          password_hash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, email, name')
        .single()
      
      if (error) {
        console.error(`❌ Erro ao criar usuário ${userData.email}:`, error)
      } else {
        console.log(`✅ Usuário criado: ${newUser.name} (${newUser.email})`)
      }
    } catch (error) {
      console.error(`❌ Erro ao processar usuário ${userData.email}:`, error)
    }
  }
  
  // Mostrar resumo final
  console.log('\n📊 Resumo final:')
  const { data: allUsers, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active')
    .order('created_at', { ascending: false })
  
  if (!error && allUsers) {
    console.log(`Total de usuários no banco: ${allUsers.length}`)
    console.log('\n👥 Lista de usuários:')
    allUsers.forEach(user => {
      const status = user.is_active ? '✅' : '❌'
      console.log(`   ${status} ${user.name} (${user.email}) - ${user.role}`)
    })
  }
  
  console.log('\n✨ Seed concluído!')
  console.log('📝 Senhas de teste:')
  console.log('   - admin@example.com: admin123')
  console.log('   - analyst1@example.com: analyst123')
  console.log('   - analyst2@example.com: analyst123')
  console.log('   - user1@example.com: user123')
  console.log('   - user2@example.com: user123')
  console.log('   - user3@example.com: user123')
}

seedUsers().catch(console.error)