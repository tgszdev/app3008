// Test script to verify categories API with authentication
import { supabaseAdmin } from './src/lib/supabase.js';

async function testCategories() {
  try {
    console.log('Testing categories table directly...');
    
    // Query categories directly from database
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    console.log(`Found ${categories?.length || 0} categories:`);
    
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        console.log(`- ${cat.name} (${cat.slug}) - Active: ${cat.is_active}`);
      });
    } else {
      console.log('No categories found in database');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  process.exit(0);
}

testCategories();