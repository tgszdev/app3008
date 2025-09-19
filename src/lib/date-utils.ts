import { format, parseISO, isValid } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Função auxiliar para converter qualquer formato de data para Date object válido
 */
function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  
  // Se já é um Date válido
  if (date instanceof Date && isValid(date)) {
    return date
  }
  
  // Se é string
  if (typeof date === 'string') {
    const trimmed = date.trim()
    if (!trimmed) return null
    
    // Lista de tentativas de parsing em ordem de prioridade
    const parsers = [
      // 1. Tentar parseISO primeiro (mais confiável para strings ISO)
      () => {
        const parsed = parseISO(trimmed)
        return isValid(parsed) ? parsed : null
      },
      // 2. Formato ISO sem Z (assumir UTC)
      () => {
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
          const parsed = parseISO(trimmed + 'Z')
          return isValid(parsed) ? parsed : null
        }
        return null
      },
      // 3. Formato YYYY-MM-DD (assumir início do dia UTC)
      () => {
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const parsed = parseISO(trimmed + 'T00:00:00Z')
          return isValid(parsed) ? parsed : null
        }
        return null
      },
      // 4. Tentar new Date() diretamente
      () => {
        const parsed = new Date(trimmed)
        return isValid(parsed) ? parsed : null
      },
      // 5. Formato com milissegundos
      () => {
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/)) {
          const parsed = new Date(trimmed)
          return isValid(parsed) ? parsed : null
        }
        return null
      },
      // 6. Timestamp Unix (número como string)
      () => {
        const timestamp = parseInt(trimmed, 10)
        if (!isNaN(timestamp) && timestamp > 0) {
          // Se for um timestamp Unix (segundos desde 1970)
          const parsed = timestamp < 10000000000 
            ? new Date(timestamp * 1000) // Segundos
            : new Date(timestamp)        // Milissegundos
          return isValid(parsed) ? parsed : null
        }
        return null
      }
    ]
    
    // Tentar cada parser até encontrar um que funcione
    for (const parser of parsers) {
      try {
        const result = parser()
        if (result) return result
      } catch {
        // Continuar para o próximo parser
      }
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
      console.warn('formatBrazilDateTime: Data inválida ou nula:', date)
      return 'N/A'
    }
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch (error) {
    console.error('formatBrazilDateTime erro:', error, 'Data:', date)
    
    // Fallback: tentar formatação básica
    try {
      if (date) {
        const d = new Date(date as any)
        if (isValid(d)) {
          return d.toLocaleString('pt-BR', {
            timeZone: BRAZIL_TIMEZONE,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', ' às')
        }
      }
    } catch {
      // Ignorar erro do fallback
    }
    
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
      console.warn('formatBrazilDate: Data inválida ou nula:', date)
      return 'N/A'
    }
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, 'dd/MM/yyyy', { locale: ptBR })
  } catch (error) {
    console.error('formatBrazilDate erro:', error, 'Data:', date)
    
    // Fallback: tentar formatação básica
    try {
      if (date) {
        const d = new Date(date as any)
        if (isValid(d)) {
          return d.toLocaleDateString('pt-BR', {
            timeZone: BRAZIL_TIMEZONE,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        }
      }
    } catch {
      // Ignorar erro do fallback
    }
    
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
      console.warn('formatBrazilTime: Data inválida ou nula:', date)
      return 'N/A'
    }
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, 'HH:mm', { locale: ptBR })
  } catch (error) {
    console.error('formatBrazilTime erro:', error, 'Data:', date)
    
    // Fallback: tentar formatação básica
    try {
      if (date) {
        const d = new Date(date as any)
        if (isValid(d)) {
          return d.toLocaleTimeString('pt-BR', {
            timeZone: BRAZIL_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
    } catch {
      // Ignorar erro do fallback
    }
    
    return 'N/A'
  }
}

/**
 * Formata tempo relativo (ex: "há 2 horas")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      console.warn('formatRelativeTime: Data inválida ou nula:', date)
      return 'N/A'
    }
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    const now = getNowInBrazil()
    
    const diffMs = now.getTime() - brazilTime.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMinutes < 1) return 'agora'
    if (diffMinutes < 60) return `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffDays < 30) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
    
    return formatBrazilDateTime(date)
  } catch (error) {
    console.error('formatRelativeTime erro:', error, 'Data:', date)
    return 'N/A'
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