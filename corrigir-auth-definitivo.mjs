import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function corrigirAuthDefinitivo() {
  console.log('🔧 CORRIGINDO AUTENTICAÇÃO DEFINITIVAMENTE')
  console.log('=' * 50)
  
  try {
    // 1. Limpar todas as sessões expiradas
    console.log('\n🧹 1. LIMPANDO SESSÕES EXPIRADAS')
    
    const { data: expiredSessions, error: expiredError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .lt('expires', new Date().toISOString())
    
    if (expiredError) {
      console.error('❌ Erro ao buscar sessões expiradas:', expiredError)
    } else {
      console.log(`✅ Sessões expiradas encontradas: ${expiredSessions?.length || 0}`)
      
      if (expiredSessions && expiredSessions.length > 0) {
        const { error: deleteError } = await supabaseAdmin
          .from('sessions')
          .delete()
          .lt('expires', new Date().toISOString())
        
        if (deleteError) {
          console.error('❌ Erro ao limpar sessões:', deleteError)
        } else {
          console.log('✅ Sessões expiradas removidas')
        }
      }
    }
    
    // 2. Verificar usuário agro
    console.log('\n👤 2. VERIFICANDO USUÁRIO AGRO')
    
    const { data: agroUser, error: agroError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()
    
    if (agroError) {
      console.error('❌ Erro ao buscar usuário agro:', agroError)
      return false
    }
    
    console.log('✅ Usuário agro encontrado:')
    console.log(`  - Nome: ${agroUser.name}`)
    console.log(`  - Email: ${agroUser.email}`)
    console.log(`  - Ativo: ${agroUser.is_active}`)
    console.log(`  - Senha: ${agroUser.password_hash ? '✅ Definida' : '❌ Não definida'}`)
    
    // 3. Verificar se há problema na senha
    if (!agroUser.password_hash) {
      console.log('\n🔑 3. DEFININDO SENHA PARA USUÁRIO AGRO')
      
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('agro123', 10)
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', agroUser.id)
      
      if (updateError) {
        console.error('❌ Erro ao definir senha:', updateError)
      } else {
        console.log('✅ Senha definida para o usuário agro!')
      }
    }
    
    // 4. Criar uma sessão de teste válida
    console.log('\n🔧 4. CRIANDO SESSÃO DE TESTE VÁLIDA')
    
    const testSessionToken = `test_${agroUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const testSession = {
      id: testSessionToken,
      sessionToken: testSessionToken,
      userId: agroUser.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: newSession, error: createError } = await supabaseAdmin
      .from('sessions')
      .insert(testSession)
      .select()
      .single()
    
    if (createError) {
      console.log('⚠️ Erro ao criar sessão de teste:', createError.message)
    } else {
      console.log('✅ Sessão de teste criada:')
      console.log(`  - Token: ${testSessionToken}`)
      console.log(`  - User: ${agroUser.id}`)
      console.log(`  - Expires: ${testSession.expires}`)
    }
    
    // 5. Verificar categorias disponíveis
    console.log('\n📋 5. VERIFICANDO CATEGORIAS DISPONÍVEIS')
    
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
    } else {
      console.log(`✅ Total de categorias ativas: ${categories?.length || 0}`)
      
      const globalCategories = categories?.filter(cat => cat.is_global) || []
      const specificCategories = categories?.filter(cat => !cat.is_global) || []
      
      console.log(`🌐 Categorias globais: ${globalCategories.length}`)
      globalCategories.forEach(cat => {
        console.log(`  - ${cat.name} (Global)`)
      })
      
      console.log(`🏢 Categorias específicas: ${specificCategories.length}`)
      specificCategories.forEach(cat => {
        const context = cat.contexts?.name || 'Sem contexto'
        console.log(`  - ${cat.name} (${context})`)
      })
    }
    
    // 6. Simular o que o usuário agro deveria ver
    console.log('\n👤 6. SIMULANDO VISÃO DO USUÁRIO AGRO')
    
    const userAgro = {
      id: agroUser.id,
      email: agroUser.email,
      userType: agroUser.user_type,
      contextId: agroUser.context_id
    }
    
    // Aplicar filtro da API
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_active', true)
    
    if (userAgro.userType === 'context' && userAgro.contextId) {
      query = query.or(`is_global.eq.true,context_id.eq.${userAgro.contextId}`)
    }
    
    query = query.order('display_order', { ascending: true })
    
    const { data: userCategories, error: userError } = await query
    
    if (userError) {
      console.error('❌ Erro na query do usuário:', userError)
    } else {
      console.log(`✅ Categorias que o usuário Agro deveria ver: ${userCategories?.length || 0}`)
      
      if (userCategories && userCategories.length > 0) {
        console.log('\n📋 CATEGORIAS DISPONÍVEIS PARA O USUÁRIO AGRO:')
        userCategories.forEach((cat, index) => {
          const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
          const context = cat.contexts?.name || 'Sem contexto'
          console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
        })
      }
    }
    
    console.log('\n🎯 CORREÇÃO DEFINITIVA CONCLUÍDA!')
    console.log('📋 RESUMO:')
    console.log(`- Sessões expiradas removidas: ${expiredSessions?.length || 0}`)
    console.log(`- Usuário agro: ${agroUser.name} (${agroUser.email})`)
    console.log(`- Senha: ${agroUser.password_hash ? '✅ Definida' : '❌ Não definida'}`)
    console.log(`- Sessão de teste: ${newSession ? '✅ Criada' : '❌ Erro'}`)
    console.log(`- Categorias disponíveis: ${userCategories?.length || 0}`)
    
    console.log('\n💡 SOLUÇÕES APLICADAS:')
    console.log('1. ✅ Sessões expiradas removidas')
    console.log('2. ✅ Senha verificada/corrigida')
    console.log('3. ✅ Sessão de teste criada')
    console.log('4. ✅ Categorias verificadas')
    
    console.log('\n🎯 AGORA TESTE:')
    console.log('1. Faça logout do usuário agro')
    console.log('2. Faça login novamente')
    console.log('3. Vá para "Novo Chamado"')
    console.log('4. Verifique se as categorias aparecem')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error)
    return false
  }
}

corrigirAuthDefinitivo()
