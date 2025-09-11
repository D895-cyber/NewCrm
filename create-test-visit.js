import mongoose from 'mongoose';
import ServiceVisit from './server/models/ServiceVisit.js';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projectorcare');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create a test service visit
async function createTestVisit() {
  try {
    // Check if test visit already exists
    const existingVisit = await ServiceVisit.findOne({ visitId: 'test-visit-001' });
    
    if (existingVisit) {
      console.log('✅ Test visit already exists:', existingVisit.visitId);
      return existingVisit;
    }
    
    // Create new test visit
    const testVisit = new ServiceVisit({
      visitId: 'test-visit-001',
      fseId: 'FSE-001',
      fseName: 'Test FSE',
      siteId: 'SITE-001',
      siteName: 'Test Site',
      projectorSerial: 'PROJ-001',
      visitType: 'Scheduled Maintenance',
      scheduledDate: new Date(),
      status: 'Scheduled',
      priority: 'Medium',
      description: 'Test visit for photo-first workflow',
      
      // Initialize workflow status
      workflowStatus: {
        photosCaptured: false,
        serviceCompleted: false,
        reportGenerated: false,
        signatureCaptured: false,
        completed: false,
        lastUpdated: new Date()
      },
      
      // Initialize photo categories
      photoCategories: {
        beforeService: [],
        duringService: [],
        afterService: [],
        issuesFound: [],
        partsUsed: []
      },
      
      // Initialize site in-charge info
      siteInCharge: {
        name: 'Test Site In-Charge',
        phone: '+1234567890',
        email: 'siteincharge@test.com',
        designation: 'Site Manager',
        department: 'IT'
      }
    });
    
    const savedVisit = await testVisit.save();
    console.log('✅ Test visit created successfully:', savedVisit.visitId);
    console.log('📋 Visit Details:');
    console.log(`   - ID: ${savedVisit._id}`);
    console.log(`   - Visit ID: ${savedVisit.visitId}`);
    console.log(`   - Site: ${savedVisit.siteName}`);
    console.log(`   - Projector: ${savedVisit.projectorSerial}`);
    console.log(`   - Status: ${savedVisit.status}`);
    
    return savedVisit;
  } catch (error) {
    console.error('❌ Error creating test visit:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    const testVisit = await createTestVisit();
    
    console.log('\n🎯 Test Setup Complete!');
    console.log('📱 You can now test the photo-first workflow on your phone:');
    console.log(`   URL: http://your-server-ip:3001/mobile-test-build/photo-workflow-test.html`);
    console.log('\n📋 Test Visit Details:');
    console.log(`   - Visit ID: ${testVisit.visitId}`);
    console.log(`   - MongoDB ID: ${testVisit._id}`);
    console.log(`   - Site: ${testVisit.siteName}`);
    console.log(`   - Projector: ${testVisit.projectorSerial}`);
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Open the test page on your phone');
    console.log('3. Test the photo-first workflow');
    console.log('4. Check the debug info for any issues');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createTestVisit, connectDB };
