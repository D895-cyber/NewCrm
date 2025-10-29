const mongoose = require('mongoose');
require('dotenv').config();

async function deleteDTRs() {
  try {
    // Connect with shorter timeout
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Import DTR model
    const DTR = require('./backend/server/models/DTR');
    
    // Delete all DTRs
    const result = await DTR.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} DTR records`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteDTRs();
