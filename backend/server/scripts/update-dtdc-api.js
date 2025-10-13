const mongoose = require('mongoose');
const DeliveryProvider = require('../models/DeliveryProvider');

console.log('🔧 Updating DTDC Provider with API Key');
console.log('=====================================\n');

async function updateDTDCProvider() {
  try {
    // Use the same connection as the main app
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find and update DTDC provider with API key
    const dtdcProvider = await DeliveryProvider.findOne({ code: 'DTDC' });
    
    if (dtdcProvider) {
      console.log('🔧 Updating DTDC provider with API key...');
      
      // Update with the provided API key
      dtdcProvider.apiKey = 'ned7t76p-n9tp-ospu-6yds-usycg3cko787';
      dtdcProvider.apiEndpoint = 'https://api.dtdc.com/v1';
      dtdcProvider.trackingEndpoint = 'https://www.dtdc.com/tracking/tracking-results.asp?strCnno={trackingNumber}';
      
      await dtdcProvider.save();
      console.log('✅ DTDC provider updated successfully');
      console.log('   - API Key: ned7t76p-n9tp-ospu-6yds-usycg3cko787');
      console.log('   - API Endpoint: https://api.dtdc.com/v1');
      console.log('   - Active:', dtdcProvider.isActive);
    } else {
      console.log('❌ DTDC provider not found in database');
    }

  } catch (error) {
    console.error('❌ Error updating DTDC provider:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

updateDTDCProvider();

















