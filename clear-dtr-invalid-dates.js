#!/usr/bin/env node

/**
 * Script to clear DTR records with invalid dates
 * This script will identify and remove DTR records that have malformed date strings
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

// Function to check if a date is invalid
function isInvalidDate(dateValue) {
  if (!dateValue) return false;
  
  // Check if it's a string with malformed date patterns
  if (typeof dateValue === 'string') {
    // Check for malformed date strings like "+045845-12-31T18:30:00.000Z"
    if (dateValue.includes('+') && dateValue.includes('-') && dateValue.includes('T')) {
      return true;
    }
    
    // Check for other malformed patterns
    if (dateValue.includes('Invalid Date') || dateValue.includes('NaN')) {
      return true;
    }
  }
  
  // Check if it's a Date object that's invalid
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime());
  }
  
  return false;
}

// Main function to clear invalid DTR records
async function clearInvalidDTRs() {
  try {
    console.log('🔍 Starting DTR cleanup process...');
    
    // Import DTR model
    const DTR = require('./backend/server/models/DTR');
    
    // Find all DTRs
    const allDTRs = await DTR.find({});
    console.log(`📊 Total DTRs found: ${allDTRs.length}`);
    
    let invalidCount = 0;
    const invalidDTRs = [];
    
    // Check each DTR for invalid dates
    for (const dtr of allDTRs) {
      let hasInvalidDate = false;
      const invalidFields = [];
      
      // Check errorDate field
      if (isInvalidDate(dtr.errorDate)) {
        hasInvalidDate = true;
        invalidFields.push('errorDate');
      }
      
      // Check complaintDate field
      if (isInvalidDate(dtr.complaintDate)) {
        hasInvalidDate = true;
        invalidFields.push('complaintDate');
      }
      
      // Check other date fields
      if (dtr.assignedDate && isInvalidDate(dtr.assignedDate)) {
        hasInvalidDate = true;
        invalidFields.push('assignedDate');
      }
      
      if (dtr.finalizedDate && isInvalidDate(dtr.finalizedDate)) {
        hasInvalidDate = true;
        invalidFields.push('finalizedDate');
      }
      
      if (dtr.closedBy && dtr.closedBy.closedDate && isInvalidDate(dtr.closedBy.closedDate)) {
        hasInvalidDate = true;
        invalidFields.push('closedBy.closedDate');
      }
      
      if (hasInvalidDate) {
        invalidCount++;
        invalidDTRs.push({
          _id: dtr._id,
          caseId: dtr.caseId,
          serialNumber: dtr.serialNumber,
          siteName: dtr.siteName,
          invalidFields: invalidFields,
          errorDate: dtr.errorDate,
          complaintDate: dtr.complaintDate
        });
      }
    }
    
    console.log(`❌ Found ${invalidCount} DTRs with invalid dates`);
    
    if (invalidCount > 0) {
      console.log('\n📋 Invalid DTRs details:');
      invalidDTRs.forEach((dtr, index) => {
        console.log(`${index + 1}. Case ID: ${dtr.caseId}`);
        console.log(`   Serial: ${dtr.serialNumber}`);
        console.log(`   Site: ${dtr.siteName}`);
        console.log(`   Invalid fields: ${dtr.invalidFields.join(', ')}`);
        console.log(`   Error Date: ${dtr.errorDate}`);
        console.log(`   Complaint Date: ${dtr.complaintDate}`);
        console.log('---');
      });
      
      // Ask for confirmation before deletion
      console.log('\n⚠️  WARNING: This will permanently delete the above DTRs with invalid dates.');
      console.log('💡 Recommendation: Export your data first, then re-import with corrected date formats.');
      
      // For automated execution, we'll proceed with deletion
      // In production, you might want to add a confirmation prompt
      console.log('\n🗑️  Proceeding with deletion of invalid DTRs...');
      
      const deleteResult = await DTR.deleteMany({
        _id: { $in: invalidDTRs.map(dtr => dtr._id) }
      });
      
      console.log(`✅ Successfully deleted ${deleteResult.deletedCount} DTRs with invalid dates`);
      
      // Show remaining count
      const remainingCount = await DTR.countDocuments();
      console.log(`📊 Remaining DTRs: ${remainingCount}`);
      
    } else {
      console.log('✅ No DTRs with invalid dates found. All dates are valid.');
    }
    
  } catch (error) {
    console.error('❌ Error during DTR cleanup:', error);
    throw error;
  }
}

// Function to show re-upload instructions
function showReuploadInstructions() {
  console.log('\n📋 DTR RE-UPLOAD INSTRUCTIONS:');
  console.log('================================');
  console.log('');
  console.log('1. 📁 Prepare your DTR data file:');
  console.log('   - Ensure all date columns are in proper format (DD/MM/YYYY or MM/DD/YYYY)');
  console.log('   - Check that Error Date column has valid dates');
  console.log('   - Remove any rows with malformed date strings');
  console.log('');
  console.log('2. 🔧 Fix date formats in your Excel/CSV:');
  console.log('   - Error Date: Use format like 13/10/2025 or 10/13/2025');
  console.log('   - Date: Use format like 13/10/2025 or 10/13/2025');
  console.log('   - Avoid Excel serial numbers or malformed date strings');
  console.log('');
  console.log('3. 📤 Re-upload your DTR data:');
  console.log('   - Go to the DTR Bulk Import page');
  console.log('   - Upload your corrected CSV/Excel file');
  console.log('   - The system will now handle date parsing correctly');
  console.log('');
  console.log('4. ✅ Verify the import:');
  console.log('   - Check that all dates display correctly');
  console.log('   - Ensure no "Invalid Date" errors appear');
  console.log('');
  console.log('💡 TIP: If you have a large dataset, consider importing in smaller batches');
  console.log('   to avoid overwhelming the system.');
}

// Main execution
async function main() {
  try {
    await connectDB();
    await clearInvalidDTRs();
    showReuploadInstructions();
    
    console.log('\n🎉 DTR cleanup completed successfully!');
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

module.exports = { clearInvalidDTRs, isInvalidDate };
