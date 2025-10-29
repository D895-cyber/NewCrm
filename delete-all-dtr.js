#!/usr/bin/env node

/**
 * Script to delete ALL DTR records from the database
 * WARNING: This will permanently delete all DTR data
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
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

// Main function to delete all DTRs
async function deleteAllDTRs() {
  try {
    console.log('🗑️  Starting DTR deletion process...');
    
    // Import DTR model
    const DTR = require('./backend/server/models/DTR');
    
    // Count existing DTRs
    const totalDTRs = await DTR.countDocuments();
    console.log(`📊 Total DTRs found: ${totalDTRs}`);
    
    if (totalDTRs === 0) {
      console.log('✅ No DTRs found. Database is already clean.');
      return;
    }
    
    // Show warning
    console.log('\n⚠️  WARNING: This will permanently delete ALL DTR records!');
    console.log(`📊 About to delete ${totalDTRs} DTR records`);
    console.log('💡 Make sure you have a backup if needed');
    
    // Proceed with deletion
    console.log('\n🗑️  Proceeding with deletion of all DTRs...');
    
    const deleteResult = await DTR.deleteMany({});
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} DTR records`);
    
    // Verify deletion
    const remainingCount = await DTR.countDocuments();
    console.log(`📊 Remaining DTRs: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 All DTR records have been successfully deleted!');
    } else {
      console.log('⚠️  Some DTR records may still exist. Check the database manually.');
    }
    
  } catch (error) {
    console.error('❌ Error during DTR deletion:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    await deleteAllDTRs();
    
    console.log('\n🎉 DTR deletion completed successfully!');
    console.log('You can now re-upload your DTR data with corrected date formats.');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { deleteAllDTRs };
