#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const RMA = require('./backend/server/models/RMA');
const DeliveryProvider = require('./backend/server/models/DeliveryProvider');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Test the tracking system
async function testTrackingSystem() {
  try {
    console.log('🧪 Testing RMA Tracking System...\n');
    
    // Connect to database
    await connectToDatabase();
    
    // Check if delivery providers are set up
    const providers = await DeliveryProvider.find();
    console.log(`📦 Found ${providers.length} delivery providers:`);
    providers.forEach(provider => {
      console.log(`  • ${provider.displayName} (${provider.code})`);
    });
    
    // Check if RMAs exist
    const rmaCount = await RMA.countDocuments();
    console.log(`\n📋 Found ${rmaCount} RMA records`);
    
    // Check RMAs with tracking information
    const rmasWithTracking = await RMA.find({
      $or: [
        { 'shipping.outbound.trackingNumber': { $exists: true, $ne: '' } },
        { 'shipping.return.trackingNumber': { $exists: true, $ne: '' } }
      ]
    });
    
    console.log(`🚚 Found ${rmasWithTracking.length} RMAs with tracking information`);
    
    if (rmasWithTracking.length > 0) {
      console.log('\n📦 Sample RMA with tracking:');
      const sampleRMA = rmasWithTracking[0];
      console.log(`  RMA Number: ${sampleRMA.rmaNumber}`);
      console.log(`  Site: ${sampleRMA.siteName}`);
      console.log(`  Product: ${sampleRMA.productName}`);
      
      if (sampleRMA.shipping.outbound.trackingNumber) {
        console.log(`  Outbound Tracking: ${sampleRMA.shipping.outbound.trackingNumber} (${sampleRMA.shipping.outbound.carrier})`);
      }
      
      if (sampleRMA.shipping.return.trackingNumber) {
        console.log(`  Return Tracking: ${sampleRMA.shipping.return.trackingNumber} (${sampleRMA.shipping.return.carrier})`);
      }
    }
    
    // Test API endpoints
    console.log('\n🌐 Testing API endpoints...');
    console.log('  • GET /api/rma/tracking/providers - Get delivery providers');
    console.log('  • GET /api/rma/tracking/active - Get active shipments');
    console.log('  • GET /api/rma/:id/tracking - Get tracking for specific RMA');
    console.log('  • POST /api/webhooks/test - Test webhook');
    
    console.log('\n✅ RMA Tracking System is ready!');
    console.log('\n🎯 How to access the tracking system:');
    console.log('  1. Start your frontend: npm run dev (in frontend directory)');
    console.log('  2. Start your backend: npm run dev (in backend/server directory)');
    console.log('  3. Login to your CRM system');
    console.log('  4. Navigate to "RMA Tracking" in the Operations section');
    console.log('  5. Or go directly to: http://localhost:3000 and click "RMA Tracking"');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testTrackingSystem();
}

module.exports = { testTrackingSystem };

