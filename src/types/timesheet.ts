export interface Timesheet {
  id: string;
  ticket_id: string;
  user_id: string;
  activity_description: string;
  hours_worked: number;
  work_date: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  ticket?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
    avatar_url?: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TimesheetPermission {
  id: string;
  user_id?: string;
  department?: string;
  role?: string;
  can_submit_timesheet: boolean;
  can_approve_timesheet: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimesheetHistory {
  id: string;
  timesheet_id: string;
  action: 'submitted' | 'approved' | 'rejected' | 'edited';
  performed_by: string;
  reason?: string;
  previous_status?: string;
  new_status?: string;
  created_at: string;
  
  // Relations
  performer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TimesheetStatistics {
  total_hours: number;
  approved_hours: number;
  pending_hours: number;
  rejected_hours: number;
  tickets_worked?: number;
}

export interface TimesheetFilters {
  user_id?: string;
  ticket_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  start_date?: string;
  end_date?: string;
  department?: string;
}

export interface CreateTimesheetData {
  ticket_id: string;
  activity_description: string;
  hours_worked: number;
  work_date: string;
}

export interface UpdateTimesheetData {
  activity_description?: string;
  hours_worked?: number;
  work_date?: string;
}

export interface ApproveTimesheetData {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface TimesheetSummary {
  user_id: string;
  user_name: string;
  user_department: string;
  total_hours: number;
  approved_hours: number;
  pending_hours: number;
  rejected_hours: number;
  tickets_count: number;
  period: {
    start_date: string;
    end_date: string;
  };
}