import { format, parseISO, isValid, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'
const BRAZIL_OFFSET = -3 // UTC-3

/**
 * Retorna timestamp atual no fuso horário de São Paulo
 * Use esta função para TODOS os inserts/updates no banco
 */
export function getBrazilTimestamp(): string {
  const nowBrazil = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  return new Date(nowBrazil).toISOString()
}

/**
 * Formata data que JÁ ESTÁ em horário do Brasil (gravada com getBrazilTimestamp)
 * NÃO faz conversão de timezone
 */
export function formatBrazilTimestampDirect(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      return 'N/A'
    }
    
    // Formatar SEM conversão de timezone (data já está em horário do Brasil)
    const formatted = dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return formatted.replace(',', ' às')
  } catch (error) {
    console.error('formatBrazilTimestampDirect erro:', error)
    return 'N/A'
  }
}

/**
 * Função auxiliar mais simples para converter qualquer formato de data
 */
function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  
  // Se já é um Date válido
  if (date instanceof Date) {
    return isValid(date) ? date : null
  }
  
  // Se é string
  if (typeof date === 'string') {
    const trimmed = date.trim()
    
    // Verificar strings vazias ou literais null/undefined
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'N/A') {
      return null
    }
    
    // Tentar conversão direta primeiro
    try {
      const directDate = new Date(trimmed)
      if (isValid(directDate) && !isNaN(directDate.getTime())) {
        return directDate
      }
    } catch (e) {
      // Continue para próximas tentativas
    }
    
    // Se tem formato PostgreSQL com espaço, converter para ISO
    if (trimmed.includes(' ') && trimmed.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
      try {
        const isoFormat = trimmed.replace(' ', 'T')
        const withZ = isoFormat.includes('Z') || isoFormat.includes('+') || isoFormat.includes('-') 
          ? isoFormat 
          : isoFormat + 'Z'
        const parsed = new Date(withZ)
        if (isValid(parsed)) return parsed
      } catch (e) {
        // Continue
      }
    }
    
    // Tentar parseISO
    try {
      const parsed = parseISO(trimmed)
      if (isValid(parsed)) return parsed
    } catch (e) {
      // Continue
    }
    
    // Se é só data (YYYY-MM-DD)
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        const parsed = new Date(trimmed + 'T00:00:00Z')
        if (isValid(parsed)) return parsed
      } catch (e) {
        // Continue
      }
    }
    
    // Timestamp Unix
    const timestamp = parseInt(trimmed, 10)
    if (!isNaN(timestamp) && timestamp > 0) {
      const parsed = timestamp < 10000000000 
        ? new Date(timestamp * 1000) // Segundos
        : new Date(timestamp)        // Milissegundos
      if (isValid(parsed)) return parsed
    }
  }
  
  return null
}

/**
 * Converte uma data UTC para o horário de Brasília usando toLocaleString
 * Fallback que não depende de date-fns-tz
 */
function toBrazilTime(date: Date): Date {
  // Usar toLocaleString para obter a data no timezone brasileiro
  const brazilDateStr = date.toLocaleString('en-US', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Parse da string resultante
  const [datePart, timePart] = brazilDateStr.split(', ')
  const [month, day, year] = datePart.split('/')
  const [hour, minute, second] = timePart.split(':')
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  )
}

/**
 * Converte uma data UTC para o horário de Brasília e formata
 */
export function formatBrazilDateTime(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      if (date) {
        console.debug('formatBrazilDateTime: Não conseguiu converter:', date)
      }
      return 'N/A'
    }
    
    // NÃO converter timezone - o banco já tem horário do Brasil
    // Apenas formatar a data sem conversão
    const formatted = dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // Substituir vírgula por "às"
    return formatted.replace(',', ' às')
  } catch (error) {
    console.error('formatBrazilDateTime erro:', error)
    return 'N/A'
  }
}

/**
 * Converte uma data UTC para o horário de Brasília e formata apenas a data
 */
export function formatBrazilDate(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      if (date) {
        console.debug('formatBrazilDate: Não conseguiu converter:', date)
      }
      return 'N/A'
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error('formatBrazilDate erro:', error)
    return 'N/A'
  }
}

/**
 * Converte uma data UTC para o horário de Brasília e formata apenas a hora
 */
export function formatBrazilTime(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      if (date) {
        console.debug('formatBrazilTime: Não conseguiu converter:', date)
      }
      return 'N/A'
    }
    
    return dateObj.toLocaleTimeString('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('formatBrazilTime erro:', error)
    return 'N/A'
  }
}

/**
 * Formata tempo relativo (ex: "há 2 horas")
 * VERSÃO SEM date-fns-tz
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      // Se falhou, tentar abordagem alternativa para strings
      if (typeof date === 'string' && date && date.trim()) {
        const trimmed = date.trim()
        
        // Última tentativa com conversão direta
        try {
          const lastTry = new Date(trimmed)
          if (isValid(lastTry) && !isNaN(lastTry.getTime())) {
            const now = new Date()
            const diffMs = now.getTime() - lastTry.getTime()
            const diffMinutes = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMinutes / 60)
            const diffDays = Math.floor(diffHours / 24)
            
            // Verificar se a diferença é negativa (data no futuro)
            if (diffMinutes < 0) {
              return 'em breve'
            }
            
            if (diffMinutes < 1) return 'agora'
            if (diffMinutes === 1) return 'há 1 minuto'
            if (diffMinutes < 60) return `há ${diffMinutes} minutos`
            if (diffHours === 1) return 'há 1 hora'
            if (diffHours < 24) return `há ${diffHours} horas`
            if (diffDays === 1) return 'há 1 dia'
            if (diffDays < 30) return `há ${diffDays} dias`
            if (diffDays < 365) {
              const months = Math.floor(diffDays / 30)
              return months === 1 ? 'há 1 mês' : `há ${months} meses`
            }
            
            // Se for mais de um ano, mostrar a data completa
            return formatBrazilDateTime(lastTry)
          }
        } catch (e) {
          console.debug('formatRelativeTime: Última tentativa falhou:', e)
        }
      }
      
      console.debug('formatRelativeTime: Não conseguiu converter:', date)
      return 'Data indisponível'
    }
    
    // Se conseguiu fazer o parse - calcular diferença diretamente
    const now = new Date()
    const diffMinutes = differenceInMinutes(now, dateObj)
    const diffHours = differenceInHours(now, dateObj)
    const diffDays = differenceInDays(now, dateObj)
    
    // Verificar se a diferença é negativa (data no futuro)
    if (diffMinutes < 0) {
      return 'em breve'
    }
    
    if (diffMinutes < 1) return 'agora'
    if (diffMinutes === 1) return 'há 1 minuto'
    if (diffMinutes < 60) return `há ${diffMinutes} minutos`
    if (diffHours === 1) return 'há 1 hora'
    if (diffHours < 24) return `há ${diffHours} horas`
    if (diffDays === 1) return 'há 1 dia'
    if (diffDays < 30) return `há ${diffDays} dias`
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return months === 1 ? 'há 1 mês' : `há ${months} meses`
    }
    
    // Se for mais de um ano, mostrar a data completa
    return formatBrazilDateTime(dateObj)
  } catch (error) {
    console.error('formatRelativeTime erro:', error)
    return 'Data indisponível'
  }
}

/**
 * Converte uma data do horário de Brasília para UTC (para salvar no banco)
 * Versão simplificada sem date-fns-tz
 */
export function brazilToUTC(date: Date): Date {
  // Adicionar 3 horas para converter de Brasil (UTC-3) para UTC
  return new Date(date.getTime() + (3 * 60 * 60 * 1000))
}

/**
 * Retorna a data/hora atual no horário de Brasília
 * Versão simplificada sem date-fns-tz
 */
export function getNowInBrazil(): Date {
  const now = new Date()
  // Usar toLocaleString para obter a data no timezone brasileiro
  const brazilDateStr = now.toLocaleString('en-US', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Parse da string resultante
  const [datePart, timePart] = brazilDateStr.split(', ')
  const [month, day, year] = datePart.split('/')
  const [hour, minute, second] = timePart.split(':')
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  )
}

/**
 * Verifica se uma data está no horário comercial brasileiro
 */
export function isBusinessHours(date?: Date): boolean {
  const brazilTime = date ? toBrazilTime(date) : getNowInBrazil()
  const hours = brazilTime.getHours()
  const day = brazilTime.getDay()
  
  // Segunda a Sexta (1-5), 8h às 18h
  return day >= 1 && day <= 5 && hours >= 8 && hours < 18
}

/**
 * Calcula diferença em minutos entre duas datas
 */
export function getMinutesDifference(date1: string | Date, date2: string | Date): number {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  
  if (!d1 || !d2) return 0
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffMs / 60000)
}

// Exportar também as funções utilitárias usadas pelo sistema de escalação
// Para manter compatibilidade com imports existentes
export const utcToZonedTime = toBrazilTime
export const zonedTimeToUtc = brazilToUTC