// IMPORTANT: Use the same Mongoose instance as the backend models to avoid dual-instance buffering issues
const mongoose = require('./backend/server/node_modules/mongoose');
require('dotenv').config({ path: __dirname + '/backend/server/.env' });
require('dotenv').config({ path: __dirname + '/backend/.env' });
require('dotenv').config();

// Connect to MongoDB with robust options
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0';

mongoose.set('bufferCommands', false);

mongoose.connect(mongoURI, {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
}).catch((err) => {
  console.error('❌ Initial MongoDB connect error:', err.message);
});

// Import RMA model only
const RMA = require('./backend/server/models/RMA');

async function clearRMAsOnly() {
  try {
    console.log('Starting to clear RMA data...\n');

    // Count existing RMAs
    // Wait for DB ready
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection...');
      await mongoose.connection.asPromise();
    }

    const existingCount = await RMA.countDocuments().catch((e) => {
      console.error('❌ Count failed:', e.message);
      throw e;
    });
    console.log(`📊 Found ${existingCount} existing RMA records`);

    if (existingCount === 0) {
      console.log('✨ No RMA records to clear.');
      return;
    }

    // Clear all RMAs
    const result = await RMA.deleteMany({}).catch((e) => {
      console.error('❌ Delete failed:', e.message);
      throw e;
    });
    console.log(`✅ Successfully cleared ${result.deletedCount} RMA records`);

    // Verify clearing
    const remainingCount = await RMA.countDocuments().catch((e) => {
      console.error('❌ Post-delete count failed:', e.message);
      throw e;
    });
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
