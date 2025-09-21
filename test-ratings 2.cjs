const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.l5djg97fWgAwQm7kcK_A-gTcPh6ilY-k3HuPnNS5xEg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRatings() {
  console.log('Checking ticket_ratings table...')
  
  try {
    // Check if table exists and get data
    const { data, error } = await supabase
      .from('ticket_ratings')
      .select('*')
      .limit(10)
    
    if (error) {
      console.error('Error:', error)
      if (error.code === '42P01') {
        console.log('Table ticket_ratings does not exist!')
        console.log('Please run the migration SQL in Supabase')
      }
    } else {
      console.log('Table exists!')
      console.log('Number of ratings found:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('Sample data:', JSON.stringify(data[0], null, 2))
      } else {
        console.log('No ratings in the database yet.')
        console.log('To create real data:')
        console.log('1. Create a ticket')
        console.log('2. Mark it as resolved')
        console.log('3. Rate the ticket')
      }
    }
    
    // Also check tickets table
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, status')
      .eq('status', 'resolved')
      .limit(5)
    
    if (!ticketsError && tickets && tickets.length > 0) {
      console.log('\nResolved tickets that can be rated:')
      tickets.forEach(t => {
        console.log(`- Ticket #${t.ticket_number} (ID: ${t.id})`)
      })
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkRatings()