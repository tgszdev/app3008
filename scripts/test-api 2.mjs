import axios from 'axios'

const API_URL = 'http://localhost:3000/api/users'

async function testAPI() {
  console.log('🧪 Testando API de Usuários\n')
  
  try {
    // 1. GET - Listar usuários
    console.log('📋 Teste 1: Listar todos os usuários')
    const { data: users } = await axios.get(API_URL)
    console.log(`✅ Encontrados ${users.length} usuários`)
    console.log('Primeiros 3 usuários:')
    users.slice(0, 3).forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
    })
    
    // 2. POST - Criar novo usuário
    console.log('\n📝 Teste 2: Criar novo usuário de teste')
    const newUser = {
      name: 'Teste API User',
      email: `test-${Date.now()}@example.com`,
      password: 'test123456',
      role: 'user',
      department: 'Teste',
      phone: '(11) 99999-0000'
    }
    
    try {
      const { data: created } = await axios.post(API_URL, newUser)
      console.log(`✅ Usuário criado: ${created.name} (${created.email})`)
      console.log(`   ID: ${created.id}`)
      
      // 3. PATCH - Atualizar usuário
      console.log('\n🔄 Teste 3: Atualizar usuário criado')
      const updateData = {
        id: created.id,
        name: 'Teste API User Atualizado',
        department: 'Teste Atualizado',
        is_active: false
      }
      
      const { data: updated } = await axios.patch(API_URL, updateData)
      console.log(`✅ Usuário atualizado: ${updated.name}`)
      console.log(`   Departamento: ${updated.department}`)
      console.log(`   Ativo: ${updated.is_active}`)
      
      // 4. DELETE - Excluir usuário
      console.log('\n🗑️ Teste 4: Excluir usuário de teste')
      const { data: deleteResult } = await axios.delete(`${API_URL}?id=${created.id}`)
      console.log(`✅ Usuário excluído com sucesso`)
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Email já cadastrado')) {
        console.log('⚠️ Email já existe (teste anterior não foi limpo)')
      } else {
        throw error
      }
    }
    
    // 5. Verificar contagem final
    console.log('\n📊 Teste 5: Verificar contagem final')
    const { data: finalUsers } = await axios.get(API_URL)
    console.log(`Total de usuários no banco: ${finalUsers.length}`)
    
    console.log('\n✨ Todos os testes passaram com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message)
    process.exit(1)
  }
}

testAPI()