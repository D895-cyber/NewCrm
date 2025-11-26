const { MongoClient } = require('mongodb');

// Direct MongoDB connection script to delete all RMA data
async function deleteAllRMADataDirect() {
  console.log('🗑️  Starting Direct RMA Data Deletion...\n');
  
  let client;
  
  try {
    // Connect directly to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    console.log(`🔗 Connecting to MongoDB: ${mongoUri}`);
    
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db();
    const rmaCollection = db.collection('rmas');
    
    // Get count of existing RMAs
    const countBefore = await rmaCollection.countDocuments();
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
    const result = await rmaCollection.deleteMany({});
    
    console.log('🎉 RMA Data Deletion Complete!');
    console.log(`📊 Summary:`);
    console.log(`   🗑️  Deleted: ${result.deletedCount} RMA records`);
    console.log(`   ✅ Database is now clean and ready for re-import`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Use the corrected CSV template: rma-import-template-corrected.csv');
    console.log('   2. Import your RMA data with proper field mappings');
    console.log('   3. Verify all 25 fields are correctly populated');
    console.log('');
    console.log('📁 Files available for re-import:');
    console.log('   - rma-import-template-corrected.csv (sample template)');
    console.log('   - RMA_FIELD_MAPPING_CORRECTED_GUIDE.md (implementation guide)');
    console.log('   - RMA_IMPORT_CORRECTED_SUMMARY.md (complete summary)');
    
  } catch (error) {
    console.error('❌ Error deleting RMA data:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure MongoDB is running');
    console.log('   2. Check your MONGODB_URI in .env file');
    console.log('   3. Verify database connection permissions');
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the deletion
deleteAllRMADataDirect();



