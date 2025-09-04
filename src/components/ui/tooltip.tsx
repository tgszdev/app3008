'use client'

import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function Tooltip({ children, content, side = 'right' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm pointer-events-none whitespace-nowrap",
            side === 'top' && "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
            side === 'right' && "left-full top-1/2 transform -translate-y-1/2 ml-2",
            side === 'bottom' && "top-full left-1/2 transform -translate-x-1/2 mt-2",
            side === 'left' && "right-full top-1/2 transform -translate-y-1/2 mr-2"
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4 border-transparent",
              side === 'top' && "top-full left-1/2 transform -translate-x-1/2 border-t-gray-900",
              side === 'right' && "right-full top-1/2 transform -translate-y-1/2 border-r-gray-900",
              side === 'bottom' && "bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900",
              side === 'left' && "left-full top-1/2 transform -translate-y-1/2 border-l-gray-900"
            )}
          />
        </div>
      )}
    </div>
  )
}