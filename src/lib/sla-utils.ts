import { differenceInMinutes, addMinutes, isWeekend, setHours, setMinutes, format, isAfter, isBefore, parseISO } from 'date-fns'

export interface SLAConfiguration {
  id: string
  name: string
  description?: string
  category_id?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  first_response_time: number // em minutos
  resolution_time: number // em minutos
  business_hours_only: boolean
  business_hours_start: string // "08:00:00"
  business_hours_end: string // "18:00:00"
  working_days: string // "1,2,3,4,5"
  alert_percentage: number
  is_active: boolean
}

export interface SLAStatus {
  first_response: {
    target: Date
    status: 'pending' | 'met' | 'breached' | 'at_risk'
    percentage: number
    remaining_minutes: number
    elapsed_minutes: number
  }
  resolution: {
    target: Date
    status: 'pending' | 'met' | 'breached' | 'at_risk'
    percentage: number
    remaining_minutes: number
    elapsed_minutes: number
  }
}

// Calcula minutos úteis entre duas datas
export function calculateBusinessMinutes(
  startDate: Date,
  endDate: Date,
  config: Pick<SLAConfiguration, 'business_hours_only' | 'business_hours_start' | 'business_hours_end' | 'working_days'>
): number {
  if (!config.business_hours_only) {
    return differenceInMinutes(endDate, startDate)
  }

  let totalMinutes = 0
  let currentDate = new Date(startDate)
  const workingDays = config.working_days.split(',').map(Number)
  
  // Parse business hours
  const [startHour, startMinute] = config.business_hours_start.split(':').map(Number)
  const [endHour, endMinute] = config.business_hours_end.split(':').map(Number)

  while (currentDate < endDate) {
    const dayOfWeek = currentDate.getDay()
    
    // Verifica se é dia útil (0 = Domingo, 6 = Sábado)
    if (workingDays.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
      // Define início e fim do horário comercial para o dia atual
      const businessStart = setMinutes(setHours(currentDate, startHour), startMinute)
      const businessEnd = setMinutes(setHours(currentDate, endHour), endMinute)
      
      // Calcula o período válido para este dia
      const periodStart = isAfter(currentDate, businessStart) ? currentDate : businessStart
      const periodEnd = isBefore(endDate, businessEnd) ? endDate : businessEnd
      
      // Se há tempo útil neste dia, adiciona ao total
      if (periodEnd > periodStart) {
        totalMinutes += differenceInMinutes(periodEnd, periodStart)
      }
    }
    
    // Move para o próximo dia
    currentDate = setHours(setMinutes(new Date(currentDate), 0), 0)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return totalMinutes
}

// Calcula data alvo considerando horário comercial
export function calculateTargetDate(
  startDate: Date,
  minutesToAdd: number,
  config: Pick<SLAConfiguration, 'business_hours_only' | 'business_hours_start' | 'business_hours_end' | 'working_days'>
): Date {
  if (!config.business_hours_only) {
    return addMinutes(startDate, minutesToAdd)
  }

  let remainingMinutes = minutesToAdd
  let currentDate = new Date(startDate)
  const workingDays = config.working_days.split(',').map(Number)
  
  // Parse business hours
  const [startHour, startMinute] = config.business_hours_start.split(':').map(Number)
  const [endHour, endMinute] = config.business_hours_end.split(':').map(Number)
  const businessMinutesPerDay = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)

  while (remainingMinutes > 0) {
    const dayOfWeek = currentDate.getDay()
    
    // Verifica se é dia útil
    if (workingDays.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
      const businessStart = setMinutes(setHours(currentDate, startHour), startMinute)
      const businessEnd = setMinutes(setHours(currentDate, endHour), endMinute)
      
      // Se estamos antes do horário comercial, move para o início
      if (currentDate < businessStart) {
        currentDate = businessStart
      }
      
      // Se estamos dentro do horário comercial
      if (currentDate >= businessStart && currentDate <= businessEnd) {
        const availableToday = differenceInMinutes(businessEnd, currentDate)
        
        if (remainingMinutes <= availableToday) {
          return addMinutes(currentDate, remainingMinutes)
        } else {
          remainingMinutes -= availableToday
        }
      }
    }
    
    // Move para o próximo dia útil
    currentDate = setMinutes(setHours(new Date(currentDate), startHour), startMinute)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return currentDate
}

// Calcula status do SLA
export function calculateSLAStatus(
  ticket: {
    created_at: string
    first_response_at?: string | null
    resolved_at?: string | null
    status: string
  },
  config: SLAConfiguration,
  currentTime: Date = new Date()
): SLAStatus {
  const createdAt = parseISO(ticket.created_at)
  
  // Calcula status da primeira resposta
  const firstResponseTarget = calculateTargetDate(createdAt, config.first_response_time, config)
  const firstResponseElapsed = ticket.first_response_at 
    ? calculateBusinessMinutes(createdAt, parseISO(ticket.first_response_at), config)
    : calculateBusinessMinutes(createdAt, currentTime, config)
  
  const firstResponseRemaining = config.first_response_time - firstResponseElapsed
  const firstResponsePercentage = (firstResponseElapsed / config.first_response_time) * 100
  
  let firstResponseStatus: 'pending' | 'met' | 'breached' | 'at_risk' = 'pending'
  if (ticket.first_response_at) {
    firstResponseStatus = firstResponseElapsed <= config.first_response_time ? 'met' : 'breached'
  } else if (firstResponsePercentage >= config.alert_percentage) {
    firstResponseStatus = firstResponsePercentage >= 100 ? 'breached' : 'at_risk'
  }
  
  // Calcula status da resolução
  const resolutionTarget = calculateTargetDate(createdAt, config.resolution_time, config)
  const resolutionElapsed = ticket.resolved_at
    ? calculateBusinessMinutes(createdAt, parseISO(ticket.resolved_at), config)
    : calculateBusinessMinutes(createdAt, currentTime, config)
  
  const resolutionRemaining = config.resolution_time - resolutionElapsed
  const resolutionPercentage = (resolutionElapsed / config.resolution_time) * 100
  
  let resolutionStatus: 'pending' | 'met' | 'breached' | 'at_risk' = 'pending'
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    resolutionStatus = resolutionElapsed <= config.resolution_time ? 'met' : 'breached'
  } else if (resolutionPercentage >= config.alert_percentage) {
    resolutionStatus = resolutionPercentage >= 100 ? 'breached' : 'at_risk'
  }
  
  return {
    first_response: {
      target: firstResponseTarget,
      status: firstResponseStatus,
      percentage: Math.min(firstResponsePercentage, 100),
      remaining_minutes: Math.max(firstResponseRemaining, 0),
      elapsed_minutes: firstResponseElapsed
    },
    resolution: {
      target: resolutionTarget,
      status: resolutionStatus,
      percentage: Math.min(resolutionPercentage, 100),
      remaining_minutes: Math.max(resolutionRemaining, 0),
      elapsed_minutes: resolutionElapsed
    }
  }
}

// Formata tempo em minutos para string legível
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  if (days === 1) {
    return remainingHours > 0 ? `1 dia ${remainingHours}h` : '1 dia'
  }
  
  return remainingHours > 0 ? `${days} dias ${remainingHours}h` : `${days} dias`
}

// Obtém cor baseada no status do SLA
export function getSLAStatusColor(status: 'pending' | 'met' | 'breached' | 'at_risk'): string {
  switch (status) {
    case 'met':
      return 'text-green-600 bg-green-100'
    case 'breached':
      return 'text-red-600 bg-red-100'
    case 'at_risk':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// Obtém ícone baseado no status do SLA
export function getSLAStatusIcon(status: 'pending' | 'met' | 'breached' | 'at_risk'): string {
  switch (status) {
    case 'met':
      return '✓'
    case 'breached':
      return '✗'
    case 'at_risk':
      return '⚠'
    default:
      return '◷'
  }
}