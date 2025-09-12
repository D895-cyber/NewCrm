const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import all models
const RMA = require('./server/models/RMA');
const DTR = require('./server/models/DTR');
const Projector = require('./server/models/Projector');
const Site = require('./server/models/Site');
const ServiceVisit = require('./server/models/ServiceVisit');
const ServiceReport = require('./server/models/ServiceReport');
const Service = require('./server/models/Service');
const SparePart = require('./server/models/SparePart');
const PurchaseOrder = require('./server/models/PurchaseOrder');
const AMCContract = require('./server/models/AMCContract');
const CallLog = require('./server/models/CallLog');
const FSE = require('./server/models/FSE');
const User = require('./server/models/User');

async function clearAllData() {
  try {
    console.log('🚀 Starting complete database cleanup for deployment...\n');
    console.log('⚠️  WARNING: This will remove ALL data from your database!\n');

    // Clear all collections
    const collections = [
      { name: 'RMA', model: RMA },
      { name: 'DTR', model: DTR },
      { name: 'Projector', model: Projector },
      { name: 'Site', model: Site },
      { name: 'ServiceVisit', model: ServiceVisit },
      { name: 'ServiceReport', model: ServiceReport },
      { name: 'Service', model: Service },
      { name: 'SparePart', model: SparePart },
      { name: 'PurchaseOrder', model: PurchaseOrder },
      { name: 'AMCContract', model: AMCContract },
      { name: 'CallLog', model: CallLog },
      { name: 'FSE', model: FSE },
      { name: 'User', model: User }
    ];

    let totalDeleted = 0;

    for (const collection of collections) {
      try {
        const count = await collection.model.countDocuments();
        if (count > 0) {
          const result = await collection.model.deleteMany({});
          console.log(`✅ ${collection.name}: Cleared ${result.deletedCount} records`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`✨ ${collection.name}: Already empty`);
        }
      } catch (error) {
        console.log(`⚠️  ${collection.name}: Error - ${error.message}`);
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total records removed: ${totalDeleted}`);
    console.log(`   Collections processed: ${collections.length}`);

    // Verify all collections are empty
    console.log('\n🔍 Verifying cleanup...');
    let allEmpty = true;
    
    for (const collection of collections) {
      try {
        const remainingCount = await collection.model.countDocuments();
        if (remainingCount > 0) {
          console.log(`   ❌ ${collection.name}: ${remainingCount} records remain`);
          allEmpty = false;
        } else {
          console.log(`   ✅ ${collection.name}: Clean (0 records)`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${collection.name}: Verification failed`);
        allEmpty = false;
      }
    }

    if (allEmpty) {
      console.log('\n🎉 SUCCESS: Database is completely clean and ready for deployment!');
      console.log('✨ All collections have been cleared successfully.');
    } else {
      console.log('\n⚠️  WARNING: Some collections still contain data.');
      console.log('   Please review and manually clear if needed.');
    }

    console.log('\n🚀 Your database is now ready for production deployment!');

  } catch (error) {
    console.error('❌ Critical error during cleanup:', error);
    console.log('   Please check your database connection and try again.');
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the function
clearAllData();
