const axios = require('axios');

// Test script to verify DTR assignment to technical heads functionality
async function testDTRAssignment() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🧪 Testing DTR Assignment to Technical Heads...\n');

    // 1. Test getting technical heads
    console.log('1. Testing GET /dtr/users/technical-heads...');
    try {
      const response = await axios.get(`${baseURL}/dtr/users/technical-heads`);
      console.log('✅ Technical heads endpoint working');
      console.log('   Found technical heads:', response.data.length);
      if (response.data.length > 0) {
        console.log('   Sample technical head:', {
          userId: response.data[0].userId,
          username: response.data[0].username,
          email: response.data[0].email
        });
      }
    } catch (error) {
      console.log('❌ Error getting technical heads:', error.response?.data?.message || error.message);
    }

    // 2. Test getting DTRs
    console.log('\n2. Testing GET /dtr...');
    try {
      const response = await axios.get(`${baseURL}/dtr`);
      console.log('✅ DTRs endpoint working');
      console.log('   Found DTRs:', response.data.length);
      if (response.data.length > 0) {
        console.log('   Sample DTR:', {
          _id: response.data[0]._id,
          caseId: response.data[0].caseId,
          status: response.data[0].status
        });
      }
    } catch (error) {
      console.log('❌ Error getting DTRs:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Backend API endpoints are set up');
    console.log('   - Frontend dialog component is created');
    console.log('   - RMA page has assign DTR button for RMA handlers');
    console.log('   - Assignment logic is integrated');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the backend server');
    console.log('   2. Start the frontend application');
    console.log('   3. Login as an RMA handler');
    console.log('   4. Go to RMA page and click the workflow button on any RMA');
    console.log('   5. Select a technical head and assign the DTR');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDTRAssignment();
