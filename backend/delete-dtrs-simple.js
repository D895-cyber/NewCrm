const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DTR = require('./server/models/DTR');

async function deleteAllDTRs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('✅ Connected to MongoDB');
    
    // Count existing DTRs
    const count = await DTR.countDocuments();
    console.log(`📊 Found ${count} DTRs to delete`);
    
    if (count === 0) {
      console.log('✅ No DTRs found to delete');
      return;
    }
    
    // Delete all DTRs
    const result = await DTR.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} DTRs`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the deletion
deleteAllDTRs();


