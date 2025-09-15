import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SERVICE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing database with:');
console.log('URL:', supabaseUrl);
console.log('Using Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRatings() {
  console.log('\n📊 Checking ticket_ratings table...');
  
  // 1. Check if we can read from ticket_ratings
  const { data: allRatings, error: allError } = await supabase
    .from('ticket_ratings')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (allError) {
    console.error('❌ Error reading ticket_ratings:', allError);
  } else {
    console.log(`✅ Found ${allRatings?.length || 0} total ratings`);
    if (allRatings && allRatings.length > 0) {
      console.log('\nMost recent rating:');
      console.log(JSON.stringify(allRatings[0], null, 2));
    }
  }
  
  // 2. Test the join query that the API uses
  console.log('\n🔗 Testing join with tickets table...');
  const { data: joinedRatings, error: joinError } = await supabase
    .from('ticket_ratings')
    .select(`
      id,
      rating,
      comment,
      created_at,
      ticket_id,
      user_id,
      ticket:tickets!inner(
        id,
        ticket_number,
        created_at
      )
    `)
    .order('created_at', { ascending: false });
  
  if (joinError) {
    console.error('❌ Error with join query:', joinError);
    console.error('Details:', joinError.details, joinError.hint, joinError.message);
    
    // Try simpler query without join
    console.log('\n🔄 Trying without join...');
    const { data: simpleRatings, error: simpleError } = await supabase
      .from('ticket_ratings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (simpleError) {
      console.error('❌ Even simple query failed:', simpleError);
    } else {
      console.log(`✅ Simple query worked: ${simpleRatings?.length || 0} ratings`);
      if (simpleRatings && simpleRatings.length > 0) {
        console.log('First rating:', simpleRatings[0]);
      }
    }
  } else {
    console.log(`✅ Join query successful: ${joinedRatings?.length || 0} ratings with ticket info`);
    if (joinedRatings && joinedRatings.length > 0) {
      console.log('\nFirst rating with ticket info:');
      console.log(JSON.stringify(joinedRatings[0], null, 2));
    }
  }
  
  // 3. Check tickets table
  console.log('\n🎫 Checking tickets table...');
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_number, status')
    .eq('status', 'resolved')
    .limit(5);
  
  if (ticketsError) {
    console.error('❌ Error reading tickets:', ticketsError);
  } else {
    console.log(`✅ Found ${tickets?.length || 0} resolved tickets`);
    if (tickets && tickets.length > 0) {
      console.log('Resolved tickets:', tickets.map(t => `#${t.ticket_number} (ID: ${t.id})`).join(', '));
    }
  }
  
  // 4. Check for ratings on resolved tickets
  if (tickets && tickets.length > 0) {
    console.log('\n🔍 Checking which resolved tickets have ratings...');
    for (const ticket of tickets) {
      const { data: rating, error } = await supabase
        .from('ticket_ratings')
        .select('*')
        .eq('ticket_id', ticket.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if no rating
      
      if (rating) {
        console.log(`✅ Ticket #${ticket.ticket_number} has rating: ${rating.rating} stars`);
      } else {
        console.log(`⚠️ Ticket #${ticket.ticket_number} has no rating`);
      }
    }
  }
  
  // 5. Test creating a rating for the most recent resolved ticket
  if (tickets && tickets.length > 0) {
    const ticketToRate = tickets[0];
    console.log(`\n🧪 Let's check if we can query ratings for ticket #${ticketToRate.ticket_number}...`);
    
    const { data: existingRating, error: checkError } = await supabase
      .from('ticket_ratings')
      .select('*')
      .eq('ticket_id', ticketToRate.id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error checking for existing rating:', checkError);
    } else if (existingRating) {
      console.log('✅ This ticket already has a rating:', existingRating);
    } else {
      console.log('⚠️ No rating exists for this ticket yet');
    }
  }
}

testRatings().catch(console.error);