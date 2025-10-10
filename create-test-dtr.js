const mongoose = require('mongoose');
require('dotenv').config();

// Import the DTR model
const DTR = require('./backend/server/models/DTR');
const Projector = require('./backend/server/models/Projector');
const Site = require('./backend/server/models/Site');

async function createTestDTR() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://devgulati:devgulati123@cluster0.8qjqj.mongodb.net/crm?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // First, let's check if we have any projectors
    const projectors = await Projector.find().limit(1);
    console.log('Found projectors:', projectors.length);

    if (projectors.length === 0) {
      console.log('No projectors found. Creating a test projector first...');
      
      // Create a test site first
      const testSite = new Site({
        name: 'Test Site Mumbai',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        contact: {
          name: 'Test Manager',
          email: 'test@example.com',
          phone: '+91-9876543210'
        },
        type: 'Corporate Office'
      });
      
      await testSite.save();
      console.log('Created test site:', testSite._id);

      // Create a test projector
      const testProjector = new Projector({
        projectorNumber: 'PROJ-001',
        serialNumber: 'TEST-SERIAL-001',
        model: 'Epson EB-X41',
        brand: 'Epson',
        siteId: testSite._id,
        auditoriumId: 'AUD-001',
        status: 'Active',
        condition: 'Good',
        installDate: new Date('2024-01-01'),
        warrantyEnd: new Date('2025-01-01'),
        lastService: new Date('2024-01-15'),
        technician: 'Test Technician'
      });
      
      await testProjector.save();
      console.log('Created test projector:', testProjector._id);
    }

    // Get the first available projector
    const projector = await Projector.findOne();
    if (!projector) {
      throw new Error('No projectors available');
    }

    console.log('Using projector:', projector.serialNumber);

    // Create a test DTR
    const testDTR = new DTR({
      serialNumber: projector.serialNumber,
      complaintDescription: 'Test DTR - Projector not displaying any image, lamp indicator blinking red',
      openedBy: {
        name: 'Test User',
        designation: 'Site Manager',
        contact: '+91-9876543210'
      },
      priority: 'High',
      assignedTo: 'Test Technician',
      estimatedResolutionTime: '2 hours',
      notes: 'This is a test DTR created for testing purposes',
      errorDate: new Date(),
      unitModel: projector.model,
      problemName: 'Display Issue',
      actionTaken: 'Initial troubleshooting performed',
      remarks: 'Test remarks for DTR',
      callStatus: 'Open',
      caseSeverity: 'High'
    });

    await testDTR.save();
    console.log('✅ Created test DTR:', testDTR.caseId);
    console.log('DTR ID:', testDTR._id);
    console.log('Serial Number:', testDTR.serialNumber);
    console.log('Status:', testDTR.status);

    // Check total DTRs
    const totalDTRs = await DTR.countDocuments();
    console.log('Total DTRs in database:', totalDTRs);

  } catch (error) {
    console.error('Error creating test DTR:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestDTR();
