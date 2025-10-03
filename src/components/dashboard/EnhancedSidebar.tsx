'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { LucideIcon, ChevronDown, ChevronRight } from 'lucide-react'

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

interface EnhancedSidebarSectionProps {
  section: NavigationSection
  isAdmin: boolean
  pathname: string
  sidebarCollapsed: boolean
  isSectionCollapsed: boolean
  onToggleSection: () => void
}

export function EnhancedSidebarSection({
  section,
  isAdmin,
  pathname,
  sidebarCollapsed,
  isSectionCollapsed,
  onToggleSection
}: EnhancedSidebarSectionProps) {
  // Skip admin sections for non-admin users
  if (section.adminOnly && !isAdmin) return null
  
  const SectionIcon = section.icon
  
  // Determine section color class
  const sectionColorClass = 
    section.title === 'OPERAÇÕES' ? 'sidebar-section-operations' :
    section.title === 'APONTAMENTOS' ? 'sidebar-section-timesheets' :
    section.title === 'ANÁLISES' ? 'sidebar-section-analytics' :
    section.title === 'RECURSOS' ? 'sidebar-section-resources' :
    section.title === 'ADMINISTRAÇÃO' ? 'sidebar-section-admin' : ''
  
  const iconColorClass = 
    section.title === 'OPERAÇÕES' ? 'sidebar-icon-operations' :
    section.title === 'APONTAMENTOS' ? 'sidebar-icon-timesheets' :
    section.title === 'ANÁLISES' ? 'sidebar-icon-analytics' :
    section.title === 'RECURSOS' ? 'sidebar-icon-resources' :
    section.title === 'ADMINISTRAÇÃO' ? 'sidebar-icon-admin' : ''
  
  return (
    <div className={cn("space-y-1 rounded-lg overflow-visible", sectionColorClass)}>
      {/* Section Header */}
      <button
        onClick={onToggleSection}
        data-sidebar-tooltip={section.title}
        className={cn(
          "sidebar-section-header w-full flex items-center text-xs font-semibold uppercase tracking-wider rounded-lg transition-all",
          "hover:bg-gray-50 dark:hover:bg-gray-700/50",
          sidebarCollapsed ? "justify-center py-2.5 px-2" : "justify-between px-3 py-2"
        )}
      >
        <div className={cn("flex items-center", iconColorClass)}>
          <SectionIcon className={cn(
            "flex-shrink-0", 
            sidebarCollapsed ? "h-5 w-5" : "h-4 w-4",
            !sidebarCollapsed && "mr-2"
          )} />
          <span className={cn("sidebar-label text-gray-600 dark:text-gray-300")}>
            {section.title}
          </span>
        </div>
        {!sidebarCollapsed && (
          isSectionCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )
        )}
      </button>
      
      {/* Section Items - Show when section is expanded */}
      {!isSectionCollapsed && (
        <div className={cn(
          "space-y-1",
          !sidebarCollapsed ? "ml-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700" : "mt-1"
        )}>
          {section.items.map((item) => {
            if (item.adminOnly && !isAdmin) return null
            
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                data-sidebar-tooltip={item.name}
                className={cn(
                  "sidebar-item flex items-center text-sm font-medium rounded-lg transition-all",
                  isActive
                    ? "active bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                  sidebarCollapsed ? "justify-center py-2 px-2.5" : "px-3 py-1.5"
                )}
              >
                <div className="flex items-center">
                  <Icon className={cn(
                    "flex-shrink-0",
                    sidebarCollapsed ? "h-5 w-5" : "h-4 w-4",
                    !sidebarCollapsed && "mr-3"
                  )} />
                  <span className={cn("sidebar-label truncate")}>
                    {item.name}
                  </span>
                </div>

              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}