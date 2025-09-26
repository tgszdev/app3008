async function testApiDirect() {
  console.log('🧪 TESTE DIRETO DA API')
  console.log('=' .repeat(50))
  
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    // Testar API sem contexto
    console.log('📡 Testando API sem contexto...')
    const responseSemContexto = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    
    if (!responseSemContexto.ok) {
      console.error('❌ Erro na API sem contexto:', responseSemContexto.status)
      return
    }
    
    const dataSemContexto = await responseSemContexto.json()
    console.log('✅ Resposta sem contexto:')
    console.log(`  Total: ${dataSemContexto.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${dataSemContexto.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${dataSemContexto.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${dataSemContexto.recentTickets?.length || 0}`)
    
    // Testar API com contexto
    console.log('\n📡 Testando API com contexto...')
    const responseComContexto = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
    
    if (!responseComContexto.ok) {
      console.error('❌ Erro na API com contexto:', responseComContexto.status)
      return
    }
    
    const dataComContexto = await responseComContexto.json()
    console.log('✅ Resposta com contexto:')
    console.log(`  Total: ${dataComContexto.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${dataComContexto.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${dataComContexto.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${dataComContexto.recentTickets?.length || 0}`)
    
    // Comparar resultados
    console.log('\n🔍 COMPARAÇÃO:')
    console.log('-'.repeat(30))
    
    if (dataSemContexto.totalTickets !== dataComContexto.totalTickets) {
      console.log('✅ FILTRO FUNCIONANDO: Valores diferentes com e sem contexto')
      console.log(`  Sem contexto: ${dataSemContexto.totalTickets}`)
      console.log(`  Com contexto: ${dataComContexto.totalTickets}`)
    } else {
      console.log('❌ FILTRO NÃO FUNCIONANDO: Valores iguais com e sem contexto')
      console.log(`  Ambos: ${dataSemContexto.totalTickets}`)
    }
    
    // Verificar se as estatísticas estão sendo calculadas
    console.log('\n🧮 VERIFICANDO CÁLCULO DAS ESTATÍSTICAS:')
    console.log('-'.repeat(30))
    
    if (dataComContexto.totalTickets === undefined) {
      console.log('❌ PROBLEMA: totalTickets é undefined')
      console.log('🔍 Verificando estrutura da resposta...')
      console.log('📋 Chaves da resposta:', Object.keys(dataComContexto))
      
      // Verificar se há algum erro na resposta
      if (dataComContexto.error) {
        console.log('❌ Erro na API:', dataComContexto.error)
      }
    } else {
      console.log('✅ Estatísticas estão sendo calculadas')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testApiDirect()
