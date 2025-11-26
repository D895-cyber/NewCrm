#!/usr/bin/env node

const mongoose = require('mongoose');
const RMA = require('../models/RMA');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: __dirname + '/../.env' });

// Sample RMA data for testing
const sampleRMAs = [
  {
    rmaNumber: 'RMA-2024-001',
    callLogNumber: 'CL-2024-001',
    rmaOrderNumber: 'PO-2024-001',
    ascompRaisedDate: new Date('2024-01-15'),
    customerErrorDate: new Date('2024-01-10'),
    siteName: 'Sample Site A',
    productName: 'Projector Model X',
    productPartNumber: 'PART-001',
    serialNumber: 'SN-001',
    defectivePartNumber: 'DEFECT-001',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'DEF-SN-001',
    symptoms: 'No display output',
    replacedPartNumber: 'REPLACE-001',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'REPL-SN-001',
    replacementNotes: 'Replaced under warranty',
    shippedDate: new Date('2024-01-20'),
    trackingNumber: 'TRK-001',
    shippedThru: 'Blue Dart',
    remarks: 'Urgent replacement needed',
    createdBy: 'John Doe',
    caseStatus: 'Under Review',
    approvalStatus: 'Pending Review',
    rmaReturnShippedDate: new Date('2024-02-01'),
    rmaReturnTrackingNumber: 'TRK-002',
    rmaReturnShippedThru: 'Blue Dart',
    daysCountShippedToSite: 5,
    daysCountReturnToCDS: 12,
    projectorSerial: 'SN-001',
    brand: 'Brand X',
    projectorModel: 'Model X',
    customerSite: 'Site A',
    priority: 'High',
    warrantyStatus: 'In Warranty',
    estimatedCost: 5000,
    notes: 'Replaced lamp assembly',
    shipping: {
      outbound: {
        trackingNumber: 'TRK-001',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-01-20'),
        estimatedDelivery: new Date('2024-01-23'),
        actualDelivery: new Date('2024-01-22'),
        status: 'delivered',
        trackingUrl: 'https://bluedart.com/track/TRK-001',
        lastUpdated: new Date(),
        weight: 2.5,
        insuranceValue: 5000,
        requiresSignature: true
      },
      return: {
        trackingNumber: 'TRK-002',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-01'),
        estimatedDelivery: new Date('2024-02-04'),
        status: 'in_transit',
        trackingUrl: 'https://bluedart.com/track/TRK-002',
        lastUpdated: new Date(),
        weight: 2.5,
        insuranceValue: 5000,
        requiresSignature: true
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 2,
      slaBreached: false
    }
  },
  {
    rmaNumber: 'RMA-2024-002',
    callLogNumber: 'CL-2024-002',
    rmaOrderNumber: 'PO-2024-002',
    ascompRaisedDate: new Date('2024-01-16'),
    customerErrorDate: new Date('2024-01-11'),
    siteName: 'Sample Site B',
    productName: 'Projector Model Y',
    productPartNumber: 'PART-002',
    serialNumber: 'SN-002',
    defectivePartNumber: 'DEFECT-002',
    defectivePartName: 'Power Supply',
    defectiveSerialNumber: 'DEF-SN-002',
    symptoms: 'Power issues',
    replacedPartNumber: 'REPLACE-002',
    replacedPartName: 'New Power Supply',
    replacedPartSerialNumber: 'REPL-SN-002',
    replacementNotes: 'Power supply replacement',
    shippedDate: new Date('2024-01-25'),
    trackingNumber: 'TRK-003',
    shippedThru: 'DTDC',
    remarks: 'Power supply replacement',
    createdBy: 'Jane Smith',
    caseStatus: 'Replacement Shipped',
    approvalStatus: 'Approved',
    rmaReturnShippedDate: new Date('2024-02-05'),
    rmaReturnTrackingNumber: 'TRK-004',
    rmaReturnShippedThru: 'DTDC',
    daysCountShippedToSite: 9,
    daysCountReturnToCDS: 11,
    projectorSerial: 'SN-002',
    brand: 'Brand Y',
    projectorModel: 'Model Y',
    customerSite: 'Site B',
    priority: 'Medium',
    warrantyStatus: 'In Warranty',
    estimatedCost: 7500,
    notes: 'Power supply replacement',
    shipping: {
      outbound: {
        trackingNumber: 'TRK-003',
        carrier: 'DTDC',
        carrierService: 'STANDARD',
        shippedDate: new Date('2024-01-25'),
        estimatedDelivery: new Date('2024-01-28'),
        actualDelivery: new Date('2024-01-27'),
        status: 'delivered',
        trackingUrl: 'https://dtdc.com/track/TRK-003',
        lastUpdated: new Date(),
        weight: 3.0,
        insuranceValue: 7500,
        requiresSignature: false
      },
      return: {
        trackingNumber: 'TRK-004',
        carrier: 'DTDC',
        carrierService: 'STANDARD',
        shippedDate: new Date('2024-02-05'),
        estimatedDelivery: new Date('2024-02-08'),
        status: 'in_transit',
        trackingUrl: 'https://dtdc.com/track/TRK-004',
        lastUpdated: new Date(),
        weight: 3.0,
        insuranceValue: 7500,
        requiresSignature: false
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 1,
      slaBreached: false
    }
  }
];

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function importRMAs() {
  try {
    console.log('📊 Starting RMA import...');
    
    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const rmaData of sampleRMAs) {
      try {
        // Check for duplicates
        const existingRMA = await RMA.findOne({
          $or: [
            { rmaNumber: rmaData.rmaNumber },
            { serialNumber: rmaData.serialNumber }
          ]
        });

        if (existingRMA) {
          console.log(`⚠️ Duplicate found: ${rmaData.rmaNumber}`);
          duplicateCount++;
          continue;
        }

        const rma = new RMA(rmaData);
        await rma.save();
        importedCount++;
        console.log(`✅ Imported RMA: ${rma.rmaNumber}`);
      } catch (error) {
        console.error(`❌ Error importing RMA ${rmaData.rmaNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`✅ Imported: ${importedCount}`);
    console.log(`⚠️ Duplicates: ${duplicateCount}`);
    console.log(`❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  }
}

async function showExistingRMAs() {
  try {
    const totalRMAs = await RMA.countDocuments();
    const recentRMAs = await RMA.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rmaNumber siteName productName caseStatus createdAt');

    console.log(`\n📊 Current RMA Status:`);
    console.log(`Total RMAs: ${totalRMAs}`);
    console.log('\nRecent RMAs:');
    recentRMAs.forEach(rma => {
      console.log(`- ${rma.rmaNumber}: ${rma.siteName} - ${rma.productName} (${rma.caseStatus})`);
    });
  } catch (error) {
    console.error('❌ Error fetching RMA status:', error);
  }
}

async function main() {
  console.log('🚀 RMA Import Script');
  console.log('==================\n');

  await connectToDatabase();
  await showExistingRMAs();
  await importRMAs();
  await showExistingRMAs();

  console.log('\n✅ Import script completed');
  process.exit(0);
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('RMA Import Script');
  console.log('================');
  console.log('');
  console.log('Usage: node import-rmas.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --status       Show current RMA status only');
  console.log('');
  console.log('This script imports sample RMA data into the database.');
  console.log('Make sure MongoDB is running and MONGODB_URI is set.');
  process.exit(0);
}

if (process.argv.includes('--status')) {
  connectToDatabase().then(showExistingRMAs).then(() => process.exit(0));
} else {
  main();
}











































