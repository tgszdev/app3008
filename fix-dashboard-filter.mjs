#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

async function fixDashboardFilter() {
  console.log('🔧 CORRIGINDO FILTRO DO DASHBOARD')
  console.log('=' .repeat(60))

  try {
    // Ler o arquivo atual
    const filePath = 'src/components/dashboard/HybridDashboard.tsx'
    const content = fs.readFileSync(filePath, 'utf8')
    
    console.log('📁 Arquivo lido:', filePath)
    
    // Encontrar a seção que precisa ser corrigida
    const lines = content.split('\n')
    let startLine = -1
    let endLine = -1
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const response = await axios.get(`${apiUrl}?${params}`)')) {
        startLine = i
      }
      if (startLine !== -1 && lines[i].includes('setRecentTickets(response.data.recentTickets')) {
        endLine = i
        break
      }
    }
    
    if (startLine === -1 || endLine === -1) {
      console.log('❌ Não foi possível encontrar a seção para corrigir')
      return
    }
    
    console.log('📍 Seção encontrada:', { startLine, endLine })
    
    // Criar a correção
    const fix = `      const response = await axios.get(\`\${apiUrl}?\${params}\`)
      
      if (response.data) {
        let statsData = response.data.stats || {
          totalTickets: response.data.total_tickets || 0,
          openTickets: response.data.open_tickets || 0,
          inProgressTickets: response.data.in_progress_tickets || 0,
          resolvedTickets: response.data.resolved_tickets || 0,
          cancelledTickets: response.data.cancelled_tickets || 0,
          ticketsTrend: response.data.tickets_trend || '+0%'
        }
        
        let recentTicketsData = response.data.recentTickets || response.data.recent_tickets || []
        
        // Aplicar filtro de clientes selecionados no frontend
        if (selectedClients.length > 0) {
          console.log('🔄 Aplicando filtro de clientes no frontend:', selectedClients)
          
          // Filtrar tickets recentes por contexto
          recentTicketsData = recentTicketsData.filter((ticket: any) => {
            return selectedClients.includes(ticket.context_id)
          })
          
          // Ajustar estatísticas baseado nos tickets filtrados
          statsData = {
            totalTickets: recentTicketsData.length,
            openTickets: recentTicketsData.filter((t: any) => t.status === 'open').length,
            inProgressTickets: recentTicketsData.filter((t: any) => t.status === 'in_progress').length,
            resolvedTickets: recentTicketsData.filter((t: any) => t.status === 'resolved').length,
            cancelledTickets: recentTicketsData.filter((t: any) => t.status === 'cancelled').length,
            ticketsTrend: '+0%'
          }
        }
        
        setStats(statsData)
        setRecentTickets(recentTicketsData)
      }`
    
    // Aplicar a correção
    const newLines = [...lines]
    newLines.splice(startLine, endLine - startLine + 1, fix)
    
    // Salvar o arquivo corrigido
    const newContent = newLines.join('\n')
    fs.writeFileSync(filePath, newContent, 'utf8')
    
    console.log('✅ Arquivo corrigido com sucesso!')
    console.log('📊 Filtro de clientes implementado no frontend')
    console.log('🔧 Agora o dashboard deve filtrar corretamente por cliente')
    
  } catch (error) {
    console.error('❌ Erro ao corrigir arquivo:', error)
  }
}

fixDashboardFilter()
