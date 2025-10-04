import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllAssociations() {
  const email = 'agro2@agro.com.br'
  
  console.log('\n🔍 VERIFICAÇÃO COMPLETA: agro2@agro.com.br')
  console.log('═'.repeat(80))
  
  // Buscar usuário
  const { data: user } = await supabase
    .from('users')
    .select('id, email, user_type, context_id, context_name, context_slug')
    .eq('email', email)
    .single()
  
  if (!user) {
    console.log('❌ Usuário não encontrado\n')
    return
  }
  
  console.log('\n📊 TABELA: users')
  console.log('─'.repeat(80))
  console.log('User ID:', user.id)
  console.log('User Type:', user.user_type)
  console.log('Context ID:', user.context_id || 'NULL')
  console.log('Context Name:', user.context_name || 'NULL')
  console.log('Context Slug:', user.context_slug || 'NULL')
  
  // Buscar TODAS as associações
  const { data: associations, count } = await supabase
    .from('user_contexts')
    .select('id, context_id, can_manage, created_at, contexts(id, name, slug)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  console.log('\n📊 TABELA: user_contexts')
  console.log('─'.repeat(80))
  console.log(`Total de associações: ${count}`)
  
  if (associations && associations.length > 0) {
    console.log('\nAssociações (da mais recente para mais antiga):')
    associations.forEach((assoc, i) => {
      const date = new Date(assoc.created_at).toLocaleString('pt-BR')
      console.log(`\n  ${i + 1}. ${assoc.contexts.name}`)
      console.log(`     ID: ${assoc.context_id}`)
      console.log(`     Criada em: ${date}`)
      console.log(`     Can Manage: ${assoc.can_manage}`)
      console.log(`     UUID: ${assoc.id}`)
    })
  } else {
    console.log('\n✅ Nenhuma associação (usuário desassociado)')
  }
  
  // ANÁLISE
  console.log('\n═'.repeat(80))
  console.log('📋 ANÁLISE')
  console.log('═'.repeat(80))
  
  if (count === 0) {
    if (user.context_id === null) {
      console.log('\n✅ SITUAÇÃO: Usuário completamente desassociado')
      console.log('   └─ Sem associações ✓')
      console.log('   └─ users.context_id = NULL ✓')
      console.log('   └─ Trigger DELETE funcionou!')
      console.log('\n🎯 COMPORTAMENTO ESPERADO:')
      console.log('   - APIs retornam VAZIO (0 resultados)')
      console.log('   - Usuário NÃO vê dados de nenhum cliente ✓')
    } else {
      console.log('\n❌ PROBLEMA: Dados órfãos!')
      console.log('   └─ Sem associações ✓')
      console.log('   └─ users.context_id ainda preenchido ✗')
      console.log('   └─ Trigger DELETE NÃO funcionou!')
      console.log('\n⚠️  RISCO: Usuário ainda vê dados do cliente antigo!')
    }
  } else if (count === 1) {
    const assoc = associations[0]
    const isSync = user.context_id === assoc.context_id && 
                   user.context_name === assoc.contexts.name &&
                   user.context_slug === assoc.contexts.slug
    
    if (isSync) {
      console.log('\n✅ SITUAÇÃO: Usuário associado a 1 cliente')
      console.log(`   └─ Cliente: ${assoc.contexts.name}`)
      console.log('   └─ Dados sincronizados ✓')
      console.log('   └─ Trigger INSERT funcionou!')
      console.log('\n🎯 COMPORTAMENTO ESPERADO:')
      console.log(`   - Usuário vê tickets do ${assoc.contexts.name}`)
      console.log('   - NÃO vê tickets de outros clientes ✓')
    } else {
      console.log('\n❌ PROBLEMA: Dados dessincrônos!')
      console.log(`   └─ Associação: ${assoc.contexts.name} (${assoc.context_id})`)
      console.log(`   └─ users.context_id: ${user.context_id}`)
      console.log(`   └─ users.context_name: ${user.context_name}`)
      console.log('   └─ Trigger INSERT NÃO funcionou!')
    }
  } else {
    console.log(`\n⚠️  SITUAÇÃO ANORMAL: ${count} associações`)
    console.log('   └─ Usuário context deveria ter apenas 1 associação!')
    console.log('\nAssociações:')
    associations.forEach(a => console.log(`   - ${a.contexts.name}`))
  }
  
  console.log('\n═'.repeat(80))
  console.log('💡 CONCLUSÃO')
  console.log('═'.repeat(80))
  
  if (count === 0 && user.context_id === null) {
    console.log('\n✅ TUDO CORRETO!')
    console.log('   Usuário desassociado e banco sincronizado.')
    console.log('   Após deploy, usuário NÃO verá tickets (correto).')
  } else if (count === 1 && user.context_id !== null) {
    console.log('\n✅ TUDO CORRETO!')
    console.log(`   Usuário associado ao ${user.context_name}.`)
    console.log(`   Após deploy, usuário verá apenas tickets deste cliente.`)
  } else {
    console.log('\n❌ PROBLEMA DETECTADO!')
    console.log('   Verificar triggers do banco ou re-associar usuário.')
  }
  
  console.log('\n═'.repeat(80) + '\n')
}

checkAllAssociations()

