const axios = require('axios');

// Test script to debug DTR assignment to technical head
async function testDTRAssignment() {
  console.log('🔍 Testing DTR Assignment to Technical Head...\n');
  
  const baseURL = 'http://localhost:4000/api';
  
  try {
    // Test 1: Check if backend is running
    console.log('1. Testing backend connection...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend is running');
    
    // Test 2: Get technical heads
    console.log('\n2. Testing technical heads endpoint...');
    try {
      const techHeadsResponse = await axios.get(`${baseURL}/dtr/users/technical-heads`);
      console.log('✅ Technical heads endpoint working');
      console.log(`📊 Found ${techHeadsResponse.data.length} technical heads:`);
      techHeadsResponse.data.forEach((head, index) => {
        console.log(`   ${index + 1}. ${head.username} (${head.email}) - Role: ${head.role}`);
      });
    } catch (error) {
      console.log('❌ Technical heads endpoint failed:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Get a sample DTR
    console.log('\n3. Testing DTR fetch...');
    try {
      const dtrsResponse = await axios.get(`${baseURL}/dtr`);
      if (dtrsResponse.data.length > 0) {
        const sampleDTR = dtrsResponse.data[0];
        console.log('✅ Found sample DTR:', sampleDTR.caseId);
        console.log(`   DTR ID: ${sampleDTR._id}`);
        console.log(`   Current Status: ${sampleDTR.status}`);
        console.log(`   Assigned To: ${sampleDTR.assignedTo || 'Not assigned'}`);
        
        // Test 4: Try to assign the DTR
        console.log('\n4. Testing DTR assignment...');
        if (techHeadsResponse.data.length > 0) {
          const technicalHead = techHeadsResponse.data[0];
          console.log(`   Attempting to assign to: ${technicalHead.username}`);
          
          try {
            const assignResponse = await axios.post(`${baseURL}/dtr/${sampleDTR._id}/assign-technical-head`, {
              technicalHeadId: technicalHead.userId,
              technicalHeadName: technicalHead.profile?.firstName && technicalHead.profile?.lastName
                ? `${technicalHead.profile.firstName} ${technicalHead.profile.lastName}`
                : technicalHead.username,
              technicalHeadEmail: technicalHead.email,
              assignedBy: 'rma_handler'
            });
            
            console.log('✅ Assignment successful!');
            console.log('   Response:', assignResponse.data);
          } catch (assignError) {
            console.log('❌ Assignment failed:', assignError.response?.data?.message || assignError.message);
            console.log('   Status:', assignError.response?.status);
            console.log('   Data:', assignError.response?.data);
          }
        }
      } else {
        console.log('❌ No DTRs found to test with');
      }
    } catch (error) {
      console.log('❌ DTR fetch failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('   Make sure the backend server is running on port 4000');
  }
}

// Run the test
testDTRAssignment()
  .then(() => {
    console.log('\n🎯 Test completed');
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
  });