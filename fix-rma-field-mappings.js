const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const RMA = require('./backend/server/models/RMA');

// Script to fix RMA field mapping issues
async function fixRMAFieldMappings() {
  console.log('🔧 Starting RMA Field Mapping Fix...\n');
  
  try {
    // Get all RMAs
    const rmas = await RMA.find({});
    console.log(`📊 Found ${rmas.length} RMAs to process\n`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const rma of rmas) {
      console.log(`🔍 Processing RMA: ${rma.rmaNumber || 'N/A'}`);
      
      let needsUpdate = false;
      const updates = {};
      
      // Fix 1: Defective Serial Number should not be the same as Defective Part Number
      if (rma.defectiveSerialNumber && rma.defectivePartNumber && 
          rma.defectiveSerialNumber === rma.defectivePartNumber) {
        console.log(`  ❌ Defective Serial Number is same as Part Number: ${rma.defectiveSerialNumber}`);
        // Clear the defective serial number if it's actually a part number
        updates.defectiveSerialNumber = '';
        needsUpdate = true;
      }
      
      // Fix 2: Replaced Part Number should not be a part name
      if (rma.replacedPartNumber && 
          (rma.replacedPartNumber.toLowerCase().includes('assy') ||
           rma.replacedPartNumber.toLowerCase().includes('assembly') ||
           rma.replacedPartNumber.toLowerCase().includes('kit') ||
           rma.replacedPartNumber.toLowerCase().includes('harn'))) {
        console.log(`  ❌ Replaced Part Number contains part name: ${rma.replacedPartNumber}`);
        // Move the part name to replacedPartName and clear the number
        if (!rma.replacedPartName || rma.replacedPartName === 'N/A') {
          updates.replacedPartName = rma.replacedPartNumber;
        }
        updates.replacedPartNumber = '';
        needsUpdate = true;
      }
      
      // Fix 3: Site Name and Product Name should be derived from Serial Number if missing
      if (rma.serialNumber && rma.serialNumber !== 'N/A' && rma.serialNumber.trim() !== '') {
        if (!rma.siteName || rma.siteName === 'N/A' || rma.siteName.trim() === '') {
          updates.siteName = `Site from Serial: ${rma.serialNumber}`;
          needsUpdate = true;
        }
        
        if (!rma.productName || rma.productName === 'N/A' || rma.productName.trim() === '') {
          updates.productName = `Model from Serial: ${rma.serialNumber}`;
          needsUpdate = true;
        }
      }
      
      // Fix 4: Call Log Number should not be "RMA" - it should be a number
      if (rma.callLogNumber === 'RMA' || rma.callLogNumber === 'N/A') {
        console.log(`  ❌ Call Log Number is not a number: ${rma.callLogNumber}`);
        updates.callLogNumber = '';
        needsUpdate = true;
      }
      
      // Fix 5: Created By should be "Pankaj" if not set
      if (!rma.createdBy || rma.createdBy === 'N/A' || rma.createdBy.trim() === '') {
        updates.createdBy = 'Pankaj';
        needsUpdate = true;
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await RMA.findByIdAndUpdate(rma._id, updates);
        console.log(`  ✅ Fixed RMA: ${rma.rmaNumber || 'N/A'}`);
        console.log(`     Updates:`, updates);
        fixedCount++;
      } else {
        console.log(`  ⏭️  No fixes needed for RMA: ${rma.rmaNumber || 'N/A'}`);
        skippedCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 RMA Field Mapping Fix Complete!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} RMAs`);
    console.log(`   ⏭️  Skipped: ${skippedCount} RMAs`);
    console.log(`   📈 Total processed: ${rmas.length} RMAs`);
    
  } catch (error) {
    console.error('❌ Error fixing RMA field mappings:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixRMAFieldMappings();


