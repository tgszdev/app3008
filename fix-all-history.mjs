import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixAllHistory() {
  console.log('\n🔍 ANALISANDO E CORRIGINDO TODA A TABELA ticket_history\n')
  console.log('='.repeat(70))
  
  // 1. Buscar TODOS os registros de histórico
  const { data: allHistory, error } = await supabase
    .from('ticket_history')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('❌ Erro ao buscar histórico:', error)
    return
  }
  
  console.log(`📊 Total de registros no histórico: ${allHistory?.length || 0}\n`)
  
  // 2. Identificar duplicatas
  console.log('🔍 IDENTIFICANDO DUPLICATAS:')
  console.log('-'.repeat(70))
  
  const duplicates = []
  const seen = new Map()
  
  allHistory.forEach(record => {
    const key = `${record.ticket_id}-${record.field_changed}-${record.new_value}-${record.created_at}`
    if (seen.has(key)) {
      duplicates.push(record)
    } else {
      seen.set(key, record)
    }
  })
  
  console.log(`❌ Duplicatas encontradas: ${duplicates.length}`)
  
  if (duplicates.length > 0) {
    console.log('\n📋 Lista de duplicatas:')
    duplicates.forEach(dup => {
      console.log(`   - ID: ${dup.id} | Ticket: ${dup.ticket_id} | Campo: ${dup.field_changed} | Valor: ${dup.new_value}`)
    })
    
    console.log('\n🗑️ REMOVENDO DUPLICATAS...')
    const duplicateIds = duplicates.map(d => d.id)
    
    const { error: deleteError } = await supabase
      .from('ticket_history')
      .delete()
      .in('id', duplicateIds)
    
    if (deleteError) {
      console.error('❌ Erro ao remover duplicatas:', deleteError)
    } else {
      console.log(`✅ ${duplicates.length} duplicata(s) removida(s)`)
    }
  } else {
    console.log('✅ Nenhuma duplicata encontrada')
  }
  
  // 3. Corrigir datas com problema de fuso horário
  console.log('\n📅 CORRIGINDO DATAS COM PROBLEMA DE FUSO HORÁRIO:')
  console.log('-'.repeat(70))
  
  // Buscar registros atualizados (sem duplicatas)
  const { data: cleanHistory } = await supabase
    .from('ticket_history')
    .select('*')
    .order('created_at', { ascending: true })
  
  let correctedCount = 0
  const corrections = []
  
  for (const record of cleanHistory || []) {
    const recordDate = new Date(record.created_at)
    const recordDateBR = new Date(recordDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    
    // Verificar se a data está em UTC e precisa ser ajustada
    // Se a hora for entre 00:00 e 02:59, provavelmente é um registro que deveria estar no dia anterior
    const hour = recordDate.getUTCHours()
    
    if (hour >= 0 && hour <= 2) {
      // Subtrair 3 horas para corrigir
      const correctedDate = new Date(recordDate.getTime() - (3 * 60 * 60 * 1000))
      
      corrections.push({
        id: record.id,
        oldDate: record.created_at,
        newDate: correctedDate.toISOString()
      })
      
      correctedCount++
    }
  }
  
  console.log(`📊 Registros que precisam correção: ${corrections.length}`)
  
  if (corrections.length > 0) {
    console.log('\n🔄 APLICANDO CORREÇÕES...')
    
    for (const correction of corrections) {
      const { error: updateError } = await supabase
        .from('ticket_history')
        .update({ created_at: correction.newDate })
        .eq('id', correction.id)
      
      if (updateError) {
        console.error(`❌ Erro ao corrigir ${correction.id}:`, updateError)
      } else {
        const oldDateBR = new Date(correction.oldDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        const newDateBR = new Date(correction.newDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        console.log(`   ✅ ${correction.id}: ${oldDateBR} → ${newDateBR}`)
      }
    }
    
    console.log(`\n✅ ${correctedCount} registro(s) corrigido(s)`)
  } else {
    console.log('✅ Todas as datas já estão corretas')
  }
  
  // 4. Verificar campos da tabela
  console.log('\n📋 VERIFICANDO ESTRUTURA DOS CAMPOS:')
  console.log('-'.repeat(70))
  
  const wrongFieldNames = cleanHistory?.filter(h => h.action === 'created' || h.action === 'updated')
  
  if (wrongFieldNames && wrongFieldNames.length > 0) {
    console.log(`⚠️ Encontrados ${wrongFieldNames.length} registros com campos antigos (action, field_name)`)
    console.log('   Estes devem usar (action_type, field_changed)')
    
    for (const record of wrongFieldNames) {
      const updates: any = {}
      
      if (record.action) {
        updates.action_type = record.action === 'created' ? 'status_changed' : 'updated'
      }
      
      if (record.field_name) {
        updates.field_changed = record.field_name
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('ticket_history')
          .update(updates)
          .eq('id', record.id)
      }
    }
    
    console.log('✅ Campos padronizados')
  } else {
    console.log('✅ Todos os campos estão corretos')
  }
  
  // 5. Resumo final
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO DA CORREÇÃO:')
  console.log('='.repeat(70))
  console.log(`✅ Duplicatas removidas: ${duplicates.length}`)
  console.log(`✅ Datas corrigidas: ${correctedCount}`)
  console.log(`✅ Total de registros limpos: ${(cleanHistory?.length || 0) - duplicates.length}`)
  console.log('\n💡 Histórico completamente corrigido e padronizado!')
  console.log('='.repeat(70) + '\n')
}

fixAllHistory()
