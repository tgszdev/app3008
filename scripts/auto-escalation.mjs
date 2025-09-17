#!/usr/bin/env node

/**
 * Script para execução automática de escalação
 * Pode ser executado via cron job a cada 5 minutos
 * 
 * Exemplo de cron job:
 * */5 * * * * /usr/bin/node /path/to/auto-escalation.mjs
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env')
config({ path: envPath })

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'

async function executeAutoEscalation() {
  try {
    console.log(`🔄 [CRON] Iniciando execução automática de escalação - ${new Date().toISOString()}`)
    
    const response = await fetch(`${API_URL}/api/escalation/auto-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auto-Escalation-Cron/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ [CRON] Execução automática concluída: ${result.message}`)
      console.log(`📊 [CRON] Estatísticas: ${result.processed} processados, ${result.executed} executados`)
      
      if (result.results && result.results.length > 0) {
        console.log('📋 [CRON] Resultados detalhados:')
        result.results.forEach((item, index) => {
          if (item.success && item.executed_rules.length > 0) {
            console.log(`  ${index + 1}. ${item.ticket_title}: ${item.executed_rules.join(', ')}`)
          }
        })
      }
    } else {
      console.error(`❌ [CRON] Erro na execução automática: ${result.error}`)
      process.exit(1)
    }

  } catch (error) {
    console.error(`❌ [CRON] Erro ao executar escalação automática:`, error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executeAutoEscalation()
}

export { executeAutoEscalation }
