const mongoose = require('mongoose');
require('dotenv').config();

// Import the DTR model
const DTR = require('./server/models/DTR');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Delete all DTRs
async function deleteAllDTRs() {
  try {
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
    
  } catch (error) {
    console.error('❌ Error deleting DTRs:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting DTR deletion process...');
  
  await connectToDatabase();
  await deleteAllDTRs();
  
  console.log('✅ DTR deletion completed');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
