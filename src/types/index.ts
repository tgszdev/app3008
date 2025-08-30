export type UserRole = 'user' | 'analyst' | 'admin'
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
}

export interface Module {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  module_id?: string
  module?: Module
  requester_id: string
  requester?: User
  assigned_to?: string
  assignee?: User
  resolved_at?: Date
  closed_at?: Date
  sla_deadline?: Date
  tags?: string[]
  created_at: Date
  updated_at: Date
  comments?: Comment[]
  attachments?: Attachment[]
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  user?: User
  content: string
  is_internal: boolean
  created_at: Date
  updated_at: Date
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  ticket_id?: string
  comment_id?: string
  user_id: string
  user?: User
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  created_at: Date
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type?: string
  related_ticket_id?: string
  related_ticket?: Ticket
  is_read: boolean
  read_at?: Date
  created_at: Date
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  language: string
  email_notifications: boolean
  push_notifications: boolean
  notification_sound: boolean
  updated_at: Date
}

export interface DashboardStats {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  resolved_tickets: number
  closed_tickets: number
  average_resolution_time: number
  tickets_by_priority: {
    low: number
    medium: number
    high: number
    critical: number
  }
  tickets_by_module: {
    module: string
    count: number
  }[]
  recent_tickets: Ticket[]
}