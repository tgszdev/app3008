import { format, parseISO, isValid } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Função auxiliar mais simples e robusta para converter qualquer formato de data
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
    
    // Tentar conversão direta primeiro (funciona para a maioria dos formatos)
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
 * Converte uma data UTC para o horário de Brasília e formata
 */
export function formatBrazilDateTime(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      // Log mais discreto
      if (date) {
        console.debug('formatBrazilDateTime: Não conseguiu converter:', date)
      }
      return 'N/A'
    }
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
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
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, 'dd/MM/yyyy', { locale: ptBR })
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
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, 'HH:mm', { locale: ptBR })
  } catch (error) {
    console.error('formatBrazilTime erro:', error)
    return 'N/A'
  }
}

/**
 * Formata tempo relativo (ex: "há 2 horas")
 * VERSÃO SIMPLIFICADA E CORRIGIDA
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  try {
    // Tentar parse direto primeiro
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      // Se falhou, tentar abordagem alternativa para strings
      if (typeof date === 'string' && date && date.trim()) {
        const trimmed = date.trim()
        
        // Última tentativa com conversão direta
        try {
          const lastTry = new Date(trimmed)
          if (isValid(lastTry) && !isNaN(lastTry.getTime())) {
            const brazilTime = utcToZonedTime(lastTry, BRAZIL_TIMEZONE)
            const now = getNowInBrazil()
            
            const diffMs = now.getTime() - brazilTime.getTime()
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
    
    // Se conseguiu fazer o parse
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    const now = getNowInBrazil()
    
    const diffMs = now.getTime() - brazilTime.getTime()
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
    return formatBrazilDateTime(dateObj)
  } catch (error) {
    console.error('formatRelativeTime erro:', error)
    return 'Data indisponível'
  }
}

/**
 * Converte uma data do horário de Brasília para UTC (para salvar no banco)
 */
export function brazilToUTC(date: Date): Date {
  return zonedTimeToUtc(date, BRAZIL_TIMEZONE)
}

/**
 * Retorna a data/hora atual no horário de Brasília
 */
export function getNowInBrazil(): Date {
  return utcToZonedTime(new Date(), BRAZIL_TIMEZONE)
}

/**
 * Verifica se uma data está no horário comercial brasileiro
 */
export function isBusinessHours(date?: Date): boolean {
  const brazilTime = date ? utcToZonedTime(date, BRAZIL_TIMEZONE) : getNowInBrazil()
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