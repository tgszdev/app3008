'use client'

import React from 'react'

interface InstantTooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export default function InstantTooltip({ content, children, className = '' }: InstantTooltipProps) {
  return (
    <div className={`relative group ${className}`}>
      {children}
      
      {/* Tooltip com CSS puro - aparece instantaneamente */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-50">
        {content}
        {/* Seta */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}
