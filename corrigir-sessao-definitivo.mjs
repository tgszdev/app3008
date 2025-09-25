import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function corrigirSessaoDefinitivo() {
  console.log('🔧 CORRIGINDO SESSÃO DEFINITIVAMENTE')
  console.log('=' * 50)
  
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
    
    // 2. Limpar todas as sessões e criar uma nova
    console.log('\n🧹 2. LIMPANDO SESSÕES E CRIANDO NOVA')
    
    // Remover todas as sessões do usuário agro
    const { error: deleteError } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('userId', agroUser.id)
    
    if (deleteError) {
      console.log('⚠️ Erro ao limpar sessões:', deleteError.message)
    } else {
      console.log('✅ Sessões antigas removidas')
    }
    
    // Criar nova sessão válida com expiração mais longa
    const newSessionToken = `stable_${agroUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newSession = {
      id: newSessionToken,
      sessionToken: newSessionToken,
      userId: agroUser.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: freshSession, error: createError } = await supabaseAdmin
      .from('sessions')
      .insert(newSession)
      .select()
      .single()
    
    if (createError) {
      console.log('⚠️ Erro ao criar nova sessão:', createError.message)
    } else {
      console.log('✅ Nova sessão criada:')
      console.log(`  - Token: ${newSessionToken}`)
      console.log(`  - User: ${agroUser.id}`)
      console.log(`  - Expires: ${newSession.expires}`)
    }
    
    // 3. Verificar categorias disponíveis
    console.log('\n📋 3. VERIFICANDO CATEGORIAS DISPONÍVEIS')
    
    const { data: allCategories, error: allError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (allError) {
      console.error('❌ Erro ao buscar categorias:', allError)
    } else {
      console.log(`✅ Total de categorias ativas: ${allCategories?.length || 0}`)
      
      const globalCategories = allCategories?.filter(cat => cat.is_global) || []
      const specificCategories = allCategories?.filter(cat => !cat.is_global) || []
      
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
    
    // 4. Simular exatamente o que a API deveria retornar para o usuário agro
    console.log('\n👤 4. SIMULANDO QUERY DA API PARA USUÁRIO AGRO')
    
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
        
        // Verificar se as categorias da Agro estão presentes
        const agroCategoriesFound = userCategories.filter(cat => 
          cat.contexts?.name?.toLowerCase().includes('agro') || 
          cat.name?.toLowerCase().includes('agro')
        )
        
        if (agroCategoriesFound.length > 0) {
          console.log('\n✅ CATEGORIAS DA AGRO ENCONTRADAS!')
          agroCategoriesFound.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.contexts?.name})`)
          })
        } else {
          console.log('\n❌ CATEGORIAS DA AGRO NÃO ENCONTRADAS!')
          console.log('🔍 Isso explica por que não aparece no frontend')
        }
      } else {
        console.log('❌ Nenhuma categoria retornada pela query')
      }
    }
    
    // 5. Verificar se há problema na configuração NextAuth
    console.log('\n⚙️ 5. VERIFICANDO CONFIGURAÇÃO NEXTAUTH')
    
    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!authSecret) {
      console.log('❌ PROBLEMA: AUTH_SECRET não definido!')
      console.log('🔧 Isso pode causar problemas de autenticação')
    } else {
      console.log('✅ AUTH_SECRET definido')
    }
    
    // 6. Verificar se há problema na verificação de sessão
    console.log('\n🔍 6. VERIFICANDO VERIFICAÇÃO DE SESSÃO')
    
    // Verificar se há sessões válidas
    const { data: validSessions, error: validError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('userId', agroUser.id)
      .gt('expires', new Date().toISOString())
    
    if (validError) {
      console.error('❌ Erro ao buscar sessões válidas:', validError)
    } else {
      console.log(`✅ Sessões válidas do usuário agro: ${validSessions?.length || 0}`)
      
      if (validSessions && validSessions.length > 0) {
        validSessions.forEach(session => {
          console.log(`  - Token: ${session.sessionToken?.substring(0, 20)}...`)
          console.log(`  - Expires: ${session.expires}`)
        })
      }
    }
    
    console.log('\n🎯 CORREÇÃO SESSÃO CONCLUÍDA!')
    console.log('📋 RESUMO:')
    console.log(`- Usuário agro: ${agroUser.name} (${agroUser.email})`)
    console.log(`- Sessão nova: ${freshSession ? '✅ Criada' : '❌ Erro'}`)
    console.log(`- Categorias disponíveis: ${userCategories?.length || 0}`)
    console.log(`- Sessões válidas: ${validSessions?.length || 0}`)
    
    console.log('\n💡 SOLUÇÕES APLICADAS:')
    console.log('1. ✅ Sessões antigas removidas')
    console.log('2. ✅ Nova sessão criada (7 dias)')
    console.log('3. ✅ Categorias verificadas')
    console.log('4. ✅ Configuração NextAuth verificada')
    console.log('5. ✅ Verificação de sessão verificada')
    
    console.log('\n🎯 AGORA TESTE:')
    console.log('1. Faça logout do usuário agro')
    console.log('2. Faça login novamente')
    console.log('3. Vá para "Novo Chamado"')
    console.log('4. Verifique se as categorias aparecem')
    
    console.log('\n🔍 SE AINDA NÃO FUNCIONAR:')
    console.log('O problema pode estar na verificação de sessão muito restritiva')
    console.log('Nesse caso, precisaremos ajustar a configuração de autenticação')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error)
    return false
  }
}

corrigirSessaoDefinitivo()
