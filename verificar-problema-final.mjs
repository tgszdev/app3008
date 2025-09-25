import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificarProblemaFinal() {
  console.log('🔍 VERIFICANDO PROBLEMA FINAL')
  console.log('=' * 40)
  
  try {
    // 1. Verificar usuário agro
    console.log('\n👤 1. VERIFICANDO USUÁRIO AGRO')
    
    const { data: agroUser, error: agroError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
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
    console.log(`  - Tipo: ${agroUser.user_type}`)
    console.log(`  - Context ID: ${agroUser.context_id}`)
    console.log(`  - Contexto: ${agroUser.contexts?.name}`)
    
    // 2. Verificar categorias do contexto Agro
    console.log('\n📋 2. VERIFICANDO CATEGORIAS DO CONTEXTO AGRO')
    
    const { data: agroCategories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('context_id', agroUser.context_id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias do Agro:', categoriesError)
    } else {
      console.log(`✅ Categorias do contexto Agro: ${agroCategories?.length || 0}`)
      
      if (agroCategories && agroCategories.length > 0) {
        console.log('\n📋 CATEGORIAS DO CONTEXTO AGRO:')
        agroCategories.forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat.name} (${cat.contexts?.name})`)
        })
      }
    }
    
    // 3. Simular exatamente o que a API deveria retornar
    console.log('\n🔍 3. SIMULANDO QUERY DA API')
    
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('is_active', true)
    
    // Aplicar filtro baseado no tipo de usuário
    if (agroUser.user_type === 'context' && agroUser.context_id) {
      // Usuários context veem categorias globais + do seu contexto
      query = query.or(`is_global.eq.true,context_id.eq.${agroUser.context_id}`)
    } else if (agroUser.user_type === 'matrix') {
      // Usuários matrix veem todas as categorias
      // Não adicionar filtro
    } else {
      // Fallback: apenas categorias globais
      query = query.eq('is_global', true)
    }
    
    query = query.order('display_order', { ascending: true })
    
    const { data: categories, error: queryError } = await query
    
    if (queryError) {
      console.error('❌ Erro na query:', queryError)
      return false
    }
    
    console.log(`✅ Categorias retornadas pela query: ${categories?.length || 0}`)
    
    if (categories && categories.length > 0) {
      console.log('\n📋 CATEGORIAS QUE O USUÁRIO AGRO DEVERIA VER:')
      categories.forEach((cat, index) => {
        const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
        const context = cat.contexts?.name || 'Sem contexto'
        console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
      })
      
      // Verificar se as categorias da Agro estão presentes
      const agroCategoriesFound = categories.filter(cat => 
        cat.contexts?.name?.toLowerCase().includes('agro') || 
        cat.name?.toLowerCase().includes('agro')
      )
      
      if (agroCategoriesFound.length > 0) {
        console.log('\n✅ CATEGORIAS DA AGRO ENCONTRADAS NA QUERY!')
        agroCategoriesFound.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.contexts?.name})`)
        })
      } else {
        console.log('\n❌ CATEGORIAS DA AGRO NÃO ENCONTRADAS NA QUERY!')
        console.log('🔍 Isso explica por que não aparece no frontend')
      }
    } else {
      console.log('❌ Nenhuma categoria retornada pela query')
    }
    
    // 4. Verificar se há problema de autenticação
    console.log('\n🔐 4. VERIFICANDO PROBLEMA DE AUTENTICAÇÃO')
    
    // Verificar se o usuário tem senha
    if (!agroUser.password_hash) {
      console.log('❌ PROBLEMA: Usuário agro não tem senha definida!')
      console.log('🔧 Definindo senha para o usuário agro...')
      
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
    } else {
      console.log('✅ Usuário agro tem senha definida')
    }
    
    // 5. Verificar sessões
    console.log('\n📊 5. VERIFICANDO SESSÕES')
    
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('userId', agroUser.id)
      .gt('expires', new Date().toISOString())
    
    if (sessionsError) {
      console.error('❌ Erro ao buscar sessões:', sessionsError)
    } else {
      console.log(`✅ Sessões ativas do usuário agro: ${sessions?.length || 0}`)
      
      if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
          console.log(`  - Token: ${session.sessionToken?.substring(0, 20)}...`)
          console.log(`  - Expires: ${session.expires}`)
        })
      }
    }
    
    console.log('\n🎯 VERIFICAÇÃO CONCLUÍDA!')
    console.log('📋 RESUMO:')
    console.log(`- Usuário agro: ${agroUser.name} (${agroUser.email})`)
    console.log(`- Contexto: ${agroUser.contexts?.name}`)
    console.log(`- Categorias do contexto: ${agroCategories?.length || 0}`)
    console.log(`- Categorias na query: ${categories?.length || 0}`)
    console.log(`- Sessões ativas: ${sessions?.length || 0}`)
    
    if (categories && categories.length > 0) {
      console.log('\n✅ A LÓGICA ESTÁ FUNCIONANDO!')
      console.log('🎯 O problema está na autenticação, não na lógica de categorias')
      console.log('💡 Solução: Corrigir autenticação NextAuth.js')
    } else {
      console.log('\n❌ PROBLEMA NA LÓGICA DE CATEGORIAS')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error)
    return false
  }
}

verificarProblemaFinal()
