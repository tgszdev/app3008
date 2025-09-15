async function testRatingAPI() {
  try {
    // Test fetching satisfaction data
    const response = await fetch('http://localhost:3000/api/dashboard/satisfaction?period=year');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ API is working!');
      console.log('Total Ratings:', data.totalRatings);
      console.log('Average Rating:', data.averageRating);
    } else {
      console.log('\n❌ API returned error');
    }
  } catch (error) {
    console.error('❌ Error calling API:', error);
  }
}

testRatingAPI();
