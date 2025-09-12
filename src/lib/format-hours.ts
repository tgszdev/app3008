/**
 * Converte horas decimais para formato legível com "h" e "min"
 * @param decimalHours - Número decimal representando horas (ex: 136.5)
 * @returns String no formato "Xh Ymin" (ex: "136h 30min")
 */
export function formatHoursToHHMM(decimalHours: number): string {
  // Garante que não seja negativo ou NaN
  if (!decimalHours || decimalHours < 0) {
    return '0h'
  }
  
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  
  // Ajusta se os minutos arredondados resultarem em 60
  if (minutes === 60) {
    return `${hours + 1}h`
  }
  
  // Se não houver minutos, mostra apenas horas
  if (minutes === 0) {
    return `${hours}h`
  }
  
  // Se não houver horas, mostra apenas minutos
  if (hours === 0) {
    return `${minutes}min`
  }
  
  // Formato completo com horas e minutos
  return `${hours}h ${minutes}min`
}