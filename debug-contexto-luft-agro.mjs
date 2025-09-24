import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugContextoLuftAgro() {
  console.log('🔍 DEBUG - CONTEXTO LUFT AGRO FALTANDO')
  console.log('=' * 50)

  const userId = '2a33241e-ed38-48b5-9c84-e8c354ae9606' // ID do Thiago Rodrigues Souza
  const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882' // ID do Luft Agro

  // --- 1. VERIFICAR SE LUFT AGRO EXISTE ---
  console.log('\n🏢 1. VERIFICANDO SE LUFT AGRO EXISTE')
  console.log('=' * 30)
  const { data: luftAgro, error: luftError } = await supabaseAdmin
    .from('contexts')
    .select('id, name, slug, type, is_active')
    .eq('id', luftAgroId)
    .single()

  if (luftError) {
    console.error('❌ Erro ao buscar Luft Agro:', luftError)
    return
  }

  console.log('📊 Luft Agro encontrado:', luftAgro)
  console.log('📊 Ativo:', luftAgro.is_active)

  // --- 2. VERIFICAR ASSOCIAÇÃO DO USUÁRIO COM LUFT AGRO ---
  console.log('\n🔗 2. VERIFICANDO ASSOCIAÇÃO COM LUFT AGRO')
  console.log('=' * 30)
  const { data: userLuftAssociation, error: assocError } = await supabaseAdmin
    .from('user_contexts')
    .select('user_id, context_id, contexts(id, name, slug, type, is_active)')
    .eq('user_id', userId)
    .eq('context_id', luftAgroId)
    .single()

  if (assocError) {
    console.error('❌ Erro ao buscar associação:', assocError)
    return
  }

  console.log('📊 Associação encontrada:', userLuftAssociation)
  if (userLuftAssociation.contexts) {
    console.log('📊 Contexto da associação:', userLuftAssociation.contexts)
  } else {
    console.log('❌ Contexto da associação é null (órfão)')
  }

  // --- 3. VERIFICAR TODAS AS ASSOCIAÇÕES DO USUÁRIO ---
  console.log('\n📋 3. TODAS AS ASSOCIAÇÕES DO USUÁRIO')
  console.log('=' * 30)
  const { data: allUserContexts, error: allError } = await supabaseAdmin
    .from('user_contexts')
    .select('context_id, contexts(id, name, slug, type, is_active)')
    .eq('user_id', userId)

  if (allError) {
    console.error('❌ Erro ao buscar todas as associações:', allError)
    return
  }

  console.log(`📊 Total de associações: ${allUserContexts.length}`)
  allUserContexts.forEach((uc, index) => {
    if (uc.contexts) {
      console.log(`  ${index + 1}. ${uc.contexts.name} (${uc.contexts.type}) - Ativo: ${uc.contexts.is_active} - ID: ${uc.context_id}`)
    } else {
      console.log(`  ${index + 1}. ❌ Contexto órfão (ID: ${uc.context_id})`)
    }
  })

  // --- 4. SIMULAR AUTH-CONFIG.TS ---
  console.log('\n🔄 4. SIMULANDO AUTH-CONFIG.TS')
  console.log('=' * 30)
  
  // Simular exatamente o que o auth-config.ts faz
  const userContexts = allUserContexts
  const availableContexts = userContexts
    .filter(uc => uc.contexts) // Filtrar contextos válidos
    .map(uc => ({
      id: uc.contexts.id,
      name: uc.contexts.name,
      slug: uc.contexts.slug,
      type: uc.contexts.type
    }))

  console.log('📊 Contextos que seriam passados para a sessão:')
  console.log(`📊 Total: ${availableContexts.length}`)
  availableContexts.forEach((ctx, index) => {
    console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
  })

  // --- 5. VERIFICAR SE LUFT AGRO ESTÁ INCLUÍDO ---
  console.log('\n🎯 5. VERIFICANDO SE LUFT AGRO ESTÁ INCLUÍDO')
  console.log('=' * 30)
  
  const luftAgroIncluded = availableContexts.find(ctx => ctx.id === luftAgroId)
  if (luftAgroIncluded) {
    console.log('✅ Luft Agro está incluído nos contextos disponíveis')
    console.log('📊 Dados do Luft Agro:', luftAgroIncluded)
  } else {
    console.log('❌ Luft Agro NÃO está incluído nos contextos disponíveis')
    console.log('🔍 Verificando por que...')
    
    // Verificar se a associação existe mas o contexto é null
    const luftAssociation = userContexts.find(uc => uc.context_id === luftAgroId)
    if (luftAssociation) {
      if (luftAssociation.contexts) {
        console.log('❌ Associação existe e contexto não é null, mas não passou no filtro')
        console.log('📊 Dados da associação:', luftAssociation)
      } else {
        console.log('❌ Associação existe mas contexto é null (órfão)')
        console.log('📊 Dados da associação:', luftAssociation)
      }
    } else {
      console.log('❌ Associação não existe')
    }
  }

  // --- 6. VERIFICAR PROBLEMAS ESPECÍFICOS ---
  console.log('\n🔍 6. VERIFICANDO PROBLEMAS ESPECÍFICOS')
  console.log('=' * 30)
  
  // Verificar se Luft Agro está ativo
  if (luftAgro && !luftAgro.is_active) {
    console.log('❌ PROBLEMA: Luft Agro está inativo')
    console.log('💡 Solução: Ativar Luft Agro')
  } else {
    console.log('✅ Luft Agro está ativo')
  }

  // Verificar se a associação existe
  if (!userLuftAssociation) {
    console.log('❌ PROBLEMA: Associação com Luft Agro não existe')
    console.log('💡 Solução: Criar associação')
  } else {
    console.log('✅ Associação com Luft Agro existe')
  }

  // Verificar se o contexto da associação é null
  if (userLuftAssociation && !userLuftAssociation.contexts) {
    console.log('❌ PROBLEMA: Associação existe mas contexto é null (órfão)')
    console.log('💡 Solução: Remover associação órfã ou corrigir referência')
  } else {
    console.log('✅ Contexto da associação não é null')
  }

  console.log('\n📊 RESUMO DO DEBUG')
  console.log('=' * 50)
  console.log(`✅ Luft Agro existe: ${luftAgro ? 'Sim' : 'Não'}`)
  console.log(`✅ Luft Agro ativo: ${luftAgro?.is_active ? 'Sim' : 'Não'}`)
  console.log(`✅ Associação existe: ${userLuftAssociation ? 'Sim' : 'Não'}`)
  console.log(`✅ Contexto não é null: ${userLuftAssociation?.contexts ? 'Sim' : 'Não'}`)
  console.log(`✅ Incluído nos contextos: ${luftAgroIncluded ? 'Sim' : 'Não'}`)
  console.log(`📊 Total de contextos disponíveis: ${availableContexts.length}`)
}

debugContextoLuftAgro()
