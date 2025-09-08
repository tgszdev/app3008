import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Log para debug
    console.log('POST /api/timesheet-add - Starting');
    
    const session = await auth();
    if (!session?.user) {
      console.log('POST /api/timesheet-add - No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('POST /api/timesheet-add - Data received:', data);

    // Validate required fields
    if (!data.ticket_id || !data.activity_description || !data.hours_worked || !data.work_date) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: data 
      }, { status: 400 });
    }

    // Check permissions
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('can_submit_timesheet')
      .eq('user_id', session.user.id)
      .single();

    if (permError) {
      console.error('Permission check error:', permError);
      // Se não encontrar permissão, assume que pode submeter
    }

    if (permissions && !permissions.can_submit_timesheet) {
      return NextResponse.json({ 
        error: 'You do not have permission to submit timesheets' 
      }, { status: 403 });
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
      return NextResponse.json({ 
        error: 'Failed to create timesheet',
        details: error.message 
      }, { status: 500 });
    }

    // Add to history (opcional - não falhar se der erro)
    try {
      await supabaseAdmin
        .from('timesheet_history')
        .insert({
          timesheet_id: timesheet.id,
          action: 'submitted',
          performed_by: session.user.id,
          new_status: 'pending'
        });
    } catch (historyError) {
      console.log('History insert error (ignored):', historyError);
    }

    console.log('POST /api/timesheet-add - Success:', timesheet);
    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('POST /api/timesheet-add - Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Timesheet-add API is working',
    timestamp: new Date().toISOString()
  });
}

export const runtime = 'nodejs';