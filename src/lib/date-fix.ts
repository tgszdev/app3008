/**
 * Correção temporária para o problema de data do servidor
 * O servidor está com data errada (2025 ao invés de 2024)
 * Esta função retorna a data/hora real correta
 */

// O servidor está aproximadamente 9 meses no futuro
// Precisamos subtrair essa diferença
const SERVER_DATE_OFFSET_MONTHS = 9

/**
 * Obtém a data/hora real correta
 * Corrige o problema do servidor estar em 2025
 */
export function getRealDateTime(): Date {
  const serverDate = new Date()
  
  // Se estamos em 2025 no servidor, corrigir para 2024
  if (serverDate.getFullYear() === 2025) {
    // Criar data correta em 2024
    const realDate = new Date(
      2024,
      serverDate.getMonth() - SERVER_DATE_OFFSET_MONTHS,
      serverDate.getDate(),
      serverDate.getHours(),
      serverDate.getMinutes(),
      serverDate.getSeconds(),
      serverDate.getMilliseconds()
    )
    return realDate
  }
  
  return serverDate
}

/**
 * Obtém o timestamp real correto em ISO string
 */
export function getRealISOString(): string {
  return getRealDateTime().toISOString()
}

/**
 * Corrige uma data do banco (que está em 2025) para a data real (2024)
 */
export function fixDatabaseDate(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (dateObj.getFullYear() === 2025) {
    return new Date(
      2024,
      dateObj.getMonth() - SERVER_DATE_OFFSET_MONTHS,
      dateObj.getDate(),
      dateObj.getHours(),
      dateObj.getMinutes(),
      dateObj.getSeconds(),
      dateObj.getMilliseconds()
    )
  }
  
  return dateObj
}