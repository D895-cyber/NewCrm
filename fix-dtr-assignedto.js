const mongoose = require('mongoose');
require('dotenv').config();

// Import the DTR model
const DTR = require('./backend/server/models/DTR');

async function fixDTRAssignedTo() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://devgulati:devgulati123@cluster0.8qjqj.mongodb.net/crm?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all DTRs
    const dtrs = await DTR.find({});
    console.log(`Found ${dtrs.length} DTRs in database`);

    let fixedCount = 0;

    for (const dtr of dtrs) {
      let needsUpdate = false;
      const updateData = {};

      // Check if assignedTo is a string and fix it
      if (dtr.assignedTo && typeof dtr.assignedTo === 'string') {
        console.log(`Fixing DTR ${dtr.caseId || dtr._id}: assignedTo is string "${dtr.assignedTo}"`);
        updateData.assignedTo = {
          name: dtr.assignedTo,
          role: 'technician',
          assignedDate: new Date()
        };
        needsUpdate = true;
      }

      // Check if assignedTo is null/undefined and set to null
      if (dtr.assignedTo === null || dtr.assignedTo === undefined) {
        updateData.assignedTo = null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await DTR.findByIdAndUpdate(dtr._id, updateData);
        fixedCount++;
        console.log(`✅ Fixed DTR ${dtr.caseId || dtr._id}`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} DTRs out of ${dtrs.length} total DTRs`);

    // Check if we have any DTRs now
    const totalDTRs = await DTR.countDocuments();
    console.log(`Total DTRs in database: ${totalDTRs}`);

    if (totalDTRs === 0) {
      console.log('No DTRs found. Creating a test DTR...');
      
      // Create a simple test DTR
      const testDTR = new DTR({
        serialNumber: 'TEST-SERIAL-001',
        complaintDescription: 'Test DTR - Projector not displaying any image',
        openedBy: {
          name: 'Test User',
          designation: 'Site Manager',
          contact: '+91-9876543210'
        },
        priority: 'High',
        assignedTo: {
          name: 'Test Technician',
          role: 'technician',
          assignedDate: new Date()
        },
        estimatedResolutionTime: '2 hours',
        notes: 'This is a test DTR',
        errorDate: new Date(),
        unitModel: 'Test Model',
        problemName: 'Display Issue',
        actionTaken: 'Initial troubleshooting',
        remarks: 'Test remarks',
        callStatus: 'Open',
        caseSeverity: 'High',
        siteName: 'Test Site',
        siteCode: 'TEST-001',
        region: 'Test Region'
      });

      await testDTR.save();
      console.log('✅ Created test DTR:', testDTR.caseId);
    }

  } catch (error) {
    console.error('Error fixing DTR assignedTo field:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixDTRAssignedTo();
