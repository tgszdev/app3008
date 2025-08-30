import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function formatDateShort(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    waiting: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  }
  return colors[status] || colors.open
}

export function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  return colors[priority] || colors.medium
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Progresso',
    waiting: 'Aguardando',
    resolved: 'Resolvido',
    closed: 'Fechado',
  }
  return labels[status] || status
}

export function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  }
  return labels[priority] || priority
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    user: 'Usuário',
    analyst: 'Analista',
    admin: 'Administrador',
  }
  return labels[role] || role
}

export function calculateSLA(priority: string): Date {
  const now = new Date()
  const hours: Record<string, number> = {
    critical: 4,
    high: 8,
    medium: 24,
    low: 48,
  }
  
  const slaHours = hours[priority] || 24
  now.setHours(now.getHours() + slaHours)
  return now
}