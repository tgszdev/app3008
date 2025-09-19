import { format, parseISO } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Converte uma data UTC para o horário de Brasília e formata
 */
export function formatBrazilDateTime(date: string | Date | null | undefined): string {
  if (!date) {
    console.warn('formatBrazilDateTime: Data vazia ou nula')
    return 'N/A'
  }
  
  try {
    let dateObj: Date
    
    // Tratamento especial para diferentes formatos de data
    if (typeof date === 'string') {
      // Limpar espaços e verificar se não está vazio
      const trimmedDate = date.trim()
      if (!trimmedDate) {
        console.warn('formatBrazilDateTime: String de data vazia')
        return 'N/A'
      }
      
      // Tentar diferentes formatos
      // Formato ISO completo com timezone
      if (trimmedDate.includes('T')) {
        dateObj = new Date(trimmedDate)
      }
      // Formato YYYY-MM-DD (assumir meia-noite UTC)
      else if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateObj = new Date(trimmedDate + 'T00:00:00Z')
      }
      // Outros formatos
      else {
        const cleanDate = trimmedDate.replace(/[+-]\d{2}:\d{2}$/, '')
        if (!trimmedDate.endsWith('Z') && !trimmedDate.match(/[+-]\d{2}:\d{2}$/)) {
          dateObj = new Date(cleanDate + 'Z')
        } else {
          dateObj = new Date(trimmedDate)
        }
      }
      
      // Verificar se ainda é inválido
      if (isNaN(dateObj.getTime())) {
        // Tentar parseISO como recurso
        try {
          dateObj = parseISO(trimmedDate)
          if (isNaN(dateObj.getTime())) {
            // Último recurso - tentar parse direto
            dateObj = new Date(trimmedDate)
            if (isNaN(dateObj.getTime())) {
              console.error('formatBrazilDateTime: Não foi possível fazer parse da data:', trimmedDate)
              return 'N/A'
            }
          }
        } catch {
          console.error('formatBrazilDateTime: Erro no parseISO:', trimmedDate)
          return 'N/A'
        }
      }
    } else {
      dateObj = date
    }
    
    // Verificar se a data é válida
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.error('formatBrazilDateTime: Data inválida após processamento:', date)
      return 'N/A'
    }
    
    // Converter para horário de Brasília
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error, 'Data original:', date)
    // Tentar formatação simples como fallback
    try {
      const d = new Date(date as string)
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        // Substituir a vírgula por " às " para manter o padrão
        return dateStr.replace(',', ' às')
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
  if (!date) {
    console.warn('formatBrazilDate: Data vazia ou nula')
    return 'N/A'
  }
  
  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      // Limpar espaços e verificar se não está vazio
      const trimmedDate = date.trim()
      if (!trimmedDate) {
        console.warn('formatBrazilDate: String de data vazia')
        return 'N/A'
      }
      
      // Tentar diferentes formatos
      // Formato ISO completo com timezone
      if (trimmedDate.includes('T')) {
        dateObj = new Date(trimmedDate)
      }
      // Formato YYYY-MM-DD
      else if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateObj = new Date(trimmedDate + 'T00:00:00Z')
      }
      // Outros formatos
      else {
        const cleanDate = trimmedDate.replace(/[+-]\d{2}:\d{2}$/, '')
        if (!trimmedDate.endsWith('Z') && !trimmedDate.match(/[+-]\d{2}:\d{2}$/)) {
          dateObj = new Date(cleanDate + 'Z')
        } else {
          dateObj = new Date(trimmedDate)
        }
      }
      
      // Verificar se ainda é inválido
      if (isNaN(dateObj.getTime())) {
        // Último recurso - tentar parse direto
        dateObj = new Date(trimmedDate)
        if (isNaN(dateObj.getTime())) {
          console.error('formatBrazilDate: Não foi possível fazer parse da data:', trimmedDate)
          return 'N/A'
        }
      }
    } else {
      dateObj = date
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.error('formatBrazilDate: Data inválida após processamento:', date)
      return 'N/A'
    }
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Data original:', date)
    return 'N/A'
  }
}

/**
 * Converte uma data UTC para o horário de Brasília e formata apenas a hora
 */
export function formatBrazilTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      const cleanDate = date.replace(/[+-]\d{2}:\d{2}$/, '')
      if (!date.endsWith('Z') && !date.match(/[+-]\d{2}:\d{2}$/)) {
        dateObj = new Date(cleanDate + 'Z')
      } else {
        dateObj = new Date(date)
      }
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(date)
      }
    } else {
      dateObj = date
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) return 'N/A'
    
    const brazilTime = utcToZonedTime(dateObj, BRAZIL_TIMEZONE)
    return format(brazilTime, "HH:mm", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar hora:', error)
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
 * Formata tempo relativo (ex: "há 2 horas")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      const cleanDate = date.replace(/[+-]\d{2}:\d{2}$/, '')
      if (!date.endsWith('Z') && !date.match(/[+-]\d{2}:\d{2}$/)) {
        dateObj = new Date(cleanDate + 'Z')
      } else {
        dateObj = new Date(date)
      }
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(date)
      }
    } else {
      dateObj = date
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) return 'N/A'
    
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
    console.error('Erro ao formatar tempo relativo:', error)
    return 'N/A'
  }
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
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffMs / 60000)
}