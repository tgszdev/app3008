import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixStatusSlugs() {
  console.log('🔧 CORRIGINDO SLUGS DOS STATUS')
  console.log('=============================')
  
  try {
    // 1. Verificar status existentes
    console.log('\n📋 1. STATUS EXISTENTES:')
    const { data: existingStatuses } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index')
    
    console.log('Status existentes:')
    existingStatuses?.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
    
    // 2. Verificar status dos tickets
    console.log('\n🎫 2. STATUS DOS TICKETS:')
    const { data: tickets } = await supabase
      .from('tickets')
      .select('status')
      .not('status', 'is', null)
    
    const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
    console.log('Status únicos dos tickets:')
    uniqueTicketStatuses.forEach(status => console.log(`  - ${status}`))
    
    // 3. Identificar status faltantes
    console.log('\n🔍 3. STATUS FALTANTES:')
    const missingStatuses = uniqueTicketStatuses.filter(ticketStatus => 
      !existingStatuses?.some(s => s.slug === ticketStatus)
    )
    
    console.log('Status que precisam ser criados:')
    missingStatuses.forEach(status => console.log(`  - ${status}`))
    
    // 4. Criar status faltantes
    if (missingStatuses.length > 0) {
      console.log('\n🔧 4. CRIANDO STATUS FALTANTES:')
      
      const statusToCreate = missingStatuses.map((status, index) => {
        // Mapear nomes baseados nos slugs
        const nameMap = {
          'em-homologacao': 'Em Homologação',
          'ag-deploy-em-homologacao': 'AG Deploy em Homologação', 
          'ag-deploy-em-producao': 'AG Deploy em Produção',
          'cancelado': 'Cancelado'
        }
        
        const colorMap = {
          'em-homologacao': '#ac3bf7',
          'ag-deploy-em-homologacao': '#3B82F6',
          'ag-deploy-em-producao': '#3B82F6', 
          'cancelado': '#f73b3b'
        }
        
        return {
          name: nameMap[status] || status,
          slug: status,
          color: colorMap[status] || '#6B7280',
          order_index: 10 + index
        }
      })
      
      console.log('Criando status:')
      statusToCreate.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
      
      const { data: createdStatuses, error: createError } = await supabase
        .from('ticket_statuses')
        .insert(statusToCreate)
        .select()
      
      if (createError) {
        console.log('❌ Erro ao criar status:', createError)
      } else {
        console.log('✅ Status criados com sucesso!')
        createdStatuses?.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
      }
    } else {
      console.log('✅ Todos os status já existem!')
    }
    
    // 5. Verificação final
    console.log('\n✅ 5. VERIFICAÇÃO FINAL:')
    const { data: finalStatuses } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index')
    
    console.log('Status finais:')
    finalStatuses?.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
    
    // Testar correspondência
    console.log('\n🧪 TESTE DE CORRESPONDÊNCIA:')
    uniqueTicketStatuses.forEach(ticketStatus => {
      const matchingStatus = finalStatuses?.find(s => s.slug === ticketStatus)
      if (matchingStatus) {
        console.log(`✅ ${ticketStatus} → ${matchingStatus.name}`)
      } else {
        console.log(`❌ ${ticketStatus} → NÃO ENCONTRADO`)
      }
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixStatusSlugs()
