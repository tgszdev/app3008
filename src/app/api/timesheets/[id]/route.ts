import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { UpdateTimesheetData, ApproveTimesheetData } from '@/types/timesheet';

type Params = Promise<{ id: string }>;

export async function GET(
  request: Request,
  context: { params: Params }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from('timesheets')
      .select(`
        *,
        ticket:tickets!inner(id, title, status, priority, description),
        user:users!timesheets_user_id_fkey(id, name, email, department, avatar_url),
        approver:users!timesheets_approved_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Check if user has permission to view this timesheet
    const { data: permissions } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('can_approve_timesheet')
      .eq('user_id', session.user.id)
      .single();

    if (!permissions?.can_approve_timesheet && data.user_id !== session.user.id) {
      // Check if user is assigned to the ticket
      const { data: ticket } = await supabaseAdmin
        .from('tickets')
        .select('assignee_id')
        .eq('id', data.ticket_id)
        .single();

      if (ticket?.assignee_id !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Timesheet GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Params }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Check if this is an approval/rejection request
    if ('status' in body && (body.status === 'approved' || body.status === 'rejected')) {
      return handleApproval(id, body as ApproveTimesheetData, session.user.id);
    }

    // Otherwise, it's a regular update
    const updateData: UpdateTimesheetData = body;

    // Check if user owns the timesheet and it's still pending
    const { data: existingTimesheet } = await supabaseAdmin
      .from('timesheets')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (!existingTimesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    if (existingTimesheet.user_id !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own timesheets' }, { status: 403 });
    }

    if (existingTimesheet.status !== 'pending') {
      return NextResponse.json({ error: 'Can only edit pending timesheets' }, { status: 400 });
    }

    // Update timesheet
    const { data, error } = await supabaseAdmin
      .from('timesheets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating timesheet:', error);
      return NextResponse.json({ error: 'Failed to update timesheet' }, { status: 500 });
    }

    // Add to history
    await supabaseAdmin
      .from('timesheet_history')
      .insert({
        timesheet_id: id,
        action: 'edited',
        performed_by: session.user.id,
        previous_status: 'pending',
        new_status: 'pending'
      });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Timesheet PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleApproval(
  timesheetId: string,
  data: ApproveTimesheetData,
  userId: string
) {
  // Check if user has approval permission
  const { data: permissions } = await supabaseAdmin
    .from('timesheet_permissions')
    .select('can_approve_timesheet')
    .eq('user_id', userId)
    .single();

  if (!permissions?.can_approve_timesheet) {
    return NextResponse.json({ error: 'You do not have permission to approve timesheets' }, { status: 403 });
  }

  // Get current timesheet status
  const { data: currentTimesheet } = await supabaseAdmin
    .from('timesheets')
    .select('status')
    .eq('id', timesheetId)
    .single();

  if (!currentTimesheet) {
    return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
  }

  // Update timesheet
  const updateData: any = {
    status: data.status,
    approved_by: userId,
    approved_at: new Date().toISOString()
  };

  if (data.status === 'rejected' && data.rejection_reason) {
    updateData.rejection_reason = data.rejection_reason;
  }

  const { data: updatedTimesheet, error } = await supabaseAdmin
    .from('timesheets')
    .update(updateData)
    .eq('id', timesheetId)
    .select()
    .single();

  if (error) {
    console.error('Error approving timesheet:', error);
    return NextResponse.json({ error: 'Failed to update timesheet' }, { status: 500 });
  }

  // Add to history
  await supabaseAdmin
    .from('timesheet_history')
    .insert({
      timesheet_id: timesheetId,
      action: data.status,
      performed_by: userId,
      reason: data.rejection_reason,
      previous_status: currentTimesheet.status,
      new_status: data.status
    });

  return NextResponse.json(updatedTimesheet);
}

export async function DELETE(
  request: Request,
  context: { params: Params }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if user owns the timesheet and it's still pending
    const { data: timesheet } = await supabaseAdmin
      .from('timesheets')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    if (timesheet.user_id !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own timesheets' }, { status: 403 });
    }

    if (timesheet.status !== 'pending') {
      return NextResponse.json({ error: 'Can only delete pending timesheets' }, { status: 400 });
    }

    // Delete timesheet
    const { error } = await supabaseAdmin
      .from('timesheets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting timesheet:', error);
      return NextResponse.json({ error: 'Failed to delete timesheet' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timesheet DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';