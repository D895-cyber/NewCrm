const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DTR = require('./backend/server/models/DTR');
const Site = require('./backend/server/models/Site');
const Projector = require('./backend/server/models/Projector');

// Sample sites
const sampleSites = [
  {
    name: 'TechCorp Mumbai Office',
    code: 'MUM001',
    address: {
      street: '123 Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    contact: {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@techcorp.com',
      phone: '+91-9876543210'
    }
  },
  {
    name: 'EduTech Bangalore Campus',
    code: 'BLR001',
    address: {
      street: '456 Education Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    },
    contact: {
      name: 'Priya Sharma',
      email: 'priya.sharma@edutech.edu',
      phone: '+91-9876543211'
    }
  },
  {
    name: 'MediCare Delhi Hospital',
    code: 'DEL001',
    address: {
      street: '789 Medical Center',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India'
    },
    contact: {
      name: 'Dr. Amit Patel',
      email: 'amit.patel@medicare.com',
      phone: '+91-9876543212'
    }
  }
];

// Sample projectors
const sampleProjectors = [
  {
    serialNumber: 'EP2024001',
    model: 'Epson EB-X41',
    brand: 'Epson',
    siteId: null, // Will be set after site creation
    installDate: new Date('2023-06-15'),
    warrantyEnd: new Date('2025-06-15'),
    lastService: new Date('2024-01-01')
  },
  {
    serialNumber: 'EP2024004',
    model: 'Epson EB-X06',
    brand: 'Epson',
    siteId: null,
    installDate: new Date('2023-08-20'),
    warrantyEnd: new Date('2025-08-20'),
    lastService: new Date('2024-01-05')
  },
  {
    serialNumber: 'BQ2024001',
    model: 'BenQ MW632ST',
    brand: 'BenQ',
    siteId: null,
    installDate: new Date('2023-09-10'),
    warrantyEnd: new Date('2025-09-10'),
    lastService: new Date('2024-01-10')
  }
];

// Sample DTRs
const sampleDTRs = [
  {
    serialNumber: 'EP2024001',
    siteName: 'TechCorp Mumbai Office',
    siteCode: 'MUM001',
    region: 'Maharashtra',
    complaintDescription: 'No display output, lamp indicator shows error',
    complaintDate: new Date('2024-01-10'),
    errorDate: new Date('2024-01-10'),
    unitModel: 'Epson EB-X41',
    problemName: 'Display Failure',
    actionTaken: 'Lamp assembly replacement required',
    remarks: 'Lamp hours exceeded, needs replacement',
    callStatus: 'Open',
    caseSeverity: 'High',
    openedBy: {
      name: 'Rajesh Kumar',
      designation: 'IT Manager',
      contact: '+91-9876543210'
    },
    status: 'Open',
    priority: 'High',
    assignedTo: null,
    estimatedResolutionTime: '2 days',
    notes: 'Critical issue affecting presentations'
  },
  {
    serialNumber: 'EP2024004',
    siteName: 'EduTech Bangalore Campus',
    siteCode: 'BLR001',
    region: 'Karnataka',
    complaintDescription: 'Dim display, flickering image, lamp hours exceeded',
    complaintDate: new Date('2024-01-11'),
    errorDate: new Date('2024-01-11'),
    unitModel: 'Epson EB-X06',
    problemName: 'Dim Display',
    actionTaken: 'Lamp replacement in progress',
    remarks: 'Lamp replacement scheduled',
    callStatus: 'In Progress',
    caseSeverity: 'Medium',
    openedBy: {
      name: 'Priya Sharma',
      designation: 'IT Coordinator',
      contact: '+91-9876543211'
    },
    status: 'In Progress',
    priority: 'Medium',
    assignedTo: null,
    estimatedResolutionTime: '1 day',
    notes: 'Educational content affected'
  },
  {
    serialNumber: 'BQ2024001',
    siteName: 'MediCare Delhi Hospital',
    siteCode: 'DEL001',
    region: 'Delhi',
    complaintDescription: 'Power issues, intermittent shutdowns, overheating',
    complaintDate: new Date('2024-01-12'),
    errorDate: new Date('2024-01-12'),
    unitModel: 'BenQ MW632ST',
    problemName: 'Power Issues',
    actionTaken: 'Power supply unit replacement completed',
    remarks: 'Critical medical equipment affected',
    callStatus: 'Closed',
    caseSeverity: 'Critical',
    openedBy: {
      name: 'Dr. Amit Patel',
      designation: 'Medical Director',
      contact: '+91-9876543212'
    },
    status: 'Closed',
    priority: 'Critical',
    assignedTo: null,
    estimatedResolutionTime: '4 hours',
    actualResolutionTime: '3 hours',
    notes: 'Medical presentation system - high priority',
    closedBy: {
      name: 'Technical Support',
      designation: 'Senior Technician',
      contact: '+91-9876543213',
      closedDate: new Date('2024-01-12')
    },
    closedReason: 'Resolved'
  }
];

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function createSampleData() {
  try {
    console.log('📊 Creating sample DTR data...\n');

    // Clear existing data
    await DTR.deleteMany({});
    await Projector.deleteMany({});
    await Site.deleteMany({});
    console.log('🧹 Cleared existing data\n');

    // Create Sites
    console.log('🏢 Creating sample sites...');
    const createdSites = await Site.insertMany(sampleSites);
    console.log(`✅ Created ${createdSites.length} sites\n`);

    // Update projectors with site IDs
    sampleProjectors.forEach((projector, index) => {
      projector.siteId = createdSites[index]._id;
    });

    // Create Projectors
    console.log('📽️ Creating sample projectors...');
    const createdProjectors = await Projector.insertMany(sampleProjectors);
    console.log(`✅ Created ${createdProjectors.length} projectors\n`);

    // Create DTRs
    console.log('📋 Creating sample DTRs...');
    const createdDTRs = await DTR.insertMany(sampleDTRs);
    console.log(`✅ Created ${createdDTRs.length} DTRs\n`);

    // Show summary
    console.log('📊 Sample Data Summary:');
    console.log(`   Sites: ${createdSites.length}`);
    console.log(`   Projectors: ${createdProjectors.length}`);
    console.log(`   DTRs: ${createdDTRs.length}`);

    console.log('\n🎯 Sample DTR data creation completed successfully!');
    console.log('🚀 You can now test the DTR functionality with real data.');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await createSampleData();
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  main();
}

module.exports = { createSampleData, sampleSites, sampleProjectors, sampleDTRs };

















