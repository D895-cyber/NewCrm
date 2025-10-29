const { MongoClient } = require('mongodb');
require('dotenv').config();

async function deleteAtlasDTRs() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB Atlas to delete DTRs...');
    
    // Atlas connection string from the server code
    const atlasURI = 'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0';
    
    client = new MongoClient(atlasURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('projector_warranty');
    const dtrCollection = db.collection('dtrs');
    
    // Count existing DTRs
    const totalDTRs = await dtrCollection.countDocuments();
    console.log(`📊 Total DTRs found in Atlas: ${totalDTRs}`);
    
    if (totalDTRs === 0) {
      console.log('✅ No DTRs found in Atlas database.');
      return;
    }
    
    // Show sample DTRs before deletion
    const sampleDTRs = await dtrCollection.find({}).limit(5).toArray();
    console.log('\n📋 Sample DTRs in Atlas:');
    sampleDTRs.forEach((dtr, index) => {
      console.log(`${index + 1}. ${dtr.caseId || 'No Case ID'} - ${dtr.serialNumber || 'No Serial'} - ${dtr.status || 'No Status'}`);
    });
    
    console.log('\n🗑️  Deleting all DTRs from Atlas database...');
    
    // Delete all DTRs
    const deleteResult = await dtrCollection.deleteMany({});
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} DTR records from Atlas`);
    
    // Verify deletion
    const remainingCount = await dtrCollection.countDocuments();
    console.log(`📊 Remaining DTRs in Atlas: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 All DTR records have been successfully deleted from Atlas!');
    } else {
      console.log('⚠️  Some DTR records may still exist in Atlas.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB Atlas');
    }
  }
}

deleteAtlasDTRs().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});






