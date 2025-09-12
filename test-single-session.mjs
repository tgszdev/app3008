#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 TESTE DO SISTEMA DE SESSÃO ÚNICA\n')

async function test() {
  try {
    console.log('1️⃣ Verificando tabelas...')
    const { error: e1 } = await supabase.from('sessions').select('*').limit(1)
    console.log(e1 ? '   ❌ Erro: ' + e1.message : '   ✅ Tabela sessions OK')
    
    console.log('\n2️⃣ Verificando status...')
    const { data: status } = await supabase.rpc('check_session_system_status')
    if (status?.[0]) {
      console.log(`   📊 Sessões ativas: ${status[0].active_sessions}`)
      console.log(`   📊 Total: ${status[0].total_sessions}`)
    }
    
    console.log('\n✅ Sistema pronto!')
  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

test()