require('dotenv').config();
const mongoose = require('mongoose');
const DeliveryProvider = require('../models/DeliveryProvider');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const deliveryProviders = [
  {
    name: 'Blue Dart',
    code: 'BLUE_DART',
    displayName: 'Blue Dart Express',
    apiEndpoint: 'https://api.bluedart.com',
    trackingEndpoint: 'https://www.bluedart.com/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: true,
    supportedServices: [
      {
        name: 'Express',
        code: 'EXPRESS',
        estimatedDays: 1,
        cost: 150,
        description: 'Next day delivery'
      },
      {
        name: 'Standard',
        code: 'STANDARD',
        estimatedDays: 2,
        cost: 100,
        description: '2-day delivery'
      },
      {
        name: 'Economy',
        code: 'ECONOMY',
        estimatedDays: 3,
        cost: 80,
        description: '3-day delivery'
      }
    ],
    trackingFormat: {
      pattern: '^[A-Z]{2}[0-9]{9}[A-Z]{2}$',
      length: 13,
      prefix: 'BD',
      example: 'BD123456789IN'
    },
    coverage: {
      domestic: true,
      international: true,
      countries: ['IN', 'US', 'UK', 'AU', 'SG', 'AE'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-22-2383-0000',
      email: 'support@bluedart.com',
      website: 'https://www.bluedart.com',
      supportHours: '24/7'
    },
    performance: {
      averageDeliveryTime: 1.5,
      successRate: 98.5,
      customerRating: 4.2
    },
    config: {
      requiresSignature: true,
      supportsCOD: false,
      supportsInsurance: true,
      maxWeight: 30,
      maxDimensions: {
        length: 120,
        width: 80,
        height: 80
      }
    },
    logo: '/logos/blue-dart.png',
    description: 'Leading express logistics provider in India'
  },
  {
    name: 'DTDC',
    code: 'DTDC',
    displayName: 'DTDC Express Limited',
    apiEndpoint: 'https://api.dtdc.com',
    trackingEndpoint: 'https://www.dtdc.com/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: true,
    supportedServices: [
      {
        name: 'Express',
        code: 'EXPRESS',
        estimatedDays: 1,
        cost: 120,
        description: 'Next day delivery'
      },
      {
        name: 'Standard',
        code: 'STANDARD',
        estimatedDays: 2,
        cost: 90,
        description: '2-day delivery'
      },
      {
        name: 'Economy',
        code: 'ECONOMY',
        estimatedDays: 4,
        cost: 70,
        description: '4-day delivery'
      }
    ],
    trackingFormat: {
      pattern: '^[0-9]{10,12}$',
      length: 12,
      prefix: '',
      example: '123456789012'
    },
    coverage: {
      domestic: true,
      international: true,
      countries: ['IN', 'US', 'UK', 'AU', 'SG', 'AE', 'CA'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-80-2535-0000',
      email: 'support@dtdc.com',
      website: 'https://www.dtdc.com',
      supportHours: '9 AM - 6 PM'
    },
    performance: {
      averageDeliveryTime: 2.0,
      successRate: 97.0,
      customerRating: 4.0
    },
    config: {
      requiresSignature: true,
      supportsCOD: true,
      supportsInsurance: true,
      maxWeight: 25,
      maxDimensions: {
        length: 100,
        width: 75,
        height: 75
      }
    },
    logo: '/logos/dtdc.png',
    description: 'Comprehensive logistics solutions across India and globally'
  },
  {
    name: 'FedEx',
    code: 'FEDEX',
    displayName: 'FedEx Corporation',
    apiEndpoint: 'https://api.fedex.com',
    trackingEndpoint: 'https://www.fedex.com/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: true,
    supportedServices: [
      {
        name: 'International Priority',
        code: 'IP',
        estimatedDays: 1,
        cost: 500,
        description: 'Next day international delivery'
      },
      {
        name: 'International Economy',
        code: 'IE',
        estimatedDays: 3,
        cost: 350,
        description: '3-day international delivery'
      },
      {
        name: 'Domestic Express',
        code: 'DE',
        estimatedDays: 1,
        cost: 200,
        description: 'Next day domestic delivery'
      }
    ],
    trackingFormat: {
      pattern: '^[0-9]{12}$',
      length: 12,
      prefix: '',
      example: '123456789012'
    },
    coverage: {
      domestic: true,
      international: true,
      countries: ['IN', 'US', 'UK', 'AU', 'SG', 'AE', 'CA', 'DE', 'FR', 'JP'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-22-6678-0000',
      email: 'support@fedex.com',
      website: 'https://www.fedex.com',
      supportHours: '24/7'
    },
    performance: {
      averageDeliveryTime: 1.2,
      successRate: 99.0,
      customerRating: 4.5
    },
    config: {
      requiresSignature: true,
      supportsCOD: false,
      supportsInsurance: true,
      maxWeight: 68,
      maxDimensions: {
        length: 150,
        width: 100,
        height: 100
      }
    },
    logo: '/logos/fedex.png',
    description: 'Global express transportation and logistics services'
  },
  {
    name: 'DHL',
    code: 'DHL',
    displayName: 'DHL Express',
    apiEndpoint: 'https://api.dhl.com',
    trackingEndpoint: 'https://www.dhl.com/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: true,
    supportedServices: [
      {
        name: 'Express Worldwide',
        code: 'EW',
        estimatedDays: 1,
        cost: 450,
        description: 'Next day worldwide delivery'
      },
      {
        name: 'Express 12:00',
        code: 'E12',
        estimatedDays: 1,
        cost: 600,
        description: 'Next day delivery by 12:00'
      },
      {
        name: 'Express 10:30',
        code: 'E1030',
        estimatedDays: 1,
        cost: 750,
        description: 'Next day delivery by 10:30'
      }
    ],
    trackingFormat: {
      pattern: '^[0-9]{10}$',
      length: 10,
      prefix: '',
      example: '1234567890'
    },
    coverage: {
      domestic: true,
      international: true,
      countries: ['IN', 'US', 'UK', 'AU', 'SG', 'AE', 'CA', 'DE', 'FR', 'JP', 'CN'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-22-6678-0000',
      email: 'support@dhl.com',
      website: 'https://www.dhl.com',
      supportHours: '24/7'
    },
    performance: {
      averageDeliveryTime: 1.1,
      successRate: 99.2,
      customerRating: 4.6
    },
    config: {
      requiresSignature: true,
      supportsCOD: false,
      supportsInsurance: true,
      maxWeight: 70,
      maxDimensions: {
        length: 120,
        width: 80,
        height: 80
      }
    },
    logo: '/logos/dhl.png',
    description: 'International express mail and logistics services'
  },
  {
    name: 'India Post',
    code: 'INDIA_POST',
    displayName: 'India Post',
    apiEndpoint: 'https://api.indiapost.gov.in',
    trackingEndpoint: 'https://www.indiapost.gov.in/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: true,
    supportedServices: [
      {
        name: 'Speed Post',
        code: 'SP',
        estimatedDays: 2,
        cost: 50,
        description: '2-day domestic delivery'
      },
      {
        name: 'Registered Post',
        code: 'RP',
        estimatedDays: 5,
        cost: 25,
        description: '5-day domestic delivery'
      },
      {
        name: 'International EMS',
        code: 'EMS',
        estimatedDays: 7,
        cost: 200,
        description: '7-day international delivery'
      }
    ],
    trackingFormat: {
      pattern: '^[A-Z]{2}[0-9]{9}[A-Z]{2}$',
      length: 13,
      prefix: 'IN',
      example: 'IN123456789IN'
    },
    coverage: {
      domestic: true,
      international: true,
      countries: ['IN', 'US', 'UK', 'AU', 'SG', 'AE', 'CA', 'DE', 'FR', 'JP', 'CN', 'BR'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-11-2309-6000',
      email: 'support@indiapost.gov.in',
      website: 'https://www.indiapost.gov.in',
      supportHours: '9 AM - 5 PM'
    },
    performance: {
      averageDeliveryTime: 3.5,
      successRate: 95.0,
      customerRating: 3.8
    },
    config: {
      requiresSignature: true,
      supportsCOD: true,
      supportsInsurance: true,
      maxWeight: 20,
      maxDimensions: {
        length: 100,
        width: 60,
        height: 60
      }
    },
    logo: '/logos/india-post.png',
    description: 'Government postal service covering all of India'
  },
  {
    name: 'Delhivery',
    code: 'DELHIVERY',
    displayName: 'Delhivery Limited',
    apiEndpoint: 'https://api.delhivery.com',
    trackingEndpoint: 'https://www.delhivery.com/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: false,
    supportedServices: [
      {
        name: 'Express',
        code: 'EXPRESS',
        estimatedDays: 1,
        cost: 100,
        description: 'Next day delivery'
      },
      {
        name: 'Standard',
        code: 'STANDARD',
        estimatedDays: 2,
        cost: 80,
        description: '2-day delivery'
      },
      {
        name: 'Economy',
        code: 'ECONOMY',
        estimatedDays: 3,
        cost: 60,
        description: '3-day delivery'
      }
    ],
    trackingFormat: {
      pattern: '^[0-9]{10,12}$',
      length: 12,
      prefix: '',
      example: '123456789012'
    },
    coverage: {
      domestic: true,
      international: false,
      countries: ['IN'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-11-4300-0000',
      email: 'support@delhivery.com',
      website: 'https://www.delhivery.com',
      supportHours: '9 AM - 6 PM'
    },
    performance: {
      averageDeliveryTime: 1.8,
      successRate: 96.5,
      customerRating: 4.1
    },
    config: {
      requiresSignature: true,
      supportsCOD: true,
      supportsInsurance: true,
      maxWeight: 30,
      maxDimensions: {
        length: 120,
        width: 80,
        height: 80
      }
    },
    logo: '/logos/delhivery.png',
    description: 'E-commerce focused logistics and supply chain services'
  },
  {
    name: 'Ecom Express',
    code: 'ECOM_EXPRESS',
    displayName: 'Ecom Express Private Limited',
    apiEndpoint: 'https://api.ecom-express.com',
    trackingEndpoint: 'https://www.ecom-express.com/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: false,
    supportedServices: [
      {
        name: 'Express',
        code: 'EXPRESS',
        estimatedDays: 1,
        cost: 90,
        description: 'Next day delivery'
      },
      {
        name: 'Standard',
        code: 'STANDARD',
        estimatedDays: 2,
        cost: 70,
        description: '2-day delivery'
      },
      {
        name: 'Economy',
        code: 'ECONOMY',
        estimatedDays: 3,
        cost: 50,
        description: '3-day delivery'
      }
    ],
    trackingFormat: {
      pattern: '^[0-9]{10,12}$',
      length: 12,
      prefix: '',
      example: '123456789012'
    },
    coverage: {
      domestic: true,
      international: false,
      countries: ['IN'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-11-4300-0000',
      email: 'support@ecom-express.com',
      website: 'https://www.ecom-express.com',
      supportHours: '9 AM - 6 PM'
    },
    performance: {
      averageDeliveryTime: 2.0,
      successRate: 96.0,
      customerRating: 4.0
    },
    config: {
      requiresSignature: true,
      supportsCOD: true,
      supportsInsurance: true,
      maxWeight: 25,
      maxDimensions: {
        length: 100,
        width: 75,
        height: 75
      }
    },
    logo: '/logos/ecom-express.png',
    description: 'E-commerce logistics and last-mile delivery services'
  },
  {
    name: 'XpressBees',
    code: 'XPRESSBEES',
    displayName: 'XpressBees Logistics Private Limited',
    apiEndpoint: 'https://api.xpressbees.com',
    trackingEndpoint: 'https://www.xpressbees.com/track/{trackingNumber}',
    isActive: true,
    isDomestic: true,
    isInternational: false,
    supportedServices: [
      {
        name: 'Express',
        code: 'EXPRESS',
        estimatedDays: 1,
        cost: 85,
        description: 'Next day delivery'
      },
      {
        name: 'Standard',
        code: 'STANDARD',
        estimatedDays: 2,
        cost: 65,
        description: '2-day delivery'
      },
      {
        name: 'Economy',
        code: 'ECONOMY',
        estimatedDays: 3,
        cost: 45,
        description: '3-day delivery'
      }
    ],
    trackingFormat: {
      pattern: '^[0-9]{10,12}$',
      length: 12,
      prefix: '',
      example: '123456789012'
    },
    coverage: {
      domestic: true,
      international: false,
      countries: ['IN'],
      states: ['All Indian States']
    },
    contact: {
      phone: '+91-20-6700-0000',
      email: 'support@xpressbees.com',
      website: 'https://www.xpressbees.com',
      supportHours: '9 AM - 6 PM'
    },
    performance: {
      averageDeliveryTime: 1.9,
      successRate: 95.5,
      customerRating: 3.9
    },
    config: {
      requiresSignature: true,
      supportsCOD: true,
      supportsInsurance: true,
      maxWeight: 25,
      maxDimensions: {
        length: 100,
        width: 75,
        height: 75
      }
    },
    logo: '/logos/xpressbees.png',
    description: 'Technology-driven logistics and supply chain solutions'
  }
];

async function initializeDeliveryProviders() {
  try {
    console.log('🚀 Initializing delivery providers...');
    
    // Clear existing providers
    await DeliveryProvider.deleteMany({});
    console.log('✅ Cleared existing delivery providers');
    
    // Insert new providers
    const insertedProviders = await DeliveryProvider.insertMany(deliveryProviders);
    console.log(`✅ Successfully inserted ${insertedProviders.length} delivery providers`);
    
    // Display summary
    console.log('\n📋 Delivery Providers Summary:');
    insertedProviders.forEach(provider => {
      console.log(`  • ${provider.displayName} (${provider.code}) - ${provider.supportedServices.length} services`);
    });
    
    console.log('\n🎉 Delivery providers initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing delivery providers:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the initialization
initializeDeliveryProviders();

