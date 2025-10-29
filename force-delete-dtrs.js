const { MongoClient } = require('mongodb');
require('dotenv').config();

async function forceDeleteDTRs() {
  let client;
  
  try {
    console.log('🔍 Force checking and deleting all DTR data...');
    
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    client = new MongoClient(uri);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Check all possible DTR collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Look for DTR-related collections
    const dtrCollections = collections.filter(c => 
      c.name.toLowerCase().includes('dtr') || 
      c.name.toLowerCase().includes('trouble') ||
      c.name.toLowerCase().includes('report')
    );
    
    console.log('🎯 DTR-related collections found:', dtrCollections.map(c => c.name));
    
    let totalDeleted = 0;
    
    for (const collectionInfo of dtrCollections) {
      const collection = db.collection(collectionInfo.name);
      const count = await collection.countDocuments();
      console.log(`📊 Collection ${collectionInfo.name}: ${count} documents`);
      
      if (count > 0) {
        const deleteResult = await collection.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} documents from ${collectionInfo.name}`);
        totalDeleted += deleteResult.deletedCount;
      }
    }
    
    // Also check the main 'dtrs' collection
    const dtrsCollection = db.collection('dtrs');
    const dtrsCount = await dtrsCollection.countDocuments();
    console.log(`📊 Main 'dtrs' collection: ${dtrsCount} documents`);
    
    if (dtrsCount > 0) {
      const deleteResult = await dtrsCollection.deleteMany({});
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} documents from 'dtrs' collection`);
      totalDeleted += deleteResult.deletedCount;
    }
    
    console.log(`\n🎉 Total documents deleted: ${totalDeleted}`);
    
    // Final verification
    const finalDtrsCount = await dtrsCollection.countDocuments();
    console.log(`📊 Final DTR count: ${finalDtrsCount}`);
    
    if (finalDtrsCount === 0) {
      console.log('✅ All DTR data has been successfully deleted!');
    } else {
      console.log('⚠️  Some DTR data may still exist.');
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

forceDeleteDTRs();






