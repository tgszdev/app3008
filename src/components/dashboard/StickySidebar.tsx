'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon, X } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

interface NavigationSection {
  title: string
  icon: LucideIcon
  items: NavigationItem[]
  adminOnly?: boolean
}

interface StickySidebarProps {
  sections: NavigationSection[]
  isAdmin: boolean
}

export function StickySidebar({ sections, isAdmin }: StickySidebarProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  // Mount check for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Color mapping for sections
  const getSectionColor = (title: string) => {
    switch (title) {
      case 'OPERAÇÕES':
        return {
          icon: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-500',
          hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
        }
      case 'APONTAMENTOS':
        return {
          icon: 'text-blue-500 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-500',
          hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
        }
      case 'ANÁLISES':
        return {
          icon: 'text-violet-500 dark:text-violet-400',
          bg: 'bg-violet-50 dark:bg-violet-900/20',
          border: 'border-violet-500',
          hover: 'hover:bg-violet-100 dark:hover:bg-violet-900/30'
        }
      case 'RECURSOS':
        return {
          icon: 'text-amber-500 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-500',
          hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30'
        }
      case 'ADMINISTRAÇÃO':
        return {
          icon: 'text-red-500 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-500',
          hover: 'hover:bg-red-100 dark:hover:bg-red-900/30'
        }
      default:
        return {
          icon: 'text-gray-500 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-500',
          hover: 'hover:bg-gray-100 dark:hover:bg-gray-900/30'
        }
    }
  }

  // Handle section click
  const handleSectionClick = (section: NavigationSection, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeSection === section.title) {
      setActiveSection(null)
    } else {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      
      // Calculate position to avoid overflow
      const menuHeight = 400 // Estimated max height
      const viewportHeight = window.innerHeight
      let topPosition = rect.top
      
      // If menu would go below viewport, position it higher
      if (topPosition + menuHeight > viewportHeight) {
        topPosition = Math.max(10, viewportHeight - menuHeight - 20)
      }
      
      setMenuPosition({
        top: topPosition,
        left: rect.right + 12 // 12px gap from sidebar for better spacing
      })
      setActiveSection(section.title)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setActiveSection(null)
      }
    }

    if (activeSection) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeSection])

  // Close menu on route change
  useEffect(() => {
    setActiveSection(null)
  }, [pathname])

  // Get active section for current route
  const getActiveSection = () => {
    for (const section of sections) {
      if (section.items.some(item => item.href === pathname)) {
        return section.title
      }
    }
    return null
  }

  const currentActiveSection = getActiveSection()

  return (
    <>
      {/* Sticky Sidebar - Always 64px */}
      <div ref={sidebarRef} className="flex flex-col gap-2 py-4 px-2">
        {sections.map((section) => {
          // Skip admin sections for non-admin users
          if (section.adminOnly && !isAdmin) return null
          
          const SectionIcon = section.icon
          const colors = getSectionColor(section.title)
          const isActive = activeSection === section.title
          const hasActiveItem = currentActiveSection === section.title
          
          return (
            <button
              key={section.title}
              onClick={(e) => handleSectionClick(section, e)}
              className={cn(
                "relative group flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
                "border-2",
                isActive && `${colors.bg} ${colors.border}`,
                !isActive && hasActiveItem && `${colors.bg} border-transparent`,
                !isActive && !hasActiveItem && "border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                colors.hover
              )}
              title={section.title}
            >
              <SectionIcon className={cn("h-5 w-5", colors.icon)} />
              
              {/* Active indicator dot */}
              {hasActiveItem && !isActive && (
                <div className={cn(
                  "absolute -right-1 -top-1 w-2 h-2 rounded-full",
                  colors.bg,
                  colors.border,
                  "border"
                )} />
              )}
              
              {/* Tooltip on hover */}
              <div className={cn(
                "absolute left-full ml-2 px-2 py-1 text-xs font-medium rounded-md",
                "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900",
                "opacity-0 pointer-events-none group-hover:opacity-100",
                "transition-opacity duration-200 whitespace-nowrap z-50"
              )}>
                {section.title}
              </div>
            </button>
          )
        })}
      </div>

      {/* Floating Submenu - Rendered as Portal */}
      {mounted && activeSection && createPortal(
        <div
          ref={menuRef}
          className={cn(
            "fixed z-[10001] min-w-[220px] max-w-[300px] rounded-lg shadow-2xl",
            "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            "animate-in fade-in-0 zoom-in-95 duration-200 floating-menu-scrollbar"
          )}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}
        >
          {sections.map((section) => {
            if (section.title !== activeSection) return null
            if (section.adminOnly && !isAdmin) return null
            
            const colors = getSectionColor(section.title)
            
            return (
              <div key={section.title}>
                {/* Section Header */}
                <div className={cn(
                  "flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700",
                  colors.bg
                )}>
                  <div className="flex items-center gap-2">
                    <section.icon className={cn("h-4 w-4", colors.icon)} />
                    <span className="text-sm font-semibold">{section.title}</span>
                  </div>
                  <button
                    onClick={() => setActiveSection(null)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                {/* Section Items */}
                <div className="py-2">
                  {section.items.map((item) => {
                    if (item.adminOnly && !isAdmin) return null
                    
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                          isActive
                            ? cn("font-medium", colors.bg, colors.icon)
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}