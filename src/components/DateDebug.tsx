'use client'

import { formatBrazilDateTime, formatBrazilDate, formatRelativeTime } from '@/lib/date-utils'

interface DateDebugProps {
  date: any
  label?: string
}

export function DateDebug({ date, label = 'Data' }: DateDebugProps) {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const getDateInfo = () => {
    if (!date) return 'null/undefined'
    if (typeof date === 'string') return `String: "${date}"`
    if (date instanceof Date) return `Date object: ${date.toISOString()}`
    if (typeof date === 'number') return `Number: ${date}`
    return `Unknown type: ${typeof date}`
  }

  return (
    <div className="text-xs bg-yellow-100 dark:bg-yellow-900/20 p-1 rounded">
      <div className="font-mono">
        <div>{label}: {getDateInfo()}</div>
        <div>formatBrazilDate: {formatBrazilDate(date)}</div>
        <div>formatBrazilDateTime: {formatBrazilDateTime(date)}</div>
        <div>formatRelativeTime: {formatRelativeTime(date)}</div>
      </div>
    </div>
  )
}

export default DateDebug