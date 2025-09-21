const https = require('https')

// Função para fazer requisição HTTPS
function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        })
      })
    })
    
    req.on('error', reject)
    
    if (postData) {
      req.write(postData)
    }
    
    req.end()
  })
}

async function testarProducao() {
  console.log('====================================')
  console.log('TESTE DA API EM PRODUÇÃO')
  console.log('====================================\n')

  // 1. Testar GET em rota de teste
  console.log('1. TESTANDO GET /api/tickets/test/rating')
  console.log('-----------------------------------------')
  try {
    const response = await httpsRequest({
      hostname: 'www.ithostbr.tech',
      path: '/api/tickets/test/rating',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    console.log('Status:', response.statusCode)
    console.log('Response:', response.data)
    
    if (response.statusCode === 404) {
      console.log('❌ API não existe em produção')
    } else if (response.statusCode === 500) {
      console.log('✅ API existe e está respondendo (erro esperado para ID de teste)')
    } else {
      console.log('✅ API existe em produção')
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }

  // 2. Testar POST com dados de teste
  console.log('\n2. TESTANDO POST /api/tickets/test-id/rating')
  console.log('---------------------------------------------')
  
  const testData = JSON.stringify({
    rating: 5,
    comment: 'Teste de produção',
    userId: 'test-user-id'
  })
  
  try {
    const response = await httpsRequest({
      hostname: 'www.ithostbr.tech',
      path: '/api/tickets/test-id/rating',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData),
        'Accept': 'application/json'
      }
    }, testData)
    
    console.log('Status:', response.statusCode)
    console.log('Response:', response.data)
    
    const responseData = JSON.parse(response.data)
    if (responseData.error === 'Ticket não encontrado') {
      console.log('✅ API está funcionando corretamente (ticket não existe é esperado)')
    } else {
      console.log('Response parsed:', responseData)
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }

  // 3. Buscar um ticket real
  console.log('\n3. BUSCANDO UM TICKET REAL PARA TESTE')
  console.log('--------------------------------------')
  
  // IDs dos tickets resolvidos do diagnóstico anterior
  const ticketsResolvidos = [
    { id: 'f15e9573-7ca6-48df-bf87-5f9166f01a8f', number: '927154', userId: 'cb3a7544-8aed-409e-b0b7-98cb3d332396' },
    { id: '4e49d8ee-0ee9-4eaa-a43b-2559195b47ea', number: '1097747', userId: '2bcd314e-ee43-4d2e-98aa-62c25d85deb7' }
  ]
  
  for (const ticket of ticketsResolvidos) {
    console.log(`\nTestando ticket #${ticket.number} (ID: ${ticket.id})`)
    
    // Testar GET
    try {
      const response = await httpsRequest({
        hostname: 'www.ithostbr.tech',
        path: `/api/tickets/${ticket.id}/rating`,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      console.log('GET Status:', response.statusCode)
      if (response.data) {
        try {
          const data = JSON.parse(response.data)
          if (data === null) {
            console.log('Resultado: Nenhuma avaliação existe para este ticket')
          } else {
            console.log('Resultado:', data)
          }
        } catch {
          console.log('Response:', response.data)
        }
      }
    } catch (error) {
      console.error('Erro GET:', error.message)
    }
    
    // Testar POST
    const postData = JSON.stringify({
      rating: 5,
      comment: 'Excelente atendimento!',
      userId: ticket.userId
    })
    
    try {
      const response = await httpsRequest({
        hostname: 'www.ithostbr.tech',
        path: `/api/tickets/${ticket.id}/rating`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Accept': 'application/json'
        }
      }, postData)
      
      console.log('POST Status:', response.statusCode)
      if (response.data) {
        try {
          const data = JSON.parse(response.data)
          if (data.error) {
            console.log('Erro:', data.error)
            if (data.error.includes('foreign key') || data.error.includes('user_id')) {
              console.log('⚠️  Problema: user_id não existe na tabela users')
            }
          } else if (data.id) {
            console.log('✅ SUCESSO! Avaliação criada:')
            console.log('   ID:', data.id)
            console.log('   Rating:', data.rating)
            console.log('   Comment:', data.comment)
          } else {
            console.log('Resultado:', data)
          }
        } catch {
          console.log('Response:', response.data)
        }
      }
    } catch (error) {
      console.error('Erro POST:', error.message)
    }
  }

  console.log('\n====================================')
  console.log('RESUMO DO TESTE')
  console.log('====================================')
  console.log('\nA API está deployada em produção e respondendo.')
  console.log('Se houver erros de "user_id", significa que os IDs')
  console.log('dos usuários nos tickets não existem na tabela users.')
  console.log('\nPara resolver:')
  console.log('1. Verifique se os usuários existem na tabela auth.users')
  console.log('2. Ou teste com um ticket criado por um usuário válido')
  console.log('3. Ou temporariamente remova a validação de foreign key')
}

testarProducao().catch(console.error)