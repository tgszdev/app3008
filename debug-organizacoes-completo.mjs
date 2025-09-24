import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugOrganizacoesCompleto() {
  console.log('🔍 DEBUG COMPLETO - ORGANIZAÇÕES NÃO APARECENDO')
  console.log('=' * 60)

  const userId = '2a33241e-ed38-48b5-9c84-e8c354ae9606' // ID do Thiago Rodrigues Souza

  // --- 1. VERIFICAR DADOS DO USUÁRIO ---
  console.log('\n👤 1. DADOS DO USUÁRIO')
  console.log('=' * 30)
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, user_type, context_id, context_name, context_type')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('❌ Erro ao buscar dados do usuário:', userError)
    return
  }
  console.log('📊 Dados do usuário:', userData)

  // --- 2. VERIFICAR TODAS AS ORGANIZAÇÕES NO SISTEMA ---
  console.log('\n🏢 2. TODAS AS ORGANIZAÇÕES NO SISTEMA')
  console.log('=' * 30)
  const { data: allContexts, error: allContextsError } = await supabaseAdmin
    .from('contexts')
    .select('id, name, slug, type, is_active')
    .order('name')

  if (allContextsError) {
    console.error('❌ Erro ao buscar todas as organizações:', allContextsError)
    return
  }

  console.log(`📊 Total de organizações no sistema: ${allContexts.length}`)
  allContexts.forEach((ctx, index) => {
    console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - Ativo: ${ctx.is_active} - ID: ${ctx.id}`)
  })

  // --- 3. VERIFICAR ASSOCIAÇÕES DO USUÁRIO ---
  console.log('\n🔗 3. ASSOCIAÇÕES DO USUÁRIO')
  console.log('=' * 30)
  const { data: userContexts, error: userContextsError } = await supabaseAdmin
    .from('user_contexts')
    .select('context_id, contexts(id, name, slug, type, is_active)')
    .eq('user_id', userId)

  if (userContextsError) {
    console.error('❌ Erro ao buscar associações do usuário:', userContextsError)
    return
  }

  console.log(`📊 Total de associações do usuário: ${userContexts.length}`)
  userContexts.forEach((uc, index) => {
    if (uc.contexts) {
      console.log(`  ${index + 1}. ${uc.contexts.name} (${uc.contexts.type}) - Ativo: ${uc.contexts.is_active} - ID: ${uc.context_id}`)
    } else {
      console.log(`  ${index + 1}. ❌ Contexto órfão (ID: ${uc.context_id})`)
    }
  })

  // --- 4. VERIFICAR CONTEXTOS ATIVOS ASSOCIADOS ---
  console.log('\n✅ 4. CONTEXTOS ATIVOS ASSOCIADOS')
  console.log('=' * 30)
  const activeContexts = userContexts
    .filter(uc => uc.contexts && uc.contexts.is_active)
    .map(uc => uc.contexts)

  console.log(`📊 Contextos ativos associados: ${activeContexts.length}`)
  activeContexts.forEach(ctx => {
    console.log(`  ✅ ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
  })

  // --- 5. VERIFICAR PROBLEMAS DE ASSOCIAÇÃO ---
  console.log('\n🔍 5. PROBLEMAS DE ASSOCIAÇÃO')
  console.log('=' * 30)
  
  // Verificar se há contextos órfãos
  const orphanedContexts = userContexts.filter(uc => !uc.contexts)
  if (orphanedContexts.length > 0) {
    console.log('❌ Contextos órfãos encontrados:')
    orphanedContexts.forEach(oc => {
      console.log(`  - ID: ${oc.context_id}`)
    })
  } else {
    console.log('✅ Nenhum contexto órfão encontrado')
  }

  // Verificar se há contextos inativos
  const inactiveContexts = userContexts
    .filter(uc => uc.contexts && !uc.contexts.is_active)
    .map(uc => uc.contexts)

  if (inactiveContexts.length > 0) {
    console.log('⚠️ Contextos inativos associados:')
    inactiveContexts.forEach(ctx => {
      console.log(`  - ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
    })
  } else {
    console.log('✅ Nenhum contexto inativo associado')
  }

  // --- 6. SIMULAR ORGANIZATION CONTEXT ---
  console.log('\n🔄 6. SIMULAR ORGANIZATION CONTEXT')
  console.log('=' * 30)
  
  // Simular o que o OrganizationContext deveria retornar
  const simulatedAvailableContexts = activeContexts
  const simulatedCurrentContext = simulatedAvailableContexts.length > 0 ? simulatedAvailableContexts[0] : null

  console.log('📊 AvailableContexts que deveria ser retornado:')
  simulatedAvailableContexts.forEach(ctx => {
    console.log(`  ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
  })

  console.log('📊 CurrentContext que deveria ser retornado:')
  if (simulatedCurrentContext) {
    console.log(`  ${simulatedCurrentContext.name} (${simulatedCurrentContext.type}) - ID: ${simulatedCurrentContext.id}`)
  } else {
    console.log('  Nenhum contexto atual')
  }

  // --- 7. VERIFICAR SE HÁ PROBLEMAS NO AUTH-CONFIG ---
  console.log('\n🔧 7. VERIFICAR PROBLEMAS NO AUTH-CONFIG')
  console.log('=' * 30)
  
  // Verificar se o usuário tem user_type correto
  if (userData.user_type !== 'matrix') {
    console.log('❌ PROBLEMA: user_type não é "matrix"')
    console.log(`  user_type atual: ${userData.user_type}`)
    console.log('  Solução: Atualizar user_type para "matrix"')
  } else {
    console.log('✅ user_type está correto: "matrix"')
  }

  // Verificar se há contextos associados
  if (activeContexts.length === 0) {
    console.log('❌ PROBLEMA: Nenhum contexto ativo associado')
    console.log('  Solução: Associar o usuário a contextos ativos')
  } else {
    console.log(`✅ ${activeContexts.length} contextos ativos associados`)
  }

  // --- 8. SUGESTÕES DE CORREÇÃO ---
  console.log('\n💡 8. SUGESTÕES DE CORREÇÃO')
  console.log('=' * 30)
  
  if (orphanedContexts.length > 0) {
    console.log('1. ❌ Remover associações órfãs:')
    console.log('   DELETE FROM user_contexts WHERE context_id IN (lista_de_ids_órfãos)')
  }
  
  if (inactiveContexts.length > 0) {
    console.log('2. ⚠️ Ativar contextos inativos ou remover associações:')
    console.log('   UPDATE contexts SET is_active = true WHERE id IN (lista_de_ids_inativos)')
  }
  
  if (activeContexts.length === 0) {
    console.log('3. ❌ Associar usuário a contextos ativos:')
    console.log('   INSERT INTO user_contexts (user_id, context_id) VALUES (user_id, context_id)')
  }

  console.log('\n📊 RESUMO DO DIAGNÓSTICO')
  console.log('=' * 60)
  console.log(`✅ Total de organizações no sistema: ${allContexts.length}`)
  console.log(`✅ Total de associações do usuário: ${userContexts.length}`)
  console.log(`✅ Contextos ativos associados: ${activeContexts.length}`)
  console.log(`❌ Contextos órfãos: ${orphanedContexts.length}`)
  console.log(`⚠️ Contextos inativos: ${inactiveContexts.length}`)
  console.log('=' * 60)
}

debugOrganizacoesCompleto()
