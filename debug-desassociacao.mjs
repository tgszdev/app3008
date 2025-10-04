import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDesassociacao() {
  const email = 'agro2@agro.com.br'
  
  console.log('\n🔍 DEBUG: VERIFICANDO DESASSOCIAÇÃO')
  console.log('═'.repeat(70))
  console.log(`Usuário: ${email}`)
  console.log('═'.repeat(70))
  
  // 1. Verificar estado atual na tabela users
  const { data: user } = await supabase
    .from('users')
    .select('id, email, user_type, context_id, context_name, context_slug, updated_at')
    .eq('email', email)
    .single()
  
  if (!user) {
    console.log('\n❌ Usuário não encontrado!\n')
    return
  }
  
  console.log('\n1️⃣ TABELA: users')
  console.log('─'.repeat(70))
  console.log('ID:', user.id)
  console.log('Email:', user.email)
  console.log('User Type:', user.user_type)
  console.log('Context ID:', user.context_id || '⚠️ NULL')
  console.log('Context Name:', user.context_name || '⚠️ NULL')
  console.log('Context Slug:', user.context_slug || '⚠️ NULL')
  console.log('Última atualização:', user.updated_at)
  
  // 2. Verificar associações em user_contexts
  const { data: associations, count } = await supabase
    .from('user_contexts')
    .select('context_id, contexts(id, name, slug, type)', { count: 'exact' })
    .eq('user_id', user.id)
  
  console.log('\n2️⃣ TABELA: user_contexts')
  console.log('─'.repeat(70))
  console.log(`Total de associações: ${count}`)
  
  if (associations && associations.length > 0) {
    console.log('\nAssociações encontradas:')
    associations.forEach((assoc, i) => {
      console.log(`  ${i + 1}. ${assoc.contexts.name} (${assoc.context_id})`)
    })
  } else {
    console.log('⚠️  NENHUMA associação encontrada!')
  }
  
  // 3. ANÁLISE DE CONSISTÊNCIA
  console.log('\n3️⃣ ANÁLISE DE CONSISTÊNCIA')
  console.log('═'.repeat(70))
  
  if (count === 0) {
    // Não tem associações
    if (user.context_id === null) {
      console.log('✅ CORRETO: Sem associações E users.context_id está NULL')
    } else {
      console.log('❌ PROBLEMA: Sem associações MAS users.context_id ainda está preenchido!')
      console.log('   └─ context_id:', user.context_id)
      console.log('   └─ context_name:', user.context_name)
      console.log('   └─ TRIGGER DELETE NÃO FUNCIONOU!')
    }
  } else if (count === 1) {
    // Tem 1 associação
    const assoc = associations[0]
    if (user.context_id === assoc.context_id && 
        user.context_name === assoc.contexts.name &&
        user.context_slug === assoc.contexts.slug) {
      console.log('✅ CORRETO: Associação E users table sincronizados')
    } else {
      console.log('❌ PROBLEMA: Associação existe MAS users table está dessincrono!')
      console.log('\n   Esperado (de user_contexts):')
      console.log('      context_id:', assoc.context_id)
      console.log('      context_name:', assoc.contexts.name)
      console.log('      context_slug:', assoc.contexts.slug)
      console.log('\n   Atual (em users):')
      console.log('      context_id:', user.context_id)
      console.log('      context_name:', user.context_name)
      console.log('      context_slug:', user.context_slug)
    }
  } else {
    console.log(`⚠️  ATENÇÃO: Usuário context tem ${count} associações (esperado: 1)`)
  }
  
  // 4. Verificar se API bloquearia acesso
  console.log('\n4️⃣ TESTE: API bloquearia acesso a tickets?')
  console.log('─'.repeat(70))
  
  if (user.context_id) {
    console.log(`API usaria context_id do banco: ${user.context_id}`)
    
    // Contar tickets desse contexto
    const { count: ticketsCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('context_id', user.context_id)
    
    console.log(`Tickets visíveis: ${ticketsCount}`)
    
    if (count === 0) {
      console.log('\n❌ PROBLEMA GRAVE:')
      console.log('   - Usuário NÃO tem associações')
      console.log('   - MAS users.context_id ainda aponta para Cliente 03')
      console.log('   - API vai buscar tickets do Cliente 03')
      console.log('   - Usuário VÊ dados que NÃO DEVERIA!')
    }
  } else {
    console.log('users.context_id está NULL')
    console.log('API bloquearia todos os tickets ✅')
  }
  
  console.log('\n' + '═'.repeat(70) + '\n')
}

debugDesassociacao()

