import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { CreateTimesheetData } from '@/types/timesheet';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const ticketId = searchParams.get('ticket_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabaseAdmin
      .from('timesheets')
      .select(`
        *,
        ticket:tickets!inner(id, title, status, priority),
        user:users!timesheets_user_id_fkey(id, name, email, department, avatar_url),
        approver:users!timesheets_approved_by_fkey(id, name, email)
      `)
      .order('work_date', { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (ticketId) {
      query = query.eq('ticket_id', ticketId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('work_date', startDate);
    }
    if (endDate) {
      query = query.lte('work_date', endDate);
    }

    // Check permissions
    const { data: permissions } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // If user can't approve, only show their own timesheets or tickets they're assigned to
    if (!permissions?.can_approve_timesheet) {
      const { data: assignedTickets } = await supabaseAdmin
        .from('tickets')
        .select('id')
        .eq('assignee_id', session.user.id);

      const ticketIds = assignedTickets?.map(t => t.id) || [];
      
      query = query.or(`user_id.eq.${session.user.id},ticket_id.in.(${ticketIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching timesheets:', error);
      return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Timesheets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateTimesheetData = await request.json();
    console.log('POST /api/timesheets - Received data:', data);

    // Validate required fields
    if (!data.ticket_id || !data.activity_description || !data.hours_worked || !data.work_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has permission to submit timesheets
    const { data: permissions } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('can_submit_timesheet')
      .eq('user_id', session.user.id)
      .single();

    if (!permissions?.can_submit_timesheet) {
      return NextResponse.json({ error: 'You do not have permission to submit timesheets' }, { status: 403 });
    }

    // Check if ticket exists
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('id, assignee_id, assigned_to')
      .eq('id', data.ticket_id)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Allow submission if user is assigned OR if they have permission
    // This is more flexible - users with permission can log hours on any ticket
    const isAssigned = ticket.assignee_id === session.user.id || ticket.assigned_to === session.user.id;
    
    // If not assigned, check if user has general permission (already checked above)
    // So we just log a warning but allow it
    if (!isAssigned) {
      console.log(`User ${session.user.id} logging hours on unassigned ticket ${data.ticket_id}`);
    }

    // Create timesheet
    const { data: timesheet, error } = await supabaseAdmin
      .from('timesheets')
      .insert({
        ticket_id: data.ticket_id,
        user_id: session.user.id,
        activity_description: data.activity_description,
        hours_worked: data.hours_worked,
        work_date: data.work_date,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating timesheet:', error);
      return NextResponse.json({ error: 'Failed to create timesheet' }, { status: 500 });
    }

    // Add to history
    await supabaseAdmin
      .from('timesheet_history')
      .insert({
        timesheet_id: timesheet.id,
        action: 'submitted',
        performed_by: session.user.id,
        new_status: 'pending'
      });

    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Timesheets POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';