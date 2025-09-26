import { createClient } from '@supabase/supabase-js'

// Testar diferentes URLs do Supabase
const urls = [
  'https://qjqjqjqjqjqjqjqj.supabase.co',
  'https://qjqjqjqjqjqjqjqj.supabase.co',
  'https://qjqjqjqjqjqjqjqj.supabase.co'
]

const keys = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
]

async function testSupabaseConnection() {
  console.log('🔍 TESTANDO CONEXÃO COM SUPABASE')
  console.log('=' .repeat(50))
  
  for (let i = 0; i < urls.length; i++) {
    console.log(`\n📡 Teste ${i + 1}: ${urls[i]}`)
    console.log('-'.repeat(30))
    
    try {
      const supabase = createClient(urls[i], keys[i])
      
      // Testar conexão simples
      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .limit(1)
      
      if (error) {
        console.log(`❌ Erro: ${error.message}`)
      } else {
        console.log(`✅ Conexão OK: ${data?.length || 0} registros`)
      }
      
    } catch (err) {
      console.log(`❌ Erro de conexão: ${err.message}`)
    }
  }
  
  console.log('\n🔍 VERIFICANDO VARIÁVEIS DE AMBIENTE:')
  console.log('-'.repeat(30))
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'não definida')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'definida' : 'não definida')
}

testSupabaseConnection()
