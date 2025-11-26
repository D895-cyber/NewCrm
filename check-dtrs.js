const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDTRs() {
  let client;
  
  try {
    console.log('🔍 Checking DTR data in database...');
    
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    client = new MongoClient(uri);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const dtrCollection = db.collection('dtrs');
    
    // Count DTRs
    const totalDTRs = await dtrCollection.countDocuments();
    console.log(`📊 Total DTRs found: ${totalDTRs}`);
    
    if (totalDTRs > 0) {
      // Get sample DTRs
      const sampleDTRs = await dtrCollection.find({}).limit(5).toArray();
      console.log('\n📋 Sample DTRs:');
      sampleDTRs.forEach((dtr, index) => {
        console.log(`${index + 1}. ${dtr.caseId || 'No Case ID'} - ${dtr.serialNumber || 'No Serial'} - ${dtr.status || 'No Status'}`);
      });
      
      // Delete all DTRs
      console.log('\n🗑️  Deleting all DTRs...');
      const deleteResult = await dtrCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} DTR records`);
      
      // Verify deletion
      const remainingCount = await dtrCollection.countDocuments();
      console.log(`📊 Remaining DTRs: ${remainingCount}`);
    } else {
      console.log('✅ No DTRs found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

checkDTRs();

















