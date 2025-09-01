import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTicket() {
  console.log('🔍 Checking ticket #0000574435...\n')

  // 1. Find ticket by ticket_number
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_number', '0000574435')
    .single()

  if (ticketError) {
    console.error('Error fetching ticket:', ticketError)
    return
  }

  console.log('✅ Ticket found:')
  console.log('ID:', ticket.id)
  console.log('Title:', ticket.title)
  console.log('Created by (user ID):', ticket.created_by)
  console.log('Created at:', ticket.created_at)
  console.log('\n')

  // 2. Find user by ID
  if (ticket.created_by) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', ticket.created_by)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
    } else {
      console.log('✅ User found:')
      console.log('ID:', user.id)
      console.log('Name:', user.name)
      console.log('Email:', user.email)
      console.log('\n')
    }
  }

  // 3. Try the join query (as used in the API)
  console.log('🔍 Testing join query with foreign key...\n')
  
  const { data: ticketWithJoin, error: joinError } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      title,
      status,
      priority,
      created_at,
      created_by,
      created_by_user:users!tickets_created_by_fkey(
        id,
        name,
        email
      )
    `)
    .eq('ticket_number', '0000574435')
    .single()

  if (joinError) {
    console.error('❌ Join query failed:', joinError.message)
    console.log('\n')
    
    // Try alternative foreign key name
    console.log('🔍 Trying alternative foreign key name...\n')
    
    const { data: altJoin, error: altError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        created_by,
        users!created_by(
          id,
          name,
          email
        )
      `)
      .eq('ticket_number', '0000574435')
      .single()
      
    if (altError) {
      console.error('❌ Alternative join also failed:', altError.message)
    } else {
      console.log('✅ Alternative join worked!')
      console.log('User data:', altJoin.users)
    }
  } else {
    console.log('✅ Join query successful!')
    console.log('User data from join:', ticketWithJoin.created_by_user)
  }

  // 4. Check the actual foreign key constraints in the database
  console.log('\n🔍 Checking foreign key constraints...\n')
  
  const { data: constraints, error: constraintError } = await supabase
    .rpc('get_foreign_keys', { table_name: 'tickets' })
    .select('*')

  if (!constraintError && constraints) {
    console.log('Foreign keys found:', constraints)
  } else {
    // Try a simpler approach - just list all recent tickets
    console.log('Getting recent tickets to see the data structure...\n')
    
    const { data: recentTickets } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
      
    console.log('Recent tickets structure:', recentTickets?.map(t => ({
      ticket_number: t.ticket_number,
      created_by: t.created_by
    })))
  }
}

checkTicket().catch(console.error)