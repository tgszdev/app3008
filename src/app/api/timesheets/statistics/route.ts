import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const ticketId = searchParams.get('ticket_id');
    const startDate = searchParams.get('start_date') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const groupBy = searchParams.get('group_by') || 'user'; // user, ticket, date, department

    // Check permissions
    const { data: permissions } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('can_approve_timesheet')
      .eq('user_id', session.user.id)
      .single();

    // Non-approvers can only see their own statistics
    if (!permissions?.can_approve_timesheet && userId && userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get timesheets based on filters
    let query = supabaseAdmin
      .from('timesheets')
      .select(`
        *,
        ticket:tickets!inner(id, title, status, priority, project_id),
        user:users!timesheets_user_id_fkey(id, name, email, department)
      `)
      .gte('work_date', startDate)
      .lte('work_date', endDate);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (!permissions?.can_approve_timesheet) {
      // Non-approvers can only see their own data
      query = query.eq('user_id', session.user.id);
    }

    if (ticketId) {
      query = query.eq('ticket_id', ticketId);
    }

    const { data: timesheets, error } = await query;

    if (error) {
      console.error('Error fetching timesheets:', error);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Process statistics based on grouping
    const statistics = processStatistics(timesheets || [], groupBy);

    // Get summary statistics
    const summary = {
      total_hours: timesheets?.reduce((sum, t) => sum + parseFloat(t.hours_worked), 0) || 0,
      approved_hours: timesheets?.filter(t => t.status === 'approved').reduce((sum, t) => sum + parseFloat(t.hours_worked), 0) || 0,
      pending_hours: timesheets?.filter(t => t.status === 'pending').reduce((sum, t) => sum + parseFloat(t.hours_worked), 0) || 0,
      rejected_hours: timesheets?.filter(t => t.status === 'rejected').reduce((sum, t) => sum + parseFloat(t.hours_worked), 0) || 0,
      total_entries: timesheets?.length || 0,
      unique_tickets: new Set(timesheets?.map(t => t.ticket_id)).size,
      unique_users: new Set(timesheets?.map(t => t.user_id)).size,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    };

    return NextResponse.json({
      summary,
      statistics,
      raw_data: timesheets
    });
  } catch (error) {
    console.error('Statistics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function processStatistics(timesheets: any[], groupBy: string) {
  const grouped: any = {};

  timesheets.forEach(timesheet => {
    let key: string;
    let label: string;

    switch (groupBy) {
      case 'user':
        key = timesheet.user_id;
        label = timesheet.user?.name || 'Unknown User';
        break;
      case 'ticket':
        key = timesheet.ticket_id;
        label = timesheet.ticket?.title || 'Unknown Ticket';
        break;
      case 'date':
        key = timesheet.work_date;
        label = new Date(timesheet.work_date).toLocaleDateString();
        break;
      case 'department':
        key = timesheet.user?.department || 'no_department';
        label = timesheet.user?.department || 'No Department';
        break;
      default:
        key = timesheet.user_id;
        label = timesheet.user?.name || 'Unknown';
    }

    if (!grouped[key]) {
      grouped[key] = {
        key,
        label,
        total_hours: 0,
        approved_hours: 0,
        pending_hours: 0,
        rejected_hours: 0,
        entries: 0,
        tickets: new Set(),
        users: new Set(),
        details: []
      };
    }

    grouped[key].total_hours += parseFloat(timesheet.hours_worked);
    grouped[key].entries += 1;
    grouped[key].tickets.add(timesheet.ticket_id);
    grouped[key].users.add(timesheet.user_id);
    grouped[key].details.push({
      id: timesheet.id,
      date: timesheet.work_date,
      hours: timesheet.hours_worked,
      status: timesheet.status,
      ticket_title: timesheet.ticket?.title,
      user_name: timesheet.user?.name
    });

    switch (timesheet.status) {
      case 'approved':
        grouped[key].approved_hours += parseFloat(timesheet.hours_worked);
        break;
      case 'pending':
        grouped[key].pending_hours += parseFloat(timesheet.hours_worked);
        break;
      case 'rejected':
        grouped[key].rejected_hours += parseFloat(timesheet.hours_worked);
        break;
    }
  });

  // Convert to array and add computed fields
  return Object.values(grouped).map((item: any) => ({
    ...item,
    tickets_count: item.tickets.size,
    users_count: item.users.size,
    approval_rate: item.total_hours > 0 
      ? ((item.approved_hours / item.total_hours) * 100).toFixed(1)
      : '0.0',
    tickets: undefined, // Remove Set from response
    users: undefined    // Remove Set from response
  })).sort((a: any, b: any) => b.total_hours - a.total_hours);
}