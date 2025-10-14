const mongoose = require('mongoose');
const DeliveryProvider = require('../models/DeliveryProvider');

console.log('🔧 Setting up DTDC Delivery Provider');
console.log('====================================\n');

async function setupDTDCProvider() {
  try {
    // Use the same connection as the main app
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if DTDC provider already exists
    const existingProvider = await DeliveryProvider.findOne({ code: 'DTDC' });
    
    if (existingProvider) {
      console.log('✅ DTDC provider already exists');
      console.log('   - Name:', existingProvider.name);
      console.log('   - Code:', existingProvider.code);
      console.log('   - Active:', existingProvider.isActive);
    } else {
      console.log('🔧 Creating DTDC provider...');
      
      // Create DTDC provider with minimal required fields
      const dtdcProvider = new DeliveryProvider({
        name: 'DTDC',
        code: 'DTDC',
        displayName: 'DTDC Express Limited',
        apiEndpoint: 'https://api.dtdc.com/v1',
        trackingEndpoint: 'https://www.dtdc.com/tracking/tracking-results.asp?strCnno={trackingNumber}',
        isActive: true,
        isDomestic: true,
        supportedServices: [
          {
            name: 'Standard',
            code: 'STANDARD',
            estimatedDays: 2,
            cost: 100,
            description: 'Standard delivery'
          }
        ],
        trackingFormat: {
          pattern: '^[A-Z0-9]{8,12}$',
          example: 'D30048484'
        },
        contact: {
          website: 'https://www.dtdc.com'
        }
      });

      await dtdcProvider.save();
      console.log('✅ DTDC provider created successfully');
    }

    // List all active providers
    const activeProviders = await DeliveryProvider.find({ isActive: true });
    console.log('\n📋 Active Delivery Providers:');
    activeProviders.forEach(provider => {
      console.log(`   - ${provider.name} (${provider.code})`);
    });

  } catch (error) {
    console.error('❌ Error setting up DTDC provider:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

setupDTDCProvider();


















