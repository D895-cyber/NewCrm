const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/backend/server/.env' });
require('dotenv').config({ path: __dirname + '/backend/.env' });
require('dotenv').config();

// Connect to MongoDB
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

const RMA = require('./backend/server/models/RMA');

// Script to analyze RMA import errors
async function analyzeRMAImportErrors() {
  try {
    console.log('🔍 Analyzing RMA Import Errors...\n');
    
    // Wait for DB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection...');
      await mongoose.connection.asPromise();
    }

    // Get current RMA count
    const currentCount = await RMA.countDocuments();
    console.log(`📊 Current RMA records in database: ${currentCount}`);
    
    // Expected count was 156, but only 153 were uploaded
    const expectedCount = 156;
    const missingCount = expectedCount - currentCount;
    
    console.log(`📈 Expected records: ${expectedCount}`);
    console.log(`✅ Successfully uploaded: ${currentCount}`);
    console.log(`❌ Failed to upload: ${missingCount}`);
    
    if (missingCount > 0) {
      console.log('\n🔍 Analyzing potential causes...\n');
      
      // Check for common validation issues
      console.log('1. Checking for duplicate RMA numbers...');
      const duplicates = await RMA.aggregate([
        {
          $group: {
            _id: '$rmaNumber',
            count: { $sum: 1 },
            docs: { $push: '$_id' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);
      
      if (duplicates.length > 0) {
        console.log(`   ⚠️  Found ${duplicates.length} duplicate RMA numbers:`);
        duplicates.forEach(dup => {
          console.log(`      - ${dup._id}: ${dup.count} occurrences`);
        });
      } else {
        console.log('   ✅ No duplicate RMA numbers found');
      }
      
      console.log('\n2. Checking for missing required fields...');
      const missingFields = await RMA.find({
        $or: [
          { siteName: { $in: [null, '', 'N/A'] } },
          { productName: { $in: [null, '', 'N/A'] } },
          { ascompRaisedDate: { $exists: false } },
          { customerErrorDate: { $exists: false } }
        ]
      }).select('rmaNumber siteName productName ascompRaisedDate customerErrorDate');
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Found ${missingFields.length} records with missing required fields:`);
        missingFields.forEach(record => {
          console.log(`      - ${record.rmaNumber}: Missing fields:`, {
            siteName: !record.siteName || record.siteName === 'N/A',
            productName: !record.productName || record.productName === 'N/A',
            ascompRaisedDate: !record.ascompRaisedDate,
            customerErrorDate: !record.customerErrorDate
          });
        });
      } else {
        console.log('   ✅ All records have required fields');
      }
      
      console.log('\n3. Checking for invalid date formats...');
      const invalidDates = await RMA.find({
        $or: [
          { ascompRaisedDate: { $type: 'string' } },
          { customerErrorDate: { $type: 'string' } }
        ]
      }).select('rmaNumber ascompRaisedDate customerErrorDate');
      
      if (invalidDates.length > 0) {
        console.log(`   ⚠️  Found ${invalidDates.length} records with invalid date formats:`);
        invalidDates.forEach(record => {
          console.log(`      - ${record.rmaNumber}:`, {
            ascompRaisedDate: typeof record.ascompRaisedDate,
            customerErrorDate: typeof record.customerErrorDate
          });
        });
      } else {
        console.log('   ✅ All dates are properly formatted');
      }
      
      console.log('\n4. Checking for field mapping issues...');
      const mappingIssues = await RMA.find({
        $or: [
          { defectiveSerialNumber: { $regex: /^\d{3}-\d{6}-\d{2}$/ } }, // Part number pattern in serial field
          { replacedPartNumber: { $regex: /^(Assy\.|Assembly|Kit)/i } } // Part name in number field
        ]
      }).select('rmaNumber defectiveSerialNumber replacedPartNumber');
      
      if (mappingIssues.length > 0) {
        console.log(`   ⚠️  Found ${mappingIssues.length} records with field mapping issues:`);
        mappingIssues.forEach(record => {
          console.log(`      - ${record.rmaNumber}:`, {
            defectiveSerialNumber: record.defectiveSerialNumber,
            replacedPartNumber: record.replacedPartNumber
          });
        });
      } else {
        console.log('   ✅ No field mapping issues detected');
      }
      
      console.log('\n📋 Recommendations:');
      console.log('1. Check your CSV file for the 3 failed records');
      console.log('2. Verify that all required fields are present');
      console.log('3. Check date formats (should be YYYY-MM-DD)');
      console.log('4. Ensure no duplicate RMA numbers');
      console.log('5. Verify field mappings are correct');
      
    } else {
      console.log('🎉 All records were successfully uploaded!');
    }
    
    // Show sample of recent records
    console.log('\n📊 Sample of recent RMA records:');
    const recentRMAs = await RMA.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rmaNumber siteName productName serialNumber defectivePartNumber defectivePartName replacedPartNumber createdBy');
    
    recentRMAs.forEach((rma, index) => {
      console.log(`${index + 1}. ${rma.rmaNumber}:`);
      console.log(`   Site: ${rma.siteName}`);
      console.log(`   Product: ${rma.productName}`);
      console.log(`   Serial: ${rma.serialNumber}`);
      console.log(`   Defective Part: ${rma.defectivePartNumber} - ${rma.defectivePartName}`);
      console.log(`   Replaced Part: ${rma.replacedPartNumber}`);
      console.log(`   Created By: ${rma.createdBy}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error analyzing RMA import:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the analysis
analyzeRMAImportErrors();


