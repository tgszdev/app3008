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

async function debugNivelUsuario() {
  console.log('🔍 DEBUG NÍVEL DO USUÁRIO')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar usuário agro
    console.log('\n1️⃣ VERIFICANDO USUÁRIO AGRO...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      context_id: user.context_id,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    })

    // 2. Verificar se o usuário está ativo
    console.log('\n2️⃣ VERIFICANDO STATUS DO USUÁRIO...')
    if (user.is_active === false) {
      console.log('❌ PROBLEMA: Usuário está INATIVO!')
      console.log('🔧 SOLUÇÃO: Ativar usuário no banco de dados')
    } else {
      console.log('✅ Usuário está ativo')
    }

    // 3. Verificar nível de permissão
    console.log('\n3️⃣ VERIFICANDO NÍVEL DE PERMISSÃO...')
    console.log(`📊 Role atual: ${user.role}`)
    
    if (user.role === 'user') {
      console.log('⚠️ ATENÇÃO: Usuário com role "user" (nível baixo)')
      console.log('🔍 Isso pode estar causando problemas de RLS')
    } else if (user.role === 'admin') {
      console.log('✅ Usuário com role "admin" (nível alto)')
    } else if (user.role === 'analyst') {
      console.log('✅ Usuário com role "analyst" (nível médio)')
    } else {
      console.log(`⚠️ Role desconhecido: ${user.role}`)
    }

    // 4. Verificar se há outros usuários com roles diferentes
    console.log('\n4️⃣ VERIFICANDO OUTROS USUÁRIOS...')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, role, user_type, is_active')
      .order('created_at', { ascending: false })

    if (allUsersError) {
      console.log('⚠️ Não foi possível verificar outros usuários')
    } else {
      console.log('✅ Total de usuários:', allUsers.length)
      console.log('📋 Lista de usuários:')
      allUsers.forEach((u, index) => {
        console.log(`  ${index + 1}. ${u.email}`)
        console.log(`     - Role: ${u.role}`)
        console.log(`     - Tipo: ${u.user_type}`)
        console.log(`     - Ativo: ${u.is_active}`)
        console.log('')
      })
    }

    // 5. Verificar se há usuários admin
    console.log('\n5️⃣ VERIFICANDO USUÁRIOS ADMIN...')
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')

    if (adminError) {
      console.log('⚠️ Não foi possível verificar usuários admin')
    } else {
      console.log('✅ Usuários admin encontrados:', adminUsers.length)
      adminUsers.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.user_type})`)
      })
    }

    // 6. Testar com diferentes roles
    console.log('\n6️⃣ TESTANDO COM DIFERENTES ROLES...')
    
    // Testar se o problema é específico do role 'user'
    const { data: userRoleTest, error: userRoleError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'user')
      .limit(5)

    if (userRoleError) {
      console.log('❌ Erro ao buscar usuários com role "user":', userRoleError.message)
    } else {
      console.log('✅ Usuários com role "user" encontrados:', userRoleTest.length)
    }

    // 7. Verificar se há problemas de RLS específicos por role
    console.log('\n7️⃣ VERIFICANDO RLS POR ROLE...')
    
    // Testar JWT com usuário agro
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Tentar buscar o próprio usuário
    const { data: selfUser, error: selfError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (selfError) {
      console.log('❌ Erro ao buscar próprio usuário com JWT:', selfError.message)
      console.log('🔍 Isso indica problema de RLS específico para role "user"')
    } else {
      console.log('✅ Próprio usuário encontrado com JWT:', selfUser.email)
    }

    // 8. Verificar se há políticas RLS específicas por role
    console.log('\n8️⃣ VERIFICANDO POLÍTICAS RLS ESPECÍFICAS...')
    
    // Tentar buscar categorias com JWT
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select('*')
      .eq('is_global', true)

    if (authError) {
      console.log('❌ Erro ao buscar categorias globais com JWT:', authError.message)
      console.log('🔍 Isso indica problema de RLS nas categorias também')
    } else {
      console.log('✅ Categorias globais encontradas com JWT:', authCategories.length)
    }

    // 9. Diagnóstico final
    console.log('\n9️⃣ DIAGNÓSTICO FINAL...')
    console.log('📋 PROBLEMAS IDENTIFICADOS:')
    
    if (user.role === 'user') {
      console.log('❌ 1. Usuário com role "user" (nível baixo)')
      console.log('   - Pode estar causando problemas de RLS')
      console.log('   - Políticas RLS podem estar bloqueando acesso')
    }
    
    if (user.is_active === false) {
      console.log('❌ 2. Usuário inativo')
      console.log('   - Usuário pode estar desabilitado')
    }
    
    if (selfError) {
      console.log('❌ 3. RLS bloqueando acesso ao próprio usuário')
      console.log('   - Políticas RLS muito restritivas')
    }
    
    if (authError) {
      console.log('❌ 4. RLS bloqueando acesso às categorias')
      console.log('   - Políticas RLS bloqueando categorias')
    }

    console.log('\n🔧 SOLUÇÕES RECOMENDADAS:')
    console.log('1. Executar SQL no Supabase Dashboard para corrigir RLS')
    console.log('2. Verificar se o usuário está ativo')
    console.log('3. Considerar alterar role do usuário para "admin" temporariamente')
    console.log('4. Verificar políticas RLS específicas para role "user"')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugNivelUsuario()
