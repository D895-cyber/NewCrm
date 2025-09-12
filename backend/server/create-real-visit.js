const mongoose = require('mongoose');
const ServiceVisit = require('./models/ServiceVisit');
const Site = require('./models/Site');
const FSE = require('./models/FSE');

async function createRealVisit() {
  try {
    await mongoose.connect('mongodb://localhost:27017/projector_warranty');
    console.log('Connected to MongoDB');
    
    // Create a real service visit
    const realVisit = new ServiceVisit({
      visitId: 'VISIT-REAL-001',
      fseId: 'FSE-001',
      fseName: 'Challa',
      siteId: 'SITE-REAL-001',
      siteName: 'Telangana Hyderabad RK Cineplex Mall',
      projectorSerial: '407799009',
      visitType: 'Scheduled Maintenance',
      scheduledDate: new Date().toISOString(),
      status: 'In Progress',
      priority: 'Medium',
      description: 'Real service visit for photo upload testing',
      photos: []
    });
    
    await realVisit.save();
    console.log('✅ Real service visit created:', realVisit.visitId);
    console.log('📁 Projector:', realVisit.projectorSerial);
    console.log('👤 FSE:', realVisit.fseName);
    console.log('📍 Site:', realVisit.siteName);
    console.log('🆔 Visit ID for frontend:', realVisit._id);
    
  } catch (error) {
    console.error('❌ Error creating real visit:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createRealVisit(); 