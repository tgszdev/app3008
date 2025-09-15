const https = require('https')
const { createClient } = require('@supabase/supabase-js')

// Testar com as credenciais corretas
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ID do ticket que está tentando avaliar
const ticketId = '27e9f1a2-5523-45b6-9868-d9589361f54b'

async function diagnosticarErro500() {
  console.log('====================================')
  console.log('DIAGNÓSTICO DO ERRO 500')
  console.log('====================================\n')
  
  // 1. Verificar se o ticket existe
  console.log('1. VERIFICANDO SE O TICKET EXISTE')
  console.log('----------------------------------')
  
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single()
  
  if (ticketError) {
    console.log('❌ Erro ao buscar ticket:', ticketError.message)
    console.log('   Código:', ticketError.code)
    return
  }
  
  if (!ticket) {
    console.log('❌ Ticket não encontrado com ID:', ticketId)
    return
  }
  
  console.log('✅ Ticket encontrado:')
  console.log('   Número:', ticket.ticket_number)
  console.log('   Status:', ticket.status)
  console.log('   Criado por:', ticket.created_by)
  console.log('   Atribuído a:', ticket.assigned_to)
  
  // 2. Verificar se o usuário existe
  console.log('\n2. VERIFICANDO SE O USUÁRIO EXISTE')
  console.log('-----------------------------------')
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', ticket.created_by)
    .single()
  
  if (userError) {
    // Tentar na tabela auth.users
    const { data: authUser, error: authError } = await supabase
      .auth.admin.getUserById(ticket.created_by)
    
    if (authError) {
      console.log('❌ Usuário não encontrado em users:', userError.message)
      console.log('❌ Usuário não encontrado em auth.users:', authError.message)
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:')
      console.log('   O user_id do ticket não existe no banco!')
      console.log('   Isso causa erro de foreign key ao criar avaliação')
    } else {
      console.log('✅ Usuário encontrado em auth.users:')
      console.log('   Email:', authUser.user.email)
      console.log('   ID:', authUser.user.id)
    }
  } else {
    console.log('✅ Usuário encontrado em users:')
    console.log('   Nome:', user.name)
    console.log('   Email:', user.email)
  }
  
  // 3. Testar criação de avaliação direto no banco
  console.log('\n3. TESTANDO CRIAR AVALIAÇÃO DIRETAMENTE')
  console.log('----------------------------------------')
  
  if (ticket.status !== 'resolved') {
    console.log('⚠️  Ticket não está resolvido (status:', ticket.status, ')')
    console.log('   Mudando status para resolved para teste...')
    
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'resolved' })
      .eq('id', ticketId)
    
    if (updateError) {
      console.log('❌ Erro ao atualizar status:', updateError.message)
    } else {
      console.log('✅ Status atualizado para resolved')
    }
  }
  
  // Tentar criar avaliação
  const { data: rating, error: ratingError } = await supabase
    .from('ticket_ratings')
    .insert({
      ticket_id: ticketId,
      user_id: ticket.created_by,
      rating: 5,
      comment: 'Teste diagnóstico - pode deletar'
    })
    .select()
    .single()
  
  if (ratingError) {
    console.log('❌ Erro ao criar avaliação:', ratingError.message)
    console.log('   Código:', ratingError.code)
    console.log('   Detalhes:', ratingError.details)
    
    if (ratingError.code === '23503') {
      console.log('\n🔴 PROBLEMA CONFIRMADO: Foreign Key Constraint')
      console.log('   O user_id não existe na tabela users/auth.users')
      console.log('\n   SOLUÇÕES POSSÍVEIS:')
      console.log('   1. Criar o usuário na tabela users')
      console.log('   2. Usar um user_id válido')
      console.log('   3. Temporariamente remover a constraint de foreign key')
    } else if (ratingError.code === '23505') {
      console.log('\n⚠️  Já existe uma avaliação para este ticket')
      
      // Buscar avaliação existente
      const { data: existingRating } = await supabase
        .from('ticket_ratings')
        .select('*')
        .eq('ticket_id', ticketId)
        .single()
      
      if (existingRating) {
        console.log('   Avaliação existente:')
        console.log('   - Rating:', existingRating.rating)
        console.log('   - Comentário:', existingRating.comment)
        console.log('   - Criada em:', existingRating.created_at)
      }
    }
  } else {
    console.log('✅ Avaliação criada com sucesso!')
    console.log('   ID:', rating.id)
    
    // Deletar avaliação de teste
    await supabase
      .from('ticket_ratings')
      .delete()
      .eq('id', rating.id)
    
    console.log('   (Avaliação de teste deletada)')
  }
  
  // 4. Testar a API em produção
  console.log('\n4. TESTANDO API EM PRODUÇÃO')
  console.log('----------------------------')
  
  const testData = JSON.stringify({
    rating: 5,
    comment: 'Teste de API',
    userId: ticket.created_by
  })
  
  const options = {
    hostname: 'www.ithostbr.tech',
    path: `/api/tickets/${ticketId}/rating`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  }
  
  const req = https.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('Status HTTP:', res.statusCode)
      
      if (res.statusCode === 500) {
        console.log('❌ Erro 500 - Internal Server Error')
        console.log('Response:', data)
        
        console.log('\n🔍 POSSÍVEIS CAUSAS DO ERRO 500:')
        console.log('1. SUPABASE_SERVICE_ROLE_KEY não configurada em produção')
        console.log('2. Erro de sintaxe no código deployado')
        console.log('3. Problema de foreign key (user_id inválido)')
        console.log('4. Erro de conexão com Supabase')
      } else if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ API funcionou!')
        console.log('Response:', data)
      } else {
        console.log('Status:', res.statusCode)
        console.log('Response:', data)
      }
    })
  })
  
  req.on('error', (e) => {
    console.error('Erro na requisição:', e)
  })
  
  req.write(testData)
  req.end()
}

diagnosticarErro500().catch(console.error)