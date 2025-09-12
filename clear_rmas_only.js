const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import RMA model only
const RMA = require('./server/models/RMA');

async function clearRMAsOnly() {
  try {
    console.log('Starting to clear RMA data...\n');

    // Count existing RMAs
    const existingCount = await RMA.countDocuments();
    console.log(`📊 Found ${existingCount} existing RMA records`);

    if (existingCount === 0) {
      console.log('✨ No RMA records to clear.');
      return;
    }

    // Clear all RMAs
    const result = await RMA.deleteMany({});
    console.log(`✅ Successfully cleared ${result.deletedCount} RMA records`);

    // Verify clearing
    const remainingCount = await RMA.countDocuments();
    console.log(`📊 Remaining RMA records: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log('🎯 All RMA records have been cleared successfully!');
    } else {
      console.log('⚠️  Some RMA records remain - this may indicate an issue.');
    }

  } catch (error) {
    console.error('❌ Error clearing RMA data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the function
clearRMAsOnly();
