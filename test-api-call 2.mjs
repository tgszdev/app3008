import fetch from 'node-fetch'

async function testAPICall() {
  console.log('🧪 TESTE DE CHAMADA DA API CATEGORIES-STATS')
  console.log('============================================')
  
  try {
    // Simular exatamente a chamada que o frontend faz
    const apiUrl = 'https://app3008-mtdumlg0l-thiagosouzas-projects-b3ccec7c.vercel.app/api/dashboard/categories-stats'
    const params = new URLSearchParams({
      start_date: '2025-09-01',
      end_date: '2025-09-30'
    })
    
    console.log(`🔍 Chamando API: ${apiUrl}?${params}`)
    
    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log(`❌ Erro na API: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log('Erro:', errorText)
      return
    }
    
    const data = await response.json()
    console.log(`✅ API respondeu com status: ${response.status}`)
    
    // Verificar dados retornados
    console.log('\n📊 DADOS RETORNADOS:')
    console.log(`Total tickets: ${data.total_tickets}`)
    console.log(`Categorias: ${data.categorias?.length || 0}`)
    
    if (data.categorias) {
      data.categorias.forEach((cat, index) => {
        console.log(`\n📁 Categoria ${index + 1}: ${cat.nome}`)
        console.log(`  Quantidade: ${cat.quantidade} tickets`)
        console.log(`  Percentual: ${cat.percentual}%`)
        console.log(`  Status detalhados: ${cat.status_breakdown_detailed?.length || 0}`)
        
        if (cat.status_breakdown_detailed && cat.status_breakdown_detailed.length > 0) {
          cat.status_breakdown_detailed.forEach(status => {
            console.log(`    - ${status.name}: ${status.count} tickets`)
          })
        } else {
          console.log(`    ❌ PROBLEMA: Nenhum status detalhado!`)
        }
      })
    }
    
    // Verificar se há problemas
    console.log('\n🔍 VERIFICAÇÃO DE PROBLEMAS:')
    const problemCategories = data.categorias?.filter(cat => 
      !cat.status_breakdown_detailed || cat.status_breakdown_detailed.length === 0
    ) || []
    
    if (problemCategories.length > 0) {
      console.log(`❌ ${problemCategories.length} categorias sem status:`)
      problemCategories.forEach(cat => {
        console.log(`  - ${cat.nome}: ${cat.quantidade} tickets`)
      })
    } else {
      console.log(`✅ Todas as categorias têm status`)
    }
    
  } catch (error) {
    console.error('❌ Erro na chamada da API:', error)
  }
}

testAPICall()
