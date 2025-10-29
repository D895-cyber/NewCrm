const mongoose = require('mongoose');
require('dotenv').config();

async function deleteDTRsRobust() {
  try {
    console.log('🚀 Starting DTR deletion process...');
    
    // Connect with longer timeout
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Import DTR model
    const DTR = require('./backend/server/models/DTR');
    
    // Count existing DTRs
    const totalDTRs = await DTR.countDocuments();
    console.log(`📊 Total DTRs found: ${totalDTRs}`);
    
    if (totalDTRs === 0) {
      console.log('✅ No DTRs found. Database is already clean.');
      return;
    }
    
    console.log('🗑️  Deleting DTRs in batches...');
    
    // Delete in batches to avoid timeout
    const batchSize = 100;
    let deletedCount = 0;
    let hasMore = true;
    
    while (hasMore) {
      const batch = await DTR.find({}).limit(batchSize);
      
      if (batch.length === 0) {
        hasMore = false;
        break;
      }
      
      const batchIds = batch.map(doc => doc._id);
      const result = await DTR.deleteMany({ _id: { $in: batchIds } });
      
      deletedCount += result.deletedCount;
      console.log(`✅ Deleted batch: ${result.deletedCount} records (Total: ${deletedCount})`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Successfully deleted ${deletedCount} DTR records`);
    
    // Verify deletion
    const remainingCount = await DTR.countDocuments();
    console.log(`📊 Remaining DTRs: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✅ All DTR records have been successfully deleted!');
    } else {
      console.log('⚠️  Some DTR records may still exist.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

deleteDTRsRobust().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
