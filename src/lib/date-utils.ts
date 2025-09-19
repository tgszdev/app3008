import { format, parseISO } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { fixDatabaseDate } from './date-fix'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Converte uma data UTC para o horário de Brasília e formata
 */
export function formatBrazilDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida'
    }
    
    // Corrigir data se estiver em 2025 (problema do servidor)
    const correctedDate = fixDatabaseDate(dateObj)
    
    // Converter para horário de Brasília
    const brazilTime = utcToZonedTime(correctedDate, BRAZIL_TIMEZONE)
    return format(brazilTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

/**
 * Converte uma data UTC para o horário de Brasília e formata apenas a data
 */
export function formatBrazilDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const correctedDate = fixDatabaseDate(dateObj)
    const brazilTime = utcToZonedTime(correctedDate, BRAZIL_TIMEZONE)
    return format(brazilTime, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

/**
 * Converte uma data UTC para o horário de Brasília e formata apenas a hora
 */
export function formatBrazilTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const correctedDate = fixDatabaseDate(dateObj)
    const brazilTime = utcToZonedTime(correctedDate, BRAZIL_TIMEZONE)
    return format(brazilTime, "HH:mm", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar hora:', error)
    return 'Hora inválida'
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
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const correctedDate = fixDatabaseDate(dateObj)
    const brazilTime = utcToZonedTime(correctedDate, BRAZIL_TIMEZONE)
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
    return 'Data inválida'
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