import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      // Non-admins can only see their own permissions
      const { data, error } = await supabaseAdmin
        .from('timesheet_permissions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching permissions:', error);
        return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
      }

      return NextResponse.json(data || {
        can_submit_timesheet: false,
        can_approve_timesheet: false
      });
    }

    // Admins can see all permissions
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const department = searchParams.get('department');
    const role = searchParams.get('role');

    let query = supabaseAdmin
      .from('timesheet_permissions')
      .select(`
        *,
        user:users!timesheet_permissions_user_id_fkey(id, name, email, department, role)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching permissions:', error);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Permissions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create/update permissions
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    const { user_id, department, role, can_submit_timesheet, can_approve_timesheet } = data;

    // Validate that at least one identifier is provided
    if (!user_id && !department && !role) {
      return NextResponse.json({ 
        error: 'Must provide user_id, department, or role' 
      }, { status: 400 });
    }

    // If user_id is provided, upsert for that specific user
    if (user_id) {
      const { data: permission, error } = await supabaseAdmin
        .from('timesheet_permissions')
        .upsert({
          user_id,
          can_submit_timesheet: can_submit_timesheet ?? false,
          can_approve_timesheet: can_approve_timesheet ?? false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating permission:', error);
        return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
      }

      return NextResponse.json(permission);
    }

    // If department or role is provided, update all matching users
    let usersQuery = supabaseAdmin.from('users').select('id');
    
    if (department) {
      usersQuery = usersQuery.eq('department', department);
    }
    if (role) {
      usersQuery = usersQuery.eq('role', role);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ 
        error: 'No users found matching criteria' 
      }, { status: 404 });
    }

    // Create permissions for all matching users
    const permissions = users.map(user => ({
      user_id: user.id,
      department,
      role,
      can_submit_timesheet: can_submit_timesheet ?? false,
      can_approve_timesheet: can_approve_timesheet ?? false,
      updated_at: new Date().toISOString()
    }));

    const { data: createdPermissions, error } = await supabaseAdmin
      .from('timesheet_permissions')
      .upsert(permissions, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('Error creating permissions:', error);
      return NextResponse.json({ error: 'Failed to create permissions' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Permissions updated for ${createdPermissions.length} users`,
      permissions: createdPermissions
    });
  } catch (error) {
    console.error('Permissions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete permissions
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('timesheet_permissions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting permission:', error);
      return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permissions DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}