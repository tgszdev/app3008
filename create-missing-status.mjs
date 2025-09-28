import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createMissingStatus() {
  console.log('🔧 CRIANDO STATUS FALTANTES')
  console.log('===========================')
  
  try {
    // Status que precisam ser criados baseados nos tickets
    const missingStatuses = [
      {
        name: 'Em Homologação',
        slug: 'em-homologacao',
        color: '#ac3bf7',
        order_index: 6
      },
      {
        name: 'AG Deploy em Homologação',
        slug: 'ag-deploy-em-homologacao', 
        color: '#3B82F6',
        order_index: 10
      },
      {
        name: 'AG Deploy em Produção',
        slug: 'ag-deploy-em-producao',
        color: '#3B82F6',
        order_index: 11
      },
      {
        name: 'Cancelado',
        slug: 'cancelado',
        color: '#f73b3b',
        order_index: 7
      }
    ]
    
    console.log('Criando status faltantes:')
    missingStatuses.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
    
    const { data: createdStatuses, error: createError } = await supabase
      .from('ticket_statuses')
      .insert(missingStatuses)
      .select()
    
    if (createError) {
      console.log('❌ Erro ao criar status:', createError)
      return
    }
    
    console.log('✅ Status criados com sucesso!')
    createdStatuses?.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
    
    // Verificação final
    console.log('\n🧪 TESTE DE CORRESPONDÊNCIA FINAL:')
    const ticketStatuses = ['open', 'in_progress', 'resolved', 'em-homologacao', 'ag-deploy-em-homologacao', 'ag-deploy-em-producao', 'cancelado']
    
    const { data: allStatuses } = await supabase
      .from('ticket_statuses')
      .select('name, slug')
    
    ticketStatuses.forEach(ticketStatus => {
      const matchingStatus = allStatuses?.find(s => s.slug === ticketStatus)
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

createMissingStatus()
