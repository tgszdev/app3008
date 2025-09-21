#!/usr/bin/env node

import axios from 'axios';

async function testRoles() {
  const baseURL = 'http://localhost:3000';
  
  console.log('Testing /api/roles endpoint...\n');
  
  try {
    // Test fetching roles
    const response = await axios.get(`${baseURL}/api/roles`);
    
    console.log('✅ Successfully fetched roles from API');
    console.log(`📊 Total roles found: ${response.data.length}`);
    console.log('\n📋 Available roles:');
    console.log('─'.repeat(50));
    
    response.data.forEach((role, index) => {
      console.log(`${index + 1}. ${role.display_name} (${role.name})`);
      console.log(`   ID: ${role.id}`);
      console.log(`   System Role: ${role.is_system ? 'Yes' : 'No'}`);
      if (!role.is_system) {
        console.log(`   ⭐ Custom Role`);
      }
      console.log('');
    });
    
    // Check for custom roles
    const customRoles = response.data.filter(role => !role.is_system);
    if (customRoles.length > 0) {
      console.log('─'.repeat(50));
      console.log(`\n✨ Found ${customRoles.length} custom role(s):`);
      customRoles.forEach(role => {
        console.log(`  - ${role.display_name} (${role.name})`);
      });
    } else {
      console.log('─'.repeat(50));
      console.log('\n⚠️  No custom roles found. Only system roles are available.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching roles:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testRoles();