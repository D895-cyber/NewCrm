const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const RMA = require('./backend/server/models/RMA');

// Script to delete all RMA data
async function deleteAllRMAData() {
  console.log('🗑️  Starting RMA Data Deletion...\n');
  
  try {
    // Get count of existing RMAs
    const countBefore = await RMA.countDocuments();
    console.log(`📊 Found ${countBefore} RMA records to delete\n`);
    
    if (countBefore === 0) {
      console.log('✅ No RMA data found. Database is already clean.');
      return;
    }
    
    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete ALL RMA data!');
    console.log('📋 This includes:');
    console.log('   - All RMA records');
    console.log('   - All RMA comments');
    console.log('   - All RMA tracking history');
    console.log('   - All RMA attachments');
    console.log('');
    console.log('🔄 Proceeding with deletion...\n');
    
    // Delete all RMA records
    const result = await RMA.deleteMany({});
    
    console.log('🎉 RMA Data Deletion Complete!');
    console.log(`📊 Summary:`);
    console.log(`   🗑️  Deleted: ${result.deletedCount} RMA records`);
    console.log(`   ✅ Database is now clean and ready for re-import`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Use the corrected CSV template: rma-import-template-corrected.csv');
    console.log('   2. Import your RMA data with proper field mappings');
    console.log('   3. Verify all 25 fields are correctly populated');
    
  } catch (error) {
    console.error('❌ Error deleting RMA data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the deletion
deleteAllRMAData();



