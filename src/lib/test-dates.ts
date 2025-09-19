// Arquivo de teste para verificar parsing de datas
import { formatBrazilDateTime, formatBrazilDate, formatRelativeTime } from './date-utils'

// Formatos possíveis que podem vir do Supabase/PostgreSQL
const testDates = [
  // ISO 8601
  '2025-09-18T21:37:00Z',
  '2025-09-18T21:37:00.000Z',
  '2025-09-18T21:37:00+00:00',
  '2025-09-18T21:37:00-03:00',
  '2025-09-18T21:37:00',
  
  // PostgreSQL format
  '2025-09-18 21:37:00',
  '2025-09-18 21:37:00+00',
  '2025-09-18 21:37:00-03',
  
  // Date only
  '2025-09-18',
  
  // With microseconds
  '2025-09-18T21:37:00.123456Z',
  '2025-09-18 21:37:00.123456',
  
  // Edge cases
  null,
  undefined,
  '',
  'null',
  'undefined',
  'invalid',
  
  // Unix timestamps
  '1726696620',
  '1726696620000',
  1726696620,
  1726696620000,
]

export function testDateParsing() {
  console.log('=== TESTE DE PARSING DE DATAS ===\n')
  
  testDates.forEach((date, index) => {
    console.log(`Teste ${index + 1}: Input = ${JSON.stringify(date)}`)
    console.log(`  formatBrazilDateTime: ${formatBrazilDateTime(date as any)}`)
    console.log(`  formatBrazilDate: ${formatBrazilDate(date as any)}`)
    console.log(`  formatRelativeTime: ${formatRelativeTime(date as any)}`)
    console.log('---')
  })
  
  console.log('\n=== FIM DO TESTE ===')
}

// Para executar no console do navegador:
// import { testDateParsing } from '@/lib/test-dates'
// testDateParsing()