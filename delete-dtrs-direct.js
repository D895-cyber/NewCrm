const { MongoClient } = require('mongodb');
require('dotenv').config();

async function deleteDTRsDirect() {
  let client;
  
  try {
    console.log('🚀 Starting DTR deletion process...');
    
    // Connect directly to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const dtrCollection = db.collection('dtrs');
    
    // Count existing DTRs
    const totalDTRs = await dtrCollection.countDocuments();
    console.log(`📊 Total DTRs found: ${totalDTRs}`);
    
    if (totalDTRs === 0) {
      console.log('✅ No DTRs found. Database is already clean.');
      return;
    }
    
    console.log('🗑️  Deleting all DTRs...');
    
    // Delete all DTRs
    const result = await dtrCollection.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} DTR records`);
    
    // Verify deletion
    const remainingCount = await dtrCollection.countDocuments();
    console.log(`📊 Remaining DTRs: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 All DTR records have been successfully deleted!');
    } else {
      console.log('⚠️  Some DTR records may still exist.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

deleteDTRsDirect().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

















