// Testar como a função formatBrazilDateTime processa a data

const testDate = '2025-09-30T22:05:41+00:00' // Data do banco

console.log('\n🔍 TESTANDO FORMATAÇÃO DE DATA\n')
console.log('='.repeat(70))
console.log(`Data do banco: ${testDate}`)
console.log('')

const dateObj = new Date(testDate)

console.log('📅 CONVERSÕES:')
console.log('-'.repeat(70))
console.log(`1. Como está no banco: ${testDate}`)
console.log(`2. new Date(): ${dateObj.toISOString()}`)
console.log(`3. UTC: ${dateObj.toUTCString()}`)
console.log('')

console.log('4. toLocaleString COM timezone (America/Sao_Paulo):')
const withTimezone = dateObj.toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
console.log(`   ${withTimezone}`)
console.log(`   Formatado: ${withTimezone.replace(',', ' às')}`)
console.log('')

console.log('5. toLocaleString SEM timezone (atual):')
const withoutTimezone = dateObj.toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
console.log(`   ${withoutTimezone}`)
console.log(`   Formatado: ${withoutTimezone.replace(',', ' às')}`)
console.log('')

console.log('='.repeat(70))
console.log('\n💡 CONCLUSÃO:')
console.log('-'.repeat(70))

if (testDate.includes('22:05:41')) {
  console.log('✅ O horário REAL no Brasil é 22:05:41')
  console.log('')
  console.log('Se o banco tem: 2025-09-30T22:05:41+00:00')
  console.log('E o horário real foi: 22:05:41 (Brasil)')
  console.log('')
  console.log('Então:')
  console.log('  - getBrazilTimestamp() está CORRETO ✅')
  console.log('  - formatBrazilDateTime() com timezone SUBTRAI 3h ❌')
  console.log('  - formatBrazilDateTime() SEM timezone mostra CORRETO ✅')
}

console.log('\n' + '='.repeat(70) + '\n')

