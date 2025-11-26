const axios = require('axios');

// Script to delete all RMA data via API
async function deleteAllRMAData() {
  console.log('🗑️  Starting RMA Data Deletion via API...\n');
  
  try {
    // Get the base URL from environment or use default
    const baseURL = process.env.API_BASE_URL || 'http://localhost:5000';
    const deleteURL = `${baseURL}/api/rma/delete-all`;
    
    console.log(`🌐 Calling API endpoint: ${deleteURL}`);
    console.log('⚠️  WARNING: This will permanently delete ALL RMA data!\n');
    
    // Make the API call to delete all RMAs
    const response = await axios.delete(deleteURL, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🎉 RMA Data Deletion Complete!');
    console.log(`📊 Summary:`);
    console.log(`   🗑️  Deleted: ${response.data.deletedCount} RMA records`);
    console.log(`   ✅ Database is now clean and ready for re-import`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Use the corrected CSV template: rma-import-template-corrected.csv');
    console.log('   2. Import your RMA data with proper field mappings');
    console.log('   3. Verify all 25 fields are correctly populated');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Network Error: Could not connect to server');
      console.error('💡 Make sure your backend server is running on port 5000');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the deletion
deleteAllRMAData();



