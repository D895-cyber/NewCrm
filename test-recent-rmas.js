#!/usr/bin/env node

/**
 * Test script to verify the Recent RMAs endpoint
 * This will help debug why only 5 entries are showing
 */

const axios = require('axios');

async function testRecentRMAs() {
  try {
    console.log('🧪 Testing Recent RMAs Endpoint...\n');

    // Test the public activity feed endpoint
    const response = await axios.get('http://localhost:5000/api/dashboard/public-activity-feed?useTracking=false&limit=20');
    
    console.log('✅ API Response received');
    console.log(`📊 Total activities returned: ${response.data.activities.length}`);
    console.log(`🕒 Timestamp: ${response.data.timestamp}`);
    console.log(`🔍 Tracking API used: ${response.data.trackingAPIUsed}\n`);

    // Analyze the activities
    console.log('📋 Activities Analysis:\n');
    
    const statusCounts = {};
    const dateCounts = {};
    
    response.data.activities.forEach((activity, index) => {
      console.log(`--- Activity ${index + 1} ---`);
      console.log(`   RMA Number: ${activity.rmaNumber}`);
      console.log(`   Site: ${activity.siteName}`);
      console.log(`   Status: ${activity.status}`);
      console.log(`   Last Updated: ${activity.deliveredDate || activity.timestamp}`);
      console.log(`   Courier: ${activity.courierName || 'N/A'}`);
      console.log(`   Tracking: ${activity.trackingNumber || 'N/A'}`);
      console.log('');
      
      // Count statuses
      statusCounts[activity.status] = (statusCounts[activity.status] || 0) + 1;
      
      // Count dates
      const date = new Date(activity.deliveredDate || activity.timestamp).toISOString().split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Summary
    console.log('📈 Summary:\n');
    console.log('   Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
    
    console.log('\n   Date Distribution:');
    Object.entries(dateCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([date, count]) => {
        console.log(`      ${date}: ${count}`);
      });

    // Check if we're getting the expected statuses
    const expectedStatuses = ['Completed', 'Sent to CDS', 'Replacement Shipped', 'Faulty Transit to CDS', 'Replacement Received', 'Installation Complete'];
    const foundStatuses = Object.keys(statusCounts);
    
    console.log('\n🎯 Status Check:');
    console.log(`   Expected statuses: ${expectedStatuses.join(', ')}`);
    console.log(`   Found statuses: ${foundStatuses.join(', ')}`);
    
    const missingStatuses = expectedStatuses.filter(status => !foundStatuses.includes(status));
    if (missingStatuses.length > 0) {
      console.log(`   ⚠️  Missing statuses: ${missingStatuses.join(', ')}`);
    } else {
      console.log('   ✅ All expected statuses found');
    }

    // Check if we're getting more than 5 entries
    if (response.data.activities.length <= 5) {
      console.log('\n⚠️  Only 5 or fewer entries returned - this might be the issue');
      console.log('   Possible causes:');
      console.log('   1. Database only has 5 RMAs with these statuses');
      console.log('   2. Limit is being applied somewhere else');
      console.log('   3. Query is not finding the expected RMAs');
    } else {
      console.log(`\n✅ Good! ${response.data.activities.length} entries returned`);
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Run the test
if (require.main === module) {
  testRecentRMAs();
}

module.exports = { testRecentRMAs };
