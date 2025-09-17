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
    
    // 1. Executar escalação automática
    const escalationResponse = await fetch(`${API_URL}/api/escalation/auto-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auto-Escalation-Cron/1.0'
      }
    })

    if (!escalationResponse.ok) {
      throw new Error(`HTTP ${escalationResponse.status}: ${escalationResponse.statusText}`)
    }

    const escalationResult = await escalationResponse.json()
    
    if (escalationResult.success) {
      console.log(`✅ [CRON] Execução automática concluída: ${escalationResult.message}`)
      console.log(`📊 [CRON] Estatísticas: ${escalationResult.processed} processados, ${escalationResult.executed} executados`)
      
      if (escalationResult.results && escalationResult.results.length > 0) {
        console.log('📋 [CRON] Resultados detalhados:')
        escalationResult.results.forEach((item, index) => {
          if (item.success && item.executed_rules.length > 0) {
            console.log(`  ${index + 1}. ${item.ticket_title}: ${item.executed_rules.join(', ')}`)
          }
        })
      }
    } else {
      console.error(`❌ [CRON] Erro na execução automática: ${escalationResult.error}`)
      process.exit(1)
    }

    // 2. Processar e-mails de escalação
    console.log('📧 [CRON] Processando e-mails de escalação...')
    
    try {
      const emailResponse = await fetch(`${API_URL}/api/escalation/process-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Auto-Escalation-Cron/1.0'
        }
      })

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json()
        console.log(`✅ [CRON] E-mails processados: ${emailResult.message}`)
        console.log(`📧 [CRON] Estatísticas de e-mail: ${emailResult.processed} processados, ${emailResult.sent} enviados`)
      } else {
        console.error(`❌ [CRON] Erro ao processar e-mails: HTTP ${emailResponse.status}`)
        // Não sair com erro aqui, pois a escalação pode ter funcionado
      }
    } catch (emailError) {
      console.error(`❌ [CRON] Erro ao processar e-mails:`, emailError)
      // Não sair com erro aqui, pois a escalação pode ter funcionado
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
